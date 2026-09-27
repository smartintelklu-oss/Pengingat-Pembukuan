// server.ts
import express from "express";
import path2 from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// server/whatsapp.ts
import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import pino from "pino";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers
} from "@whiskeysockets/baileys";
var SESSIONS_ROOT_DIR = path.join(process.cwd(), "data", "wa-sessions");
var LEGACY_SESSION_DIR = path.join(process.cwd(), "data", "wa-session");
function sanitizeUserId(userId) {
  if (!userId || typeof userId !== "string") return "user-utama";
  const clean = userId.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
  return clean || "user-utama";
}
var WhatsAppGatewayManager = class {
  constructor(userId = "user-utama") {
    this.sock = null;
    this.status = "disconnected";
    this.qrCode = null;
    this.rawQr = null;
    this.phoneNumber = null;
    this.pushName = null;
    this.lastConnectedAt = null;
    this.lastError = null;
    this.isInitializing = false;
    this.reconnectAttempts = 0;
    this.activeInitPromise = null;
    this.readinessResolvers = [];
    this.userId = sanitizeUserId(userId);
    this.sessionDir = path.join(SESSIONS_ROOT_DIR, this.userId);
    try {
      if (!fs.existsSync(this.sessionDir)) {
        fs.mkdirSync(this.sessionDir, { recursive: true });
      }
    } catch (err) {
      console.error(`[WhatsApp:${this.userId}] Failed to create session directory:`, err);
    }
  }
  notifyReadiness() {
    const listeners = [...this.readinessResolvers];
    this.readinessResolvers = [];
    for (const resolve of listeners) {
      try {
        resolve();
      } catch {
      }
    }
  }
  waitForReadiness(timeoutMs = 15e3) {
    if (this.status === "connected" || this.status === "qr_ready" && Boolean(this.qrCode)) {
      return Promise.resolve(this.getState());
    }
    return new Promise((resolve) => {
      let resolved = false;
      let timer = null;
      const onReady = () => {
        if (resolved) return;
        resolved = true;
        if (timer) clearTimeout(timer);
        resolve(this.getState());
      };
      timer = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        if (this.status === "connecting" && !this.qrCode) {
          this.status = "disconnected";
          this.lastError = "Batas waktu pembuatan Kode QR terlampaui. Silakan klik 'Perbarui Barcode QR'.";
        }
        resolve(this.getState());
      }, timeoutMs);
      this.readinessResolvers.push(onReady);
    });
  }
  /**
   * Check if there are existing credentials saved on disk for this user
   */
  hasSavedSession() {
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
  getState() {
    return {
      userId: this.userId,
      status: this.status,
      isConnected: this.status === "connected",
      qrCode: this.qrCode || null,
      phoneNumber: this.phoneNumber || null,
      pushName: this.pushName || null,
      lastConnectedAt: this.lastConnectedAt || null,
      lastError: this.lastError || null
    };
  }
  /**
   * Initialize or restore WhatsApp connection for this user.
   * Ensures the server NEVER returns prematurely before the socket is ready or QR generated.
   */
  async init(forceFresh = false) {
    if (this.status === "connected" && this.sock && !forceFresh) {
      return this.getState();
    }
    if (this.status === "qr_ready" && this.qrCode && !forceFresh) {
      return this.getState();
    }
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
  async executeInit(forceFresh) {
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
      if (this.sock) {
        try {
          this.sock.ev.removeAllListeners("connection.update");
          this.sock.ev.removeAllListeners("creds.update");
          this.sock.end(void 0);
        } catch {
        }
        this.sock = null;
      }
      const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        browser: Browsers.ubuntu("Chrome"),
        connectTimeoutMs: 6e4,
        defaultQueryTimeoutMs: 6e4,
        keepAliveIntervalMs: 25e3,
        generateHighQualityLinkPreview: true
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
                light: "#ffffff"
              }
            });
            this.status = "qr_ready";
            this.lastError = null;
            console.log(`[WhatsApp:${this.userId}] New QR Code generated successfully`);
            this.notifyReadiness();
          } catch (qrErr) {
            console.error(`[WhatsApp:${this.userId}] Failed to generate QR Code data URL:`, qrErr);
            this.lastError = "Gagal membuat gambar QR Code.";
            this.notifyReadiness();
          }
        }
        if (connection === "open") {
          this.status = "connected";
          this.qrCode = null;
          this.reconnectAttempts = 0;
          this.lastConnectedAt = (/* @__PURE__ */ new Date()).toISOString();
          this.lastError = null;
          const rawId = sock.user?.id || "";
          this.phoneNumber = rawId.split(":")[0].replace(/\D/g, "");
          this.pushName = sock.user?.name || null;
          console.log(`[WhatsApp:${this.userId}] Connected successfully! Number: ${this.phoneNumber}, Name: ${this.pushName}`);
          this.notifyReadiness();
        } else if (connection === "close") {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
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
            this.status = "connecting";
            if (this.reconnectAttempts < 5) {
              this.reconnectAttempts++;
              const delay = Math.min(this.reconnectAttempts * 3e3, 15e3);
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
      return await this.waitForReadiness(15e3);
    } catch (err) {
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
  async logout() {
    try {
      if (this.sock) {
        try {
          this.sock.ev.removeAllListeners("connection.update");
          this.sock.ev.removeAllListeners("creds.update");
        } catch {
        }
        await this.sock.logout().catch(() => {
        });
        this.sock.end(void 0);
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
  async cleanupSessionFiles() {
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
  async sendMessage(target, message) {
    if (this.status !== "connected" || !this.sock) {
      return {
        success: false,
        message: `WhatsApp untuk akun ini belum terhubung. Silakan scan QR di Pengaturan WhatsApp akun ${this.userId}.`
      };
    }
    if (!target || !message.trim()) {
      return {
        success: false,
        message: "Nomor WhatsApp tujuan dan isi pesan tidak boleh kosong."
      };
    }
    let cleanNumber = target.toString().replace(/[^\d]/g, "");
    if (cleanNumber.startsWith("0")) {
      cleanNumber = "62" + cleanNumber.slice(1);
    } else if (cleanNumber.startsWith("62")) {
    } else if (cleanNumber.length > 8 && !cleanNumber.startsWith("62")) {
      cleanNumber = "62" + cleanNumber;
    }
    if (cleanNumber.length < 9) {
      return {
        success: false,
        message: "Nomor WhatsApp tujuan tidak valid (terlalu pendek)."
      };
    }
    const jid = `${cleanNumber}@s.whatsapp.net`;
    try {
      const sent = await this.sock.sendMessage(jid, { text: message.trim() });
      return {
        success: true,
        message: "Pesan WhatsApp berhasil dikirim secara otomatis!",
        messageId: sent?.key?.id || void 0
      };
    } catch (err) {
      console.error(`[WhatsApp:${this.userId}] Send message failed:`, err);
      return {
        success: false,
        message: err.message || "Gagal mengirim pesan WhatsApp. Pastikan nomor tujuan valid dan WhatsApp HP Anda online."
      };
    }
  }
};
var activeManagers = /* @__PURE__ */ new Map();
function getWhatsAppManager(userId) {
  const safeId = sanitizeUserId(userId);
  let mgr = activeManagers.get(safeId);
  if (!mgr) {
    mgr = new WhatsAppGatewayManager(safeId);
    activeManagers.set(safeId, mgr);
  }
  return mgr;
}
var waManager = getWhatsAppManager("user-utama");
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

// server.ts
dotenv.config();
var app = express();
var PORT = 3e3;
app.use(express.json());
var aiClient = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.post("/api/ai/voice-script", async (req, res) => {
  try {
    const { title, note, scheduledTime, tone = "friendly", priority = "normal" } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      const tonePrefixes = {
        friendly: "Halo! Mengingatkan Anda dengan ramah bahwa",
        professional: "Pemberitahuan resmi jadwal agenda Anda:",
        urgent: "Peringatan mendesak! Mohon segera perhatikan:",
        cheerful: "Semangat hari ini! Jangan lupa ada agenda penting:"
      };
      const prefix = tonePrefixes[tone] || tonePrefixes.friendly;
      const script2 = `${prefix} tugas ${title}. Catatan: ${note || "Harap selesaikan sesuai rencana"}. Terima kasih dan semoga lancar!`;
      return res.json({ script: script2, source: "fallback" });
    }
    const prompt = `Anda adalah asisten AI suara pengingat cerdas berbahasa Indonesia.
Buat kalimat naskah suara yang dibacakan (Text to Speech) untuk pengingat tugas/agenda berikut:
- Judul Tugas: ${title}
- Catatan/Deskripsi: ${note || "Tidak ada catatan tambahan"}
- Waktu Pengingat: ${scheduledTime || "Sekarang"}
- Gaya Suara/Tone: ${tone} (pilihan: friendly/ramah, professional/profesional, urgent/mendesak, cheerful/ceria)
- Prioritas: ${priority}

Instruksi naskah suara:
1. Buat teks dalam bahasa Indonesia yang sangat alami, jelas jika diucapkan, dan enak didengar.
2. Panjang sekitar 2-3 kalimat ringkas (maksimal 45 kata).
3. Awali dengan sapaan yang sesuai tone, sebutkan tugas, dan berikan dorongan/pesan singkat.
4. Jangan gunakan markdown (*, #, bullet), langsung kembalikan teks lisan saja.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt
    });
    const script = response.text?.trim() || `Halo! Pengingat untuk tugas Anda: ${title}. Harap segera diselesaikan.`;
    res.json({ script, source: "gemini" });
  } catch (error) {
    console.error("Error generating voice script:", error);
    const title = req.body.title || "tugas";
    res.json({
      script: `Halo! Ini pengingat untuk ${title}. Harap periksa catatan dan selesaikan tugas Anda.`,
      source: "error-fallback"
    });
  }
});
app.post("/api/ai/financial-insights", async (req, res) => {
  try {
    const { ledgerName, income, expense, balance, transactions } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      const savingsRate = income > 0 ? Math.round((income - expense) / income * 100) : 0;
      return res.json({
        analysis: `Ringkasan Pembukuan ${ledgerName}: Total pemasukan Rp${Number(income).toLocaleString("id-ID")}, pengeluaran Rp${Number(expense).toLocaleString("id-ID")}. Saldo saat ini Rp${Number(balance).toLocaleString("id-ID")}. Rasio tabungan Anda tercatat sekitar ${savingsRate}%. Pertahankan pencatatan rutin setiap transaksi!`,
        tips: [
          "Pantau pos pengeluaran terbesar setiap akhir pekan.",
          "Pisahkan rekening operasional usaha dan kebutuhan pribadi.",
          "Sisihkan minimal 10-20% dari surplus kas sebagai dana darurat."
        ],
        source: "fallback"
      });
    }
    const sampleTx = (transactions || []).slice(0, 15).map(
      (t) => `${t.date}: [${t.type === "income" ? "Pemasukan" : "Pengeluaran"}] ${t.category} - Rp${t.amount} (${t.title})`
    ).join("\n");
    const prompt = `Anda adalah konsultan keuangan profesional dan pembukuan bisnis/pribadi.
Lakukan analisis singkat dan berikan rekomendasi berbasis data pembukuan berikut:
Nama Pembukuan: ${ledgerName}
Total Pemasukan: Rp ${Number(income).toLocaleString("id-ID")}
Total Pengeluaran: Rp ${Number(expense).toLocaleString("id-ID")}
Saldo Kas Bersih: Rp ${Number(balance).toLocaleString("id-ID")}
Sampel Transaksi Terbaru:
${sampleTx || "Belum ada transaksi rinci"}

Berikan output dalam format JSON valid dengan struktur:
{
  "summary": "Analisis ringkas dan tajam kondisi keuangan (2-3 kalimat)",
  "healthStatus": "Sangat Sehat" | "Cukup Sehat" | "Waspada Defisit" | "Perlu Penataan",
  "keyObservation": "Poin evaluasi utama terkait arus kas",
  "tips": ["Rekomendasi 1", "Rekomendasi 2", "Rekomendasi 3"]
}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json({ ...parsed, source: "gemini" });
  } catch (error) {
    console.error("Error generating financial insight:", error);
    res.json({
      summary: "Arus kas pembukuan Anda terpantau aktif. Pastikan setiap penerimaan dan belanja tercatat dengan kategori yang tepat.",
      healthStatus: "Cukup Sehat",
      keyObservation: "Catatan transaksi berkala membantu mendeteksi pemborosan lebih dini.",
      tips: [
        "Selalu alokasikan kas cadangan untuk pengeluaran tak terduga.",
        "Rutin review pos pengeluaran paling dominan di setiap bulan.",
        "Unduh laporan Excel atau PDF untuk pengarsipan rapi."
      ],
      source: "error-fallback"
    });
  }
});
app.use("/api/whatsapp", (req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  next();
});
app.get("/api/whatsapp/status", (req, res) => {
  try {
    const userId = req.query.userId || req.headers["x-user-id"] || "user-utama";
    const manager = getWhatsAppManager(userId);
    res.json(manager.getState());
  } catch (error) {
    res.status(500).json({
      userId: "user-utama",
      status: "disconnected",
      isConnected: false,
      qrCode: null,
      phoneNumber: null,
      pushName: null,
      lastConnectedAt: null,
      lastError: error.message || "Gagal mengambil status WhatsApp."
    });
  }
});
app.post("/api/whatsapp/connect", async (req, res) => {
  const userId = req.body?.userId || req.headers["x-user-id"] || "user-utama";
  const manager = getWhatsAppManager(userId);
  try {
    const forceFresh = req.body?.forceFresh === true;
    const state = await manager.init(forceFresh);
    res.json(state);
  } catch (error) {
    console.error(`[API] Error initiating WhatsApp connect for user ${userId}:`, error);
    res.status(500).json({
      userId,
      status: "disconnected",
      isConnected: false,
      qrCode: null,
      phoneNumber: null,
      pushName: null,
      lastConnectedAt: null,
      lastError: error.message || "Gagal memulai inisialisasi WhatsApp."
    });
  }
});
app.post("/api/whatsapp/disconnect", async (req, res) => {
  const userId = req.body?.userId || req.headers["x-user-id"] || "user-utama";
  const manager = getWhatsAppManager(userId);
  try {
    await manager.logout();
    res.json({
      success: true,
      message: "Perangkat WhatsApp berhasil diputuskan.",
      state: manager.getState()
    });
  } catch (error) {
    console.error(`[API] Error disconnecting WhatsApp for user ${userId}:`, error);
    res.status(500).json({
      success: false,
      message: error.message || "Gagal memutuskan sambungan WhatsApp."
    });
  }
});
app.post("/api/whatsapp/send", async (req, res) => {
  const userId = req.body?.userId || req.headers["x-user-id"] || "user-utama";
  const manager = getWhatsAppManager(userId);
  try {
    const { target, message } = req.body;
    if (!target || !message) {
      return res.status(400).json({
        success: false,
        message: "Nomor WhatsApp tujuan dan pesan teks harus diisi."
      });
    }
    const result = await manager.sendMessage(target, message);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error(`[API] Error sending WhatsApp message for user ${userId}:`, error);
    res.status(500).json({
      success: false,
      message: error.message || "Terjadi kesalahan internal saat mengirim pesan WhatsApp."
    });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path2.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = app;
export {
  app,
  server_default as default
};
