import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import pino from "pino";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
  WASocket,
} from "@whiskeysockets/baileys";

export type WhatsAppConnectionStatus = "disconnected" | "connecting" | "qr_ready" | "connected";

export interface WhatsAppState {
  userId: string;
  status: WhatsAppConnectionStatus;
  isConnected: boolean;
  qrCode: string | null;
  rawQr?: string | null;
  phoneNumber: string | null;
  pushName: string | null;
  lastConnectedAt: string | null;
  lastError: string | null;
}

const SESSIONS_ROOT_DIR = path.join(process.cwd(), "data", "wa-sessions");
const LEGACY_SESSION_DIR = path.join(process.cwd(), "data", "wa-session");

export function sanitizeUserId(userId: string | undefined | null): string {
  if (!userId || typeof userId !== "string") return "user-utama";
  const clean = userId.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
  return clean || "user-utama";
}

export class WhatsAppGatewayManager {
  public readonly userId: string;
  private readonly sessionDir: string;
  private sock: WASocket | null = null;
  private status: WhatsAppConnectionStatus = "disconnected";
  private qrCode: string | null = null;
  private rawQr: string | null = null;
  private phoneNumber: string | null = null;
  private pushName: string | null = null;
  private lastConnectedAt: string | null = null;
  private lastError: string | null = null;
  private isInitializing: boolean = false;
  private reconnectAttempts: number = 0;
  private activeInitPromise: Promise<WhatsAppState> | null = null;
  private readinessResolvers: Array<() => void> = [];

  constructor(userId: string = "user-utama") {
    this.userId = sanitizeUserId(userId);
    this.sessionDir = path.join(SESSIONS_ROOT_DIR, this.userId);

    // Ensure session directory exists
    try {
      if (!fs.existsSync(this.sessionDir)) {
        fs.mkdirSync(this.sessionDir, { recursive: true });
      }
    } catch (err) {
      console.error(`[WhatsApp:${this.userId}] Failed to create session directory:`, err);
    }
  }

  private notifyReadiness() {
    const listeners = [...this.readinessResolvers];
    this.readinessResolvers = [];
    for (const resolve of listeners) {
      try {
        resolve();
      } catch {}
    }
  }

