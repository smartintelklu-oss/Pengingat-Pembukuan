/**
 * Utilities for Fonnte WhatsApp Gateway integration
 */

const FONNTE_STORAGE_KEY = 'fonnte_api_key';

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

/**
 * Loads the saved Fonnte API Key from localStorage
 */
export function getSavedFonnteApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(FONNTE_STORAGE_KEY) || '';
}

/**
 * Persists the Fonnte API Key to localStorage
 */
export function saveFonnteApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (!key.trim()) {
    localStorage.removeItem(FONNTE_STORAGE_KEY);
  } else {
    localStorage.setItem(FONNTE_STORAGE_KEY, key.trim());
  }
}

/**
 * Checks Fonnte device connection status and quota
 */
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
    message: 'Gagal memproses respon server.',
  }));

  return data;
}

/**
 * Sends a WhatsApp message (e.g., test message or scheduled message) via Fonnte Gateway
 */
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
    message: 'Gagal mengurai respon dari server pengirim.',
  }));

  return result;
}
