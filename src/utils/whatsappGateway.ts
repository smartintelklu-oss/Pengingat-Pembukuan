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
  const rawStatus: WhatsAppConnectionStatus = validStatuses.includes(data.status) ? data.status : 'disconnected';
  const isConnected = Boolean(data.isConnected || rawStatus === 'connected');
  const qrCode = typeof data.qrCode === 'string' && data.qrCode.startsWith('data:image/') ? data.qrCode : null;
  const status: WhatsAppConnectionStatus = isConnected ? 'connected' : (qrCode ? 'qr_ready' : rawStatus);

  return {
    userId: typeof data.userId === 'string' && data.userId.trim() ? data.userId : fallbackUserId,
    status,
    isConnected,
    qrCode,
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

// In-memory cache of the latest valid QR code per user to prevent flickering
const lastKnownQrMap: Record<string, string | null> = {};

/**
 * Safely parses response text into JSON without throwing raw SyntaxError or leaking HTML
 */
async function safeParseJson(res: Response): Promise<any> {
  try {
    const text = await res.text();
    if (!text || !text.trim()) {
      return null;
    }
    const trimmed = text.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      // Non-JSON response (e.g. HTML proxy error page or warmup page)
      return null;
    }
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

/**
 * Clean and humanize error messages so raw JSON/SyntaxError never appears in UI
 */
export function humanizeErrorMessage(errMsg: string | null | undefined): string | null {
  if (!errMsg) return null;
  const lower = errMsg.toLowerCase();
  if (lower.includes('unexpected token') || lower.includes('not valid json') || lower.includes('the page') || lower.includes('memulai ulang')) {
    return null; // Suppress technical or restart messages so UI transitions cleanly to connecting
  }
  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('load failed')) {
    return 'Koneksi jaringan ke server terputus. Memeriksa kembali sambungan...';
  }
  return errMsg;
}

/**
 * Fetches the current WhatsApp connection status for a specific user from the backend
 */
export async function getWhatsAppStatus(userId: string = 'user-utama'): Promise<WhatsAppState> {
  try {
    const res = await fetch(`/api/whatsapp/status?userId=${encodeURIComponent(userId)}`, {
      headers: {
        'Accept': 'application/json',
        'x-user-id': userId,
      },
    });

    const data = await safeParseJson(res);
    if (data && typeof data === 'object') {
      const normalized = normalizeWhatsAppState(data, userId);
      if (normalized.qrCode) {
        lastKnownQrMap[userId] = normalized.qrCode;
      }
      if (normalized.isConnected) {
        lastKnownQrMap[userId] = null;
      }
      return normalized;
    }

    // If server returned non-JSON (e.g. warmup HTML during container start), retain connecting state
    return {
      userId,
      status: lastKnownQrMap[userId] ? 'qr_ready' : 'connecting',
      isConnected: false,
      qrCode: lastKnownQrMap[userId] || null,
      phoneNumber: null,
      pushName: null,
      lastConnectedAt: null,
      lastError: null,
    };
  } catch {
    return {
      userId,
      status: lastKnownQrMap[userId] ? 'qr_ready' : 'connecting',
      isConnected: false,
      qrCode: lastKnownQrMap[userId] || null,
      phoneNumber: null,
      pushName: null,
      lastConnectedAt: null,
      lastError: null,
    };
  }
}

/**
 * Initializes or starts WhatsApp connection / generates a fresh QR code for a specific user.
 * Ensures the response from the server is verified before returning with auto-retry.
 */
export async function connectWhatsApp(userId: string = 'user-utama', forceFresh: boolean = false): Promise<WhatsAppState> {
  if (forceFresh) {
    lastKnownQrMap[userId] = null;
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ userId, forceFresh: attempt > 0 ? false : forceFresh }),
      });

      const data = await safeParseJson(res);
      if (data && typeof data === 'object') {
        const normalized = normalizeWhatsAppState(data, userId);
        if (normalized.qrCode) {
          lastKnownQrMap[userId] = normalized.qrCode;
        }
        return normalized;
      }

      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
    } catch {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
    }
  }

  // Gracefully transition to connecting state with last known QR if available
  return {
    userId,
    status: lastKnownQrMap[userId] ? 'qr_ready' : 'connecting',
    isConnected: false,
    qrCode: lastKnownQrMap[userId] || null,
    phoneNumber: null,
    pushName: null,
    lastConnectedAt: null,
    lastError: null,
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