  private waitForReadiness(timeoutMs = 7000): Promise<WhatsAppState> {
    // If already in a definitive terminal state, return immediately
    if (this.status === "connected" || (this.status === "qr_ready" && Boolean(this.qrCode))) {
      return Promise.resolve(this.getState());
    }

    return new Promise<WhatsAppState>((resolve) => {
      let resolved = false;
      let timer: NodeJS.Timeout | null = null;

      const onReady = () => {
        if (resolved) return;
        resolved = true;
        if (timer) clearTimeout(timer);
        this.readinessResolvers = this.readinessResolvers.filter((r) => r !== onReady);
        resolve(this.getState());
      };

      timer = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        this.readinessResolvers = this.readinessResolvers.filter((r) => r !== onReady);
        resolve(this.getState());
      }, timeoutMs);

      this.readinessResolvers.push(onReady);

      // Check again after registering in case it fired synchronously
      if (this.status === "connected" || (this.status === "qr_ready" && Boolean(this.qrCode))) {
        onReady();
      }
    });
  }

  /**
   * Check if there are existing credentials saved on disk for this user
   */
  public hasSavedSession(): boolean {
    try {
      const credsPath = path.join(this.sessionDir, "creds.json");
      return fs.existsSync(credsPath);
    } catch {
      return false;
    }
  }

  /**
   * Get current connection status & info for this user (Guaranteed 100% valid JSON serializable)
   */
  public getState(): WhatsAppState {
    return {
      userId: this.userId,
      status: this.status,
      isConnected: this.status === "connected",
      qrCode: this.qrCode || null,
      phoneNumber: this.phoneNumber || null,
      pushName: this.pushName || null,
      lastConnectedAt: this.lastConnectedAt || null,
      lastError: this.lastError || null,
    };
  }

  /**
   * Initialize or restore WhatsApp connection for this user.
   * Ensures the server NEVER returns prematurely before the socket is ready or QR generated.
   */
  public async init(forceFresh: boolean = false): Promise<WhatsAppState> {
    // 1. If already connected with active socket and fresh not requested
    if (this.status === "connected" && this.sock && !forceFresh) {
      return this.getState();
    }

    // 2. If QR is already generated and ready to scan and fresh not requested
    if (this.status === "qr_ready" && this.qrCode && !forceFresh) {
      return this.getState();
    }

    // 3. If an initialization is already running and not forceFresh, share the same active promise
    if (this.activeInitPromise && !forceFresh) {
      return this.activeInitPromise;
    }

    this.activeInitPromise = (async () => {
      try {
        return await this.executeInit(forceFresh);
      } finally {
        this.activeInitPromise = null;
      }
    })();

    return this.activeInitPromise;
  }

  private async executeInit(forceFresh: boolean): Promise<WhatsAppState> {
    this.isInitializing = true;
    this.status = "connecting";
    this.lastError = null;
    this.reconnectAttempts = 0;

    if (forceFresh) {
      this.qrCode = null;
      await this.cleanupSessionFiles();
    }

    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);

      // Close previous socket if open and detach old listeners to prevent stale events
      if (this.sock) {
        try {
          this.sock.ev.removeAllListeners("connection.update");
          this.sock.ev.removeAllListeners("creds.update");
          this.sock.end(undefined);
        } catch {}
        this.sock = null;
      }

      const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        browser: Browsers.ubuntu("Chrome"),
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        generateHighQualityLinkPreview: true,
      });

      this.sock = sock;

      sock.ev.on("creds.update", saveCreds);

      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            this.qrCode = await QRCode.toDataURL(qr, {
              width: 340,
              margin: 2,
              color: {
                dark: "#0f172a",
                light: "#ffffff",
              },
            });
            this.status = "qr_ready";
            this.lastError = null;
            console.log(`[WhatsApp:${this.userId}] New QR Code generated successfully`);
            this.notifyReadiness();
          } catch (qrErr: any) {
            console.error(`[WhatsApp:${this.userId}] Failed to generate QR Code data URL:`, qrErr);
            this.lastError = "Gagal membuat gambar QR Code.";
            this.notifyReadiness();
          }
        }

        if (connection === "open") {
          this.status = "connected";
          this.qrCode = null;
          this.reconnectAttempts = 0;
          this.lastConnectedAt = new Date().toISOString();
          this.lastError = null;

          const rawId = sock.user?.id || "";
          this.phoneNumber = rawId.split(":")[0].replace(/\D/g, "");
          this.pushName = sock.user?.name || null;

          console.log(`[WhatsApp:${this.userId}] Connected successfully! Number: ${this.phoneNumber}, Name: ${this.pushName}`);
          this.notifyReadiness();
        } else if (connection === "close") {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;

          console.log(`[WhatsApp:${this.userId}] Connection closed. Status code: ${statusCode}, isLoggedOut: ${isLoggedOut}`);

          if (isLoggedOut) {
            this.status = "disconnected";
            this.qrCode = null;
            this.phoneNumber = null;
            this.pushName = null;
            this.lastError = "Sesi WhatsApp telah keluar. Silakan scan QR ulang.";
            await this.cleanupSessionFiles();
            this.notifyReadiness();
          } else if (this.hasSavedSession()) {
            // Reconnection attempt for authenticated user
            this.status = "connecting";
            if (this.reconnectAttempts < 5) {
              this.reconnectAttempts++;
              const delay = Math.min(this.reconnectAttempts * 3000, 15000);
              console.log(`[WhatsApp:${this.userId}] Reconnecting saved session in ${delay}ms (Attempt ${this.reconnectAttempts})`);
              setTimeout(() => {
                this.init(false).catch((err) => {
                  console.error(`[WhatsApp:${this.userId}] Auto-reconnect failed:`, err);
                });
              }, delay);
            } else {
              this.status = "disconnected";
              this.lastError = "Koneksi WhatsApp terputus. Silakan sambungkan ulang.";
              this.notifyReadiness();
            }
          } else {
            // Unpaired session: QR expired or refreshed by WhatsApp
            console.log(`[WhatsApp:${this.userId}] QR scan session expired/closed (status ${statusCode}). Refreshing QR...`);
            setTimeout(() => {
              this.init(true).catch((err) => {
                console.error(`[WhatsApp:${this.userId}] Auto-refresh QR failed:`, err);
              });
            }, 800);
          }
        } else if (connection === "connecting") {
          if (!this.qrCode && this.status !== "connected") {
            this.status = "connecting";
          }
        }
      });

      // Wait until socket readiness is reached (QR code ready or connection opened)
      return await this.waitForReadiness(7000);
    } catch (err: any) {
      console.error(`[WhatsApp:${this.userId}] Error initializing socket:`, err);
      this.status = "disconnected";
      this.lastError = err.message || "Gagal menginisialisasi WhatsApp Gateway.";
      this.notifyReadiness();
      return this.getState();
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Disconnect and logout WhatsApp session for this user
   */
  public async logout(): Promise<void> {
    try {
      if (this.sock) {
        try {
          this.sock.ev.removeAllListeners("connection.update");
          this.sock.ev.removeAllListeners("creds.update");
        } catch {}
        await this.sock.logout().catch(() => {});
        this.sock.end(undefined);
        this.sock = null;
      }
    } catch (err) {
      console.warn(`[WhatsApp:${this.userId}] Error during socket logout:`, err);
    }

    await this.cleanupSessionFiles();
    this.status = "disconnected";
    this.qrCode = null;
    this.phoneNumber = null;
    this.pushName = null;
    this.lastConnectedAt = null;
    this.lastError = null;
    this.reconnectAttempts = 0;
    this.activeInitPromise = null;
    this.notifyReadiness();
  }

  /**
   * Clean up session files on disk for this user
   */
  private async cleanupSessionFiles(): Promise<void> {
    try {
      if (fs.existsSync(this.sessionDir)) {
        const files = fs.readdirSync(this.sessionDir);
        for (const file of files) {
          fs.rmSync(path.join(this.sessionDir, file), { recursive: true, force: true });
        }
      }
    } catch (err) {
      console.error(`[WhatsApp:${this.userId}] Error cleaning session files:`, err);
    }
  }

  /**
   * Send WhatsApp text message to any phone number from this user's account
   */
  public async sendMessage(target: string, message: string): Promise<{ success: boolean; message: string; messageId?: string }> {
    if (this.status !== "connected" || !this.sock) {
      return {
        success: false,
        message: `WhatsApp untuk akun ini belum terhubung. Silakan scan QR di Pengaturan WhatsApp akun ${this.userId}.`,
      };
    }

    if (!target || !message.trim()) {
      return {
        success: false,
        message: "Nomor WhatsApp tujuan dan isi pesan tidak boleh kosong.",
      };
    }

    // Clean & format Indonesian/international target number
    let cleanNumber = target.toString().replace(/[^\d]/g, "");
    if (cleanNumber.startsWith("0")) {
      cleanNumber = "62" + cleanNumber.slice(1);
    } else if (cleanNumber.startsWith("62")) {
      // already in 62 format
    } else if (cleanNumber.length > 8 && !cleanNumber.startsWith("62")) {
      cleanNumber = "62" + cleanNumber;
    }

    if (cleanNumber.length < 9) {
      return {
        success: false,
        message: "Nomor WhatsApp tujuan tidak valid (terlalu pendek).",
      };
    }

    const jid = `${cleanNumber}@s.whatsapp.net`;

    try {
      const sent = await this.sock.sendMessage(jid, { text: message.trim() });
      return {
        success: true,
        message: "Pesan WhatsApp berhasil dikirim secara otomatis!",
        messageId: sent?.key?.id || undefined,
      };
    } catch (err: any) {
      console.error(`[WhatsApp:${this.userId}] Send message failed:`, err);
      return {
        success: false,
        message: err.message || "Gagal mengirim pesan WhatsApp. Pastikan nomor tujuan valid dan WhatsApp HP Anda online.",
      };
    }
  }
}

