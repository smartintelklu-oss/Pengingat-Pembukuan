import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

import { waManager } from "./server/whatsapp";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API: Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// API: AI Voice Script Generator
// Generates natural, human-like reminder speech scripts in Indonesian
app.post("/api/ai/voice-script", async (req, res) => {
  try {
    const { title, note, scheduledTime, tone = "friendly", priority = "normal" } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback generator when Gemini key is not supplied
      const tonePrefixes: Record<string, string> = {
        friendly: "Halo! Mengingatkan Anda dengan ramah bahwa",
        professional: "Pemberitahuan resmi jadwal agenda Anda:",
        urgent: "Peringatan mendesak! Mohon segera perhatikan:",
        cheerful: "Semangat hari ini! Jangan lupa ada agenda penting:",
      };
      const prefix = tonePrefixes[tone] || tonePrefixes.friendly;
      const script = `${prefix} tugas ${title}. Catatan: ${note || "Harap selesaikan sesuai rencana"}. Terima kasih dan semoga lancar!`;
      return res.json({ script, source: "fallback" });
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
      contents: prompt,
    });

    const script = response.text?.trim() || `Halo! Pengingat untuk tugas Anda: ${title}. Harap segera diselesaikan.`;
    res.json({ script, source: "gemini" });
  } catch (error: any) {
    console.error("Error generating voice script:", error);
    const title = req.body.title || "tugas";
    res.json({
      script: `Halo! Ini pengingat untuk ${title}. Harap periksa catatan dan selesaikan tugas Anda.`,
      source: "error-fallback",
    });
  }
});

// API: AI Financial Analysis / Insights
app.post("/api/ai/financial-insights", async (req, res) => {
  try {
    const { ledgerName, income, expense, balance, transactions } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
      return res.json({
        analysis: `Ringkasan Pembukuan ${ledgerName}: Total pemasukan Rp${Number(income).toLocaleString("id-ID")}, pengeluaran Rp${Number(expense).toLocaleString("id-ID")}. Saldo saat ini Rp${Number(balance).toLocaleString("id-ID")}. Rasio tabungan Anda tercatat sekitar ${savingsRate}%. Pertahankan pencatatan rutin setiap transaksi!`,
        tips: [
          "Pantau pos pengeluaran terbesar setiap akhir pekan.",
          "Pisahkan rekening operasional usaha dan kebutuhan pribadi.",
          "Sisihkan minimal 10-20% dari surplus kas sebagai dana darurat.",
        ],
        source: "fallback",
      });
    }

    const sampleTx = (transactions || []).slice(0, 15).map((t: any) => 
      `${t.date}: [${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}] ${t.category} - Rp${t.amount} (${t.title})`
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
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json({ ...parsed, source: "gemini" });
  } catch (error: any) {
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
      source: "error-fallback",
    });
  }
});

// API: Self-Hosted WhatsApp Gateway (Option 1 - Direct QR Code Scanner & Baileys Multi-Device)
// 1. Get current WhatsApp connection status, QR code, and linked profile
app.get("/api/whatsapp/status", (req, res) => {
  res.json(waManager.getState());
});

// 2. Start connection or generate a new QR code for scanning
app.post("/api/whatsapp/connect", async (req, res) => {
  try {
    const forceFresh = req.body?.forceFresh === true;
    const state = await waManager.init(forceFresh);
    res.json(state);
  } catch (error: any) {
    console.error("[API] Error initiating WhatsApp connect:", error);
    res.status(500).json({
      status: "disconnected",
      isConnected: false,
      qrCode: null,
      phoneNumber: null,
      pushName: null,
      lastConnectedAt: null,
      lastError: error.message || "Gagal memulai inisialisasi WhatsApp.",
    });
  }
});

// 3. Disconnect / logout WhatsApp session
app.post("/api/whatsapp/disconnect", async (req, res) => {
  try {
    await waManager.logout();
    res.json({
      success: true,
      message: "Perangkat WhatsApp berhasil diputuskan.",
      state: waManager.getState(),
    });
  } catch (error: any) {
    console.error("[API] Error disconnecting WhatsApp:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Gagal memutuskan sambungan WhatsApp.",
    });
  }
});

// 4. Send WhatsApp message directly through the linked session (Background & Automatic)
app.post("/api/whatsapp/send", async (req, res) => {
  try {
    const { target, message } = req.body;
    if (!target || !message) {
      return res.status(400).json({
        success: false,
        message: "Nomor WhatsApp tujuan dan pesan teks harus diisi.",
      });
    }

    const result = await waManager.sendMessage(target, message);
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error: any) {
    console.error("[API] Error sending WhatsApp message:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Terjadi kesalahan internal saat mengirim pesan WhatsApp.",
    });
  }
});


async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;

