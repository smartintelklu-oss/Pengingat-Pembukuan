/**
 * Self-Hosted WhatsApp Gateway Utilities (Option 1 - Direct Multi-Device QR Scanner)
 * No third-party API (Fonnte/Bablast) required. Connects directly to user's phone.
 */

export type WhatsAppConnectionStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'connected';

export interface WhatsAppState {
  status: WhatsAppConnectionStatus;
  isConnected: boolean;
  qrCode: string | null;
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
 * Fetches the current WhatsApp connection status from the backend
 */
export async function getWhatsAppStatus(): Promise<WhatsAppState> {
  try {
    const res = await fetch('/api/whatsapp/status');
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    const data: WhatsAppState = await res.json();
    return data;
  } catch (err: any) {
    return {
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
 * Initializes or starts WhatsApp connection / generates a fresh QR code
 */
export async function connectWhatsApp(forceFresh: boolean = false): Promise<WhatsAppState> {
  try {
    const res = await fetch('/api/whatsapp/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ forceFresh }),
    });
    const data: WhatsAppState = await res.json();
    return data;
  } catch (err: any) {
    return {
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
 * Disconnects and logs out the linked WhatsApp device
 */
export async function disconnectWhatsApp(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/whatsapp/disconnect', {
      method: 'POST',
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
  target: string;
  message: string;
}): Promise<GatewaySendResult> {
  try {
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
    activeProviderName: 'WhatsApp QR Langsung (Self-Hosted)',
  };
}

export type WhatsAppProvider = 'direct-wa';