// Multi-session pool mapping
const activeManagers = new Map<string, WhatsAppGatewayManager>();

export function getWhatsAppManager(userId?: string): WhatsAppGatewayManager {
  const safeId = sanitizeUserId(userId);
  let mgr = activeManagers.get(safeId);
  if (!mgr) {
    mgr = new WhatsAppGatewayManager(safeId);
    activeManagers.set(safeId, mgr);
  }
  return mgr;
}

// Legacy export for backwards compatibility
export const waManager = getWhatsAppManager("user-utama");

// Migrate legacy single session if needed
try {
  const legacyCreds = path.join(LEGACY_SESSION_DIR, "creds.json");
  const targetDir = path.join(SESSIONS_ROOT_DIR, "user-utama");
  const targetCreds = path.join(targetDir, "creds.json");
  if (fs.existsSync(legacyCreds) && !fs.existsSync(targetCreds)) {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const legacyFiles = fs.readdirSync(LEGACY_SESSION_DIR);
    for (const f of legacyFiles) {
      fs.copyFileSync(path.join(LEGACY_SESSION_DIR, f), path.join(targetDir, f));
    }
    console.log("[WhatsApp] Migrated legacy session to user-utama multi-session store.");
  }
} catch (e) {
  console.warn("[WhatsApp] Legacy session migration note:", e);
}

// Automatically restore all existing user sessions found on disk
try {
  if (fs.existsSync(SESSIONS_ROOT_DIR)) {
    const userDirs = fs.readdirSync(SESSIONS_ROOT_DIR);
    for (const uDir of userDirs) {
      const userCredsPath = path.join(SESSIONS_ROOT_DIR, uDir, "creds.json");
      if (fs.existsSync(userCredsPath)) {
        console.log(`[WhatsApp] Restoring saved WhatsApp session for user: ${uDir}...`);
        const mgr = getWhatsAppManager(uDir);
        mgr.init(false).catch((err) => {
          console.error(`[WhatsApp] Error auto-restoring session for ${uDir}:`, err);
        });
      }
    }
  }
} catch (err) {
  console.error("[WhatsApp] Error scanning saved sessions:", err);
}
