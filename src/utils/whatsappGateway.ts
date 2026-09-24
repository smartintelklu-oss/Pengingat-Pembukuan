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

export interface GatewaySendResult {
  status: boolean;
  message: string;
  messageId?: string;
  data?: any;
  error?: string;
  provider?: string;
}

/**
 * Fetches the current WhatsApp connection status for a specific user from the backend
 */
export async function getWhatsAppStatus(userId: string = 'user-utama'): Promise<WhatsAppState> {
  try {
    const res = await fetch(`/api/whatsapp/status?userId=${encodeURIComponent(userId)}`, {
      headers: {
        'x-user-id': userId,
      },
    });
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    const data: WhatsAppState = await res.json();
    return data;
  } catch (err: any) {
    return {
      userId,
      status: 'disconnected',
      isConnected: false,
      qrCode: null,
      phoneNumber: null,
      pushName: null,
      lastConnectedAt: null,
      lastError: err.message || 'Gagal menghubungi server WhatsApp backend.',
    };
  }
}

/**
 * Initializes or starts WhatsApp connection / generates a fresh QR code for a specific user
 */
export async function connectWhatsApp(userId: string = 'user-utama', forceFresh: boolean = false): Promise<WhatsAppState> {
  try {
    const res = await fetch('/api/whatsapp/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ userId, forceFresh }),
    });
    const data: WhatsAppState = await res.json();
    return data;
  } catch (err: any) {
    return {
      userId,
      status: 'disconnected',
      isConnected: false,
      qrCode: null,
      phoneNumber: null,
      pushName: null,
      lastConnectedAt: null,
      lastError: err.message || 'Gagal memulai koneksi WhatsApp.',
    };
  }
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
