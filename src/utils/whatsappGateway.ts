/**
 * Self-Hosted WhatsApp Gateway Utilities (Multi-Session per Owner Account)
 * Direct Baileys Multi-Device QR Scanner per user/owner.
 */

export type WhatsAppConnectionStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'connected';

export interface WhatsAppState {
  userId?: string;
  status: WhatsAppConnectionStatus;
  isConnected: boolean;
  qrCode: string | null;
  rawQr?: string | null;
  phoneNumber: string | null;
  pushName: string | null;
  lastConnectedAt: string | null;
  lastError: string | null;
}

/**
 * Validates and normalizes server JSON data to guarantee reliable rendering in frontend
 */
export function normalizeWhatsAppState(data: any, fallbackUserId: string = 'user-utama'): WhatsAppState {
  if (!data || typeof data !== 'object') {
    return {
      userId: fallbackUserId,
      status: 'disconnected',
      isConnected: false,
      qrCode: null,
      phoneNumber: null,
      pushName: null,
      lastConnectedAt: null,
      lastError: 'Data respons server tidak valid.',
    };
  }

  const validStatuses: WhatsAppConnectionStatus[] = ['disconnected', 'connecting', 'qr_ready', 'connected'];
  const status: WhatsAppConnectionStatus = validStatuses.includes(data.status) ? data.status : 'disconnected';
  const isConnected = Boolean(data.isConnected || status === 'connected');

  return {
    userId: typeof data.userId === 'string' && data.userId.trim() ? data.userId : fallbackUserId,
    status,
    isConnected,
    qrCode: typeof data.qrCode === 'string' && data.qrCode.startsWith('data:image/') ? data.qrCode : null,
    phoneNumber: typeof data.phoneNumber === 'string' && data.phoneNumber.trim() ? data.phoneNumber : null,
    pushName: typeof data.pushName === 'string' && data.pushName.trim() ? data.pushName : null,
    lastConnectedAt: typeof data.lastConnectedAt === 'string' ? data.lastConnectedAt : null,
    lastError: typeof data.lastError === 'string' && data.lastError.trim() ? data.lastError : null,
  };
}

export interface GatewaySendResult {
  status: boolean;
  message: string;
  messageId?: string;
  data?: any;
  error?: string;
  provider?: string;
}

/**
 * Safely parses response text into JSON without throwing raw SyntaxError
 */
async function safeParseJson(res: Response): Promise<any> {
  const text = await res.text();
  if (!text || !text.trim()) {
    throw new Error('Respons server kosong. Sedang mencoba ulang...');
  }
  const trimmed = text.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    // Non-JSON response (e.g. HTML or proxy error page during restart)
    throw new Error('Layanan WhatsApp backend sedang memulai ulang. Sedang menghubungkan...');
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error('Gagal memproses format data server WhatsApp. Sedang mencoba ulang...');
  }
}

/**
 * Clean and humanize error messages so raw JSON/SyntaxError never appears in UI
 */
export function humanizeErrorMessage(errMsg: string | null | undefined): string | null {
  if (!errMsg) return null;
  const lower = errMsg.toLowerCase();
  if (lower.includes('unexpected token') || lower.includes('not valid json') || lower.includes('the page')) {
    return 'Server WhatsApp sedang memulai ulang atau menyiapkan sesi. Silakan coba kembali dalam beberapa detik.';
  }
  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('load failed')) {
    return 'Koneksi jaringan ke server terputus. Memeriksa kembali sambungan...';
  }
  return errMsg;
}

/**
 * Fetches the current WhatsApp connection status for a specific user from the backend with auto-retry
 */
export async function getWhatsAppStatus(userId: string = 'user-utama'): Promise<WhatsAppState> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`/api/whatsapp/status?userId=${encodeURIComponent(userId)}`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!res.ok && attempt === 0) {
        await new Promise((r) => setTimeout(r, 1200));
        continue;
      }

      const data = await safeParseJson(res);
      return normalizeWhatsAppState(data, userId);
    } catch (err: any) {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1200));
        continue;
      }
      return {
        userId,
        status: 'disconnected',
        isConnected: false,
        qrCode: null,
        phoneNumber: null,
        pushName: null,
        lastConnectedAt: null,
        lastError: humanizeErrorMessage(err.message),
      };
    }
  }

  return {
    userId,
    status: 'disconnected',
    isConnected: false,
    qrCode: null,
    phoneNumber: null,
    pushName: null,
    lastConnectedAt: null,
    lastError: 'Sedang menghubungkan ke server WhatsApp...',
  };
}

/**
 * Initializes or starts WhatsApp connection / generates a fresh QR code for a specific user.
 * Ensures the response from the server is verified before returning with auto-retry.
 */
export async function connectWhatsApp(userId: string = 'user-utama', forceFresh: boolean = false): Promise<WhatsAppState> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ userId, forceFresh: attempt > 0 ? false : forceFresh }),
      });

      if (!res.ok && attempt === 0) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }

      const data = await safeParseJson(res);
      return normalizeWhatsAppState(data, userId);
    } catch (err: any) {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      return {
        userId,
        status: 'disconnected',
        isConnected: false,
        qrCode: null,
        phoneNumber: null,
        pushName: null,
        lastConnectedAt: null,
        lastError: humanizeErrorMessage(err.message),
      };
    }
  }

  return {
    userId,
    status: 'disconnected',
    isConnected: false,
    qrCode: null,
    phoneNumber: null,
    pushName: null,
    lastConnectedAt: null,
    lastError: 'Gagal menghubungkan ke server WhatsApp. Silakan coba kembali.',
  };
}

/**
 * Disconnects and logs out the linked WhatsApp device for a specific user
 */
export async function disconnectWhatsApp(userId: string = 'user-utama'): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/whatsapp/disconnect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    return {
      success: data.success ?? true,
      message: data.message || 'Perangkat WhatsApp berhasil diputuskan.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal memutuskan sambungan WhatsApp.',
    };
  }
}

/**
 * Sends a message automatically through the user's linked WhatsApp session
 */
export async function sendViaActiveGateway(params: {
  userId?: string;
  target: string;
  message: string;
}): Promise<GatewaySendResult> {
  const userId = params.userId || 'user-utama';
  try {
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        userId,
        target: params.target,
        message: params.message,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      return {
        status: false,
        message: (data && data.message) || `Gagal mengirim WhatsApp (Status HTTP: ${res.status})`,
        provider: 'direct-wa',
      };
    }

    return {
      status: data.success ?? true,
      message: data.message || 'Pesan WhatsApp berhasil dikirim secara otomatis!',
      messageId: data.messageId,
      provider: 'direct-wa',
      data,
    };
  } catch (err: any) {
    return {
      status: false,
      message: err.message || 'Gagal terhubung ke server untuk mengirim WhatsApp.',
      provider: 'direct-wa',
    };
  }
}

/**
 * Helper to get quick status summary for UI badges
 */
export function getGatewayStatus() {
  return {
    activeProvider: 'direct-wa',
    hasActiveKey: true,
    activeProviderName: 'WhatsApp QR Langsung (Multi-Akun)',
  };
}

export type WhatsAppProvider = 'direct-wa';
