import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

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

// API: Fonnte WhatsApp Gateway Integration
// 1. Get default server configuration status
app.get("/api/fonnte/config", (req, res) => {
  const hasEnvKey = Boolean(process.env.FONNTE_API_KEY && process.env.FONNTE_API_KEY.trim().length > 0);
  res.json({ hasEnvKey });
});

// 2. Check Fonnte device connection status & quota
app.post("/api/fonnte/device-status", async (req, res) => {
  try {
    const token = (req.body.apiKey || process.env.FONNTE_API_KEY || "").trim();
    if (!token) {
      return res.status(400).json({
        status: false,
        message: "API Key / Token Fonnte belum dimasukkan.",
      });
    }

    const response = await fetch("https://api.fonnte.com/device", {
      method: "POST",
      headers: {
        Authorization: token,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data) {
      return res.status(response.status || 500).json({
        status: false,
        message: (data && data.reason) || `Gagal menghubungi server Fonnte (Status: ${response.status})`,
        raw: data,
      });
    }

    res.json(data);
  } catch (error: any) {
    console.error("Error checking Fonnte device status:", error);
    res.status(500).json({
      status: false,
      message: error.message || "Terjadi kesalahan saat memeriksa status perangkat Fonnte.",
    });
  }
});

// 3. Send WhatsApp message (Direct or Test) via Fonnte Gateway
app.post("/api/fonnte/send", async (req, res) => {
  try {
    const { apiKey, target, message, countryCode = "62" } = req.body;
    const token = (apiKey || process.env.FONNTE_API_KEY || "").trim();

    if (!token) {
      return res.status(400).json({
        status: false,
        message: "API Key / Token Fonnte belum diisi. Silakan masukkan token Fonnte Anda terlebih dahulu.",
      });
    }

    if (!target || !message) {
      return res.status(400).json({
        status: false,
        message: "Nomor WhatsApp tujuan dan pesan teks harus diisi.",
      });
    }

    // Format target phone number cleanly
    const cleanedTarget = target.toString().replace(/[^\d,+]/g, "");

    const formParams = new URLSearchParams();
    formParams.append("target", cleanedTarget);
    formParams.append("message", message);
    formParams.append("countryCode", countryCode);

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
      },
      body: formParams,
    });

    const data: any = await response.json().catch(() => null);

    if (!response.ok || !data) {
      return res.status(response.status || 500).json({
        status: false,
        message: (data && data.reason) || `Gagal mengirim melalui Fonnte (Status: ${response.status})`,
        raw: data,
      });
    }

    // Fonnte returns { status: true, id: [...], process: 'processing' } or { status: false, reason: '...' }
    if (data.status === false) {
      return res.status(400).json({
        status: false,
        message: data.reason || "Server Fonnte menolak pengiriman pesan (periksa koneksi perangkat Anda di Fonnte).",
        raw: data,
      });
    }

    res.json({
      status: true,
      message: "Pesan berhasil dikirim ke antrean Fonnte!",
      data,
    });
  } catch (error: any) {
    console.error("Error sending message via Fonnte:", error);
    res.status(500).json({
      status: false,
      message: error.message || "Gagal menghubungi API gateway Fonnte.",
    });
  }
});

// API: Bablast.id WhatsApp Gateway Integration
// 1. Get default server configuration status for Bablast
app.get("/api/bablast/config", (req, res) => {
  const hasEnvKey = Boolean(process.env.BABLAST_API_KEY && process.env.BABLAST_API_KEY.trim().length > 0);
  const defaultSenderCode = process.env.BABLAST_SENDER_CODE || "";
  res.json({ hasEnvKey, defaultSenderCode });
});

// 2. Send WhatsApp message (Direct or Test) via Bablast.id Gateway
app.post("/api/bablast/send", async (req, res) => {
  try {
    const { apiKey, senderCode, target, message } = req.body;
    const rawToken = (apiKey || process.env.BABLAST_API_KEY || "").trim();

    if (!rawToken) {
      return res.status(400).json({
        status: false,
        message: "API Key / Token Bablast.id belum diisi. Silakan masukkan API Key Bablast.id Anda terlebih dahulu.",
      });
    }

    if (!target || !message) {
      return res.status(400).json({
        status: false,
        message: "Nomor WhatsApp tujuan dan pesan teks harus diisi.",
      });
    }

    // Format target phone number into standard international format without '+' (e.g. 6281234567890)
    let cleanedTarget = target.toString().replace(/[^\d]/g, "");
    if (cleanedTarget.startsWith("0")) {
      cleanedTarget = "62" + cleanedTarget.slice(1);
    } else if (cleanedTarget.startsWith("62")) {
      // already starting with 62
    } else if (!cleanedTarget.startsWith("62") && cleanedTarget.length > 8) {
      cleanedTarget = "62" + cleanedTarget;
    }

    // Ensure Bearer prefix for Bablast Authorization header
    const authHeader = rawToken.startsWith("Bearer ") ? rawToken : `Bearer ${rawToken}`;

    const payload: Record<string, any> = {
      phone: cleanedTarget,
      message: message,
    };

    const effectiveSenderCode = (senderCode || process.env.BABLAST_SENDER_CODE || "").trim();
    if (effectiveSenderCode) {
      payload.sender_code = effectiveSenderCode;
    }

    const response = await fetch("https://api.bablast.id/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const data: any = await response.json().catch(() => null);

    if (!response.ok || !data) {
      const errorMsg = data?.message || data?.error || (data?.errors && JSON.stringify(data.errors)) || `Gagal menghubungi server Bablast.id (Status: ${response.status})`;
      return res.status(response.status || 500).json({
        status: false,
        message: errorMsg,
        raw: data,
      });
    }

    // Check if Bablast reported failure in body
    if (data.status === false || data.success === false || data.error) {
      return res.status(400).json({
        status: false,
        message: data.message || data.error || "Server Bablast.id menolak pengiriman pesan (periksa token / sender_code / kuota).",
        raw: data,
      });
    }

    res.json({
      status: true,
      message: data.message || "Pesan WhatsApp berhasil terkirim melalui Bablast.id!",
      data,
    });
  } catch (error: any) {
    console.error("Error sending message via Bablast.id:", error);
    res.status(500).json({
      status: false,
      message: error.message || "Gagal menghubungi API gateway Bablast.id.",
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

startServer();
