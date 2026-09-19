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
  status: WhatsAppConnectionStatus;
  isConnected: boolean;
  qrCode: string | null;
  phoneNumber: string | null;
  pushName: string | null;
  lastConnectedAt: string | null;
  lastError: string | null;
}

const SESSION_DIR = path.join(process.cwd(), "data", "wa-session");

class WhatsAppGatewayManager {
  private sock: WASocket | null = null;
  private status: WhatsAppConnectionStatus = "disconnected";
  private qrCode: string | null = null;
  private phoneNumber: string | null = null;
  private pushName: string | null = null;
  private lastConnectedAt: string | null = null;
  private lastError: string | null = null;
  private isInitializing: boolean = false;
  private reconnectAttempts: number = 0;

  constructor() {
    // Ensure session directory exists
    try {
      if (!fs.existsSync(SESSION_DIR)) {
        fs.mkdirSync(SESSION_DIR, { recursive: true });
      }
    } catch (err) {
      console.error("[WhatsApp] Failed to create session directory:", err);
    }
  }

  /**
   * Check if there are existing credentials saved on disk
   */
  public hasSavedSession(): boolean {
    try {
      const credsPath = path.join(SESSION_DIR, "creds.json");
      return fs.existsSync(credsPath);
    } catch {
      return false;
    }
  }

  /**
   * Get current connection status & info
   */
  public getState(): WhatsAppState {
    return {
      status: this.status,
      isConnected: this.status === "connected",
      qrCode: this.qrCode,
      phoneNumber: this.phoneNumber,
      pushName: this.pushName,
      lastConnectedAt: this.lastConnectedAt,
      lastError: this.lastError,
    };
  }

  /**
   * Initialize or restore WhatsApp connection
   */
  public async init(forceFresh: boolean = false): Promise<WhatsAppState> {
    if (this.isInitializing) {
      return this.getState();
    }

    if (this.status === "connected" && this.sock && !forceFresh) {
      return this.getState();
    }

    this.isInitializing = true;
    this.status = "connecting";
    this.lastError = null;

    if (forceFresh) {
      await this.cleanupSessionFiles();
    }

    try {
      const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

      // Close previous socket if open
      if (this.sock) {
        try {
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
              width: 320,
              margin: 2,
              color: {
                dark: "#0f172a",
                light: "#ffffff",
              },
            });
            this.status = "qr_ready";
            this.lastError = null;
            console.log("[WhatsApp] New QR Code generated successfully");
          } catch (qrErr: any) {
            console.error("[WhatsApp] Failed to generate QR Code data URL:", qrErr);
            this.lastError = "Gagal membuat gambar QR Code.";
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

          console.log(`[WhatsApp] Connected successfully! Number: ${this.phoneNumber}, Name: ${this.pushName}`);
        } else if (connection === "close") {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;

          console.log(`[WhatsApp] Connection closed. Status code: ${statusCode}, isLoggedOut: ${isLoggedOut}`);

          if (isLoggedOut) {
            this.status = "disconnected";
            this.qrCode = null;
            this.phoneNumber = null;
            this.pushName = null;
            this.lastError = "Sesi WhatsApp telah keluar. Silakan scan QR ulang.";
            await this.cleanupSessionFiles();
          } else {
            // Reconnection attempt
            this.status = "connecting";
            if (this.reconnectAttempts < 5) {
              this.reconnectAttempts++;
              const delay = Math.min(this.reconnectAttempts * 3000, 15000);
              console.log(`[WhatsApp] Will attempt reconnection in ${delay}ms (Attempt ${this.reconnectAttempts})`);
              setTimeout(() => {
                this.init(false).catch((err) => {
                  console.error("[WhatsApp] Auto-reconnect failed:", err);
                });
              }, delay);
            } else {
              this.status = "disconnected";
              this.lastError = "Koneksi WhatsApp terputus. Silakan sambungkan ulang.";
            }
          }
        } else if (connection === "connecting") {
          this.status = "connecting";
        }
      });
    } catch (err: any) {
      console.error("[WhatsApp] Error initializing socket:", err);
      this.status = "disconnected";
      this.lastError = err.message || "Gagal menginisialisasi WhatsApp Gateway.";
    } finally {
      this.isInitializing = false;
    }

    return this.getState();
  }

  /**
   * Disconnect and logout WhatsApp session
   */
  public async logout(): Promise<void> {
    try {
      if (this.sock) {
        await this.sock.logout().catch(() => {});
        this.sock.end(undefined);
        this.sock = null;
      }
    } catch (err) {
      console.warn("[WhatsApp] Error during socket logout:", err);
    }

    await this.cleanupSessionFiles();
    this.status = "disconnected";
    this.qrCode = null;
    this.phoneNumber = null;
    this.pushName = null;
    this.lastConnectedAt = null;
    this.lastError = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Clean up session files on disk
   */
  private async cleanupSessionFiles(): Promise<void> {
    try {
      if (fs.existsSync(SESSION_DIR)) {
        const files = fs.readdirSync(SESSION_DIR);
        for (const file of files) {
          fs.rmSync(path.join(SESSION_DIR, file), { recursive: true, force: true });
        }
      }
    } catch (err) {
      console.error("[WhatsApp] Error cleaning session files:", err);
    }
  }

  /**
   * Send WhatsApp text message to any phone number
   */
  public async sendMessage(target: string, message: string): Promise<{ success: boolean; message: string; messageId?: string }> {
    if (this.status !== "connected" || !this.sock) {
      return {
        success: false,
        message: "WhatsApp belum terhubung ke HP Anda. Silakan hubungkan dengan scan QR di menu Pengaturan WhatsApp.",
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
      console.error("[WhatsApp] Send message failed:", err);
      return {
        success: false,
        message: err.message || "Gagal mengirim pesan WhatsApp. Pastikan nomor tujuan valid dan WhatsApp HP Anda online.",
      };
    }
  }
}

export const waManager = new WhatsAppGatewayManager();

// Automatically attempt to restore session if previously logged in
if (waManager.hasSavedSession()) {
  console.log("[WhatsApp] Found existing session on disk. Restoring connection...");
  waManager.init(false).catch((err) => {
    console.error("[WhatsApp] Initial auto-restore error:", err);
  });
}
