/**
 * Unified WhatsApp Gateway Utilities (Bablast.id & Fonnte)
 */

export type WhatsAppProvider = 'bablast' | 'fonnte';

const STORAGE_KEY_PROVIDER = 'wa_active_provider';
const STORAGE_KEY_BABLAST_API_KEY = 'bablast_api_key';
const STORAGE_KEY_BABLAST_SENDER_CODE = 'bablast_sender_code';
const STORAGE_KEY_FONNTE_API_KEY = 'fonnte_api_key';

export interface BablastSendResult {
  status: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface FonnteDeviceStatus {
  status: boolean;
  device?: string;
  device_status?: 'connect' | 'disconnect' | string;
  quota?: number | string;
  expired?: string;
  message?: string;
}

export interface FonnteSendResult {
  status: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface GatewaySendResult {
  status: boolean;
  message: string;
  provider: WhatsAppProvider;
  data?: any;
  error?: string;
}

// ----------------------------------------------------
// 1. Active Provider Helpers
// ----------------------------------------------------

export function getActiveWhatsAppProvider(): WhatsAppProvider {
  if (typeof window === 'undefined') return 'bablast';
  const saved = localStorage.getItem(STORAGE_KEY_PROVIDER);
  if (saved === 'bablast' || saved === 'fonnte') {
    return saved;
  }
  // Auto-detect based on what key the user has saved
  const bablast = getSavedBablastApiKey();
  const fonnte = getSavedFonnteApiKey();
  if (bablast && !fonnte) return 'bablast';
  if (fonnte && !bablast) return 'fonnte';
  return 'bablast'; // default to Bablast.id
}

export function setActiveWhatsAppProvider(provider: WhatsAppProvider): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_PROVIDER, provider);
}

// ----------------------------------------------------
// 2. Bablast.id Storage & API Helpers
// ----------------------------------------------------

export function getSavedBablastApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY_BABLAST_API_KEY) || '';
}

export function saveBablastApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (!key.trim()) {
    localStorage.removeItem(STORAGE_KEY_BABLAST_API_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY_BABLAST_API_KEY, key.trim());
  }
}

export function getSavedBablastSenderCode(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY_BABLAST_SENDER_CODE) || '';
}

export function saveBablastSenderCode(code: string): void {
  if (typeof window === 'undefined') return;
  if (!code.trim()) {
    localStorage.removeItem(STORAGE_KEY_BABLAST_SENDER_CODE);
  } else {
    localStorage.setItem(STORAGE_KEY_BABLAST_SENDER_CODE, code.trim());
  }
}

/**
 * Sends a message via Bablast.id WhatsApp Gateway (api.bablast.id)
 */
export async function sendViaBablast(params: {
  target: string;
  message: string;
  apiKey?: string;
  senderCode?: string;
}): Promise<BablastSendResult> {
  const token = (params.apiKey !== undefined ? params.apiKey : getSavedBablastApiKey()).trim();
  const senderCode = (params.senderCode !== undefined ? params.senderCode : getSavedBablastSenderCode()).trim();

  const response = await fetch('/api/bablast/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: token,
      senderCode: senderCode || undefined,
      target: params.target,
      message: params.message,
    }),
  });

  const result = await response.json().catch(() => ({
    status: false,
    message: 'Gagal mengurai respon dari gateway Bablast.id.',
  }));

  return result;
}

// ----------------------------------------------------
// 3. Fonnte Storage & API Helpers
// ----------------------------------------------------

export function getSavedFonnteApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY_FONNTE_API_KEY) || '';
}

export function saveFonnteApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (!key.trim()) {
    localStorage.removeItem(STORAGE_KEY_FONNTE_API_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY_FONNTE_API_KEY, key.trim());
  }
}

export async function checkFonnteDeviceStatus(apiKey?: string): Promise<FonnteDeviceStatus> {
  const token = (apiKey !== undefined ? apiKey : getSavedFonnteApiKey()).trim();
  
  const response = await fetch('/api/fonnte/device-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apiKey: token }),
  });

  const data = await response.json().catch(() => ({
    status: false,
    message: 'Gagal memproses respon server Fonnte.',
  }));

  return data;
}

export async function sendViaFonnte(params: {
  target: string;
  message: string;
  apiKey?: string;
}): Promise<FonnteSendResult> {
  const token = (params.apiKey !== undefined ? params.apiKey : getSavedFonnteApiKey()).trim();

  const response = await fetch('/api/fonnte/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: token,
      target: params.target,
      message: params.message,
    }),
  });

  const result = await response.json().catch(() => ({
    status: false,
    message: 'Gagal mengurai respon dari server pengirim Fonnte.',
  }));

  return result;
}

// ----------------------------------------------------
// 4. Unified Gateway Sender
// ----------------------------------------------------

export function getGatewayStatus(): {
  activeProvider: WhatsAppProvider;
  hasBablastKey: boolean;
  hasFonnteKey: boolean;
  hasActiveKey: boolean;
  activeProviderName: string;
} {
  const activeProvider = getActiveWhatsAppProvider();
  const hasBablastKey = Boolean(getSavedBablastApiKey().trim());
  const hasFonnteKey = Boolean(getSavedFonnteApiKey().trim());
  const hasActiveKey = activeProvider === 'bablast' ? hasBablastKey : hasFonnteKey;
  const activeProviderName = activeProvider === 'bablast' ? 'Bablast.id' : 'Fonnte';

  return {
    activeProvider,
    hasBablastKey,
    hasFonnteKey,
    hasActiveKey,
    activeProviderName,
  };
}

export async function sendViaActiveGateway(params: {
  target: string;
  message: string;
}): Promise<GatewaySendResult> {
  const { activeProvider, hasBablastKey, hasFonnteKey } = getGatewayStatus();

  if (activeProvider === 'bablast') {
    if (!hasBablastKey) {
      // If no Bablast key but Fonnte key is present, fallback with message
      if (hasFonnteKey) {
        const fonnteRes = await sendViaFonnte(params);
        return {
          status: fonnteRes.status,
          message: fonnteRes.message,
          provider: 'fonnte',
          data: fonnteRes.data,
        };
      }
      return {
        status: false,
        message: 'API Key Bablast.id belum dikonfigurasi. Silakan masukkan token Anda pada menu API Gateway.',
        provider: 'bablast',
      };
    }

    const res = await sendViaBablast(params);
    return {
      status: res.status,
      message: res.message,
      provider: 'bablast',
      data: res.data,
      error: res.error,
    };
  } else {
    // Fonnte
    if (!hasFonnteKey) {
      if (hasBablastKey) {
        const babRes = await sendViaBablast(params);
        return {
          status: babRes.status,
          message: babRes.message,
          provider: 'bablast',
          data: babRes.data,
        };
      }
      return {
        status: false,
        message: 'API Key Fonnte belum dikonfigurasi. Silakan masukkan token Anda pada menu API Gateway.',
        provider: 'fonnte',
      };
    }

    const res = await sendViaFonnte(params);
    return {
      status: res.status,
      message: res.message,
      provider: 'fonnte',
      data: res.data,
      error: res.error,
    };
  }
}
