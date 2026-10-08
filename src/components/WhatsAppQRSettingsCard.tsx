import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Send,
  Zap,
  ShieldCheck,
  PhoneCall,
  User,
  BadgeCheck,
} from 'lucide-react';
import {
  getWhatsAppStatus,
  connectWhatsApp,
  disconnectWhatsApp,
  sendViaActiveGateway,
  humanizeErrorMessage,
  WhatsAppState,
} from '../utils/whatsappGateway';

interface WhatsAppQRSettingsCardProps {
  userId?: string;
  userName?: string;
  userRole?: string;
}

export const WhatsAppQRSettingsCard: React.FC<WhatsAppQRSettingsCardProps> = ({
  userId = 'user-utama',
  userName = 'Pemilik Usaha',
  userRole = 'owner',
}) => {
  const [waState, setWaState] = useState<WhatsAppState>({
    userId,
    status: 'disconnected',
    isConnected: false,
    qrCode: null,
    phoneNumber: null,
    pushName: null,
    lastConnectedAt: null,
    lastError: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Test Message Sender State
  const [testTarget, setTestTarget] = useState('');
  const [testMessage, setTestMessage] = useState(
    `Halo! Ini adalah pesan uji coba otomatis dari sistem Pengingat & Pembukuan untuk akun ${userName}.`
  );
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Function to refresh WhatsApp state from backend for active userId
  const fetchStatus = async (targetUserId = userId) => {
    try {
      const state = await getWhatsAppStatus(targetUserId);
      setWaState((prev) => {
        // Prevent QR code flicker during temporary poll hiccups
        if (!state.qrCode && prev.qrCode && state.status === 'connecting' && !state.isConnected) {
          return { ...state, qrCode: prev.qrCode, status: 'qr_ready' };
        }
        return state;
      });
    } catch {
      // ignore
    }
  };

  // When userId changes: clear state, reset test result, and fetch this user's session
  useEffect(() => {
    setWaState({
      userId,
      status: 'disconnected',
      isConnected: false,
      qrCode: null,
      phoneNumber: null,
      pushName: null,
      lastConnectedAt: null,
      lastError: null,
    });
    setTestResult(null);
    setTestMessage(
      `Halo! Ini adalah pesan uji coba otomatis dari sistem Pengingat & Pembukuan untuk akun ${userName}.`
    );
    fetchStatus(userId);
  }, [userId, userName]);

  // Auto-polling when waiting for QR scan or connecting
  useEffect(() => {
    if (waState.status === 'qr_ready' || waState.status === 'connecting') {
      pollingRef.current = setInterval(() => {
        fetchStatus(userId);
      }, 2500);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [waState.status, userId]);

  // Handler: Start connection & generate QR for active user
  const handleConnect = async (forceFresh = true) => {
    setIsLoading(true);
    setTestResult(null);
    setWaState((prev) => ({
      ...prev,
      status: 'connecting',
      lastError: null,
    }));
    try {
      const state = await connectWhatsApp(userId, forceFresh);
      setWaState(state);

      // If socket is still generating QR, poll actively every 1.2s until ready
      if (!state.qrCode && !state.isConnected) {
        let attempts = 0;
        const checkTimer = setInterval(async () => {
          attempts++;
          const latest = await getWhatsAppStatus(userId);
          if (latest.qrCode || latest.isConnected) {
            clearInterval(checkTimer);
            setWaState(latest);
            setIsLoading(false);
          } else if (attempts >= 15) {
            clearInterval(checkTimer);
            setIsLoading(false);
          }
        }, 1200);
        return;
      }
    } catch {
      // Keep in connecting mode so polling catches up smoothly
      setWaState((prev) => ({
        ...prev,
        status: 'connecting',
        lastError: null,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Disconnect / Logout active user's session
  const handleDisconnect = async () => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin memutuskan sambungan WhatsApp untuk akun "${userName}"? Anda harus scan QR ulang jika ingin menghubungkannya kembali.`
      )
    ) {
      return;
    }

    setIsDisconnecting(true);
    setTestResult(null);
    try {
      await disconnectWhatsApp(userId);
      await fetchStatus(userId);
    } catch (err: any) {
      alert('Gagal memutuskan sambungan: ' + err.message);
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Handler: Send Test WhatsApp Message
  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTarget.trim() || !testMessage.trim()) {
      alert('Silakan masukkan nomor tujuan dan isi pesan uji coba.');
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await sendViaActiveGateway({
        userId,
        target: testTarget.trim(),
        message: testMessage.trim(),
      });

      setTestResult({
        success: res.status,
        message: res.message,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Terjadi kesalahan saat mengirim pesan uji coba.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Main WhatsApp Gateway Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
        {/* User Account Scope Identification Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 font-medium">WhatsApp untuk Akun:</span>
                <span className="font-extrabold text-slate-900">{userName}</span>
                <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800">
                  {userRole === 'owner' ? 'Pemilik (Owner)' : 'Staf'}
                </span>
              </div>
              <p className="text-2xs text-slate-500 mt-0.5">
                Setiap pemilik/akun memiliki nomor WhatsApp dan sesi scan QR tersendiri.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchStatus(userId)}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-2xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Muat ulang status sesi akun ini"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Cek Status</span>
          </button>
        </div>

        {/* Header with Title & Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/25">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Tautkan WhatsApp Akun {userName}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  Mandiri Multi-Akun
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                Hubungkan WhatsApp nomor ponsel Anda sendiri khusus untuk akun <strong>{userName}</strong>. 
                Tanpa perantara atau API berbayar.
              </p>
            </div>
          </div>

          {/* Current Status Pill */}
          <div className="shrink-0">
            {waState.isConnected ? (
              <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Terhubung Aktif</span>
              </span>
            ) : waState.status === 'qr_ready' ? (
              <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Menunggu Scan QR</span>
              </span>
            ) : waState.status === 'connecting' ? (
              <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Menghubungkan...</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Belum Tertaut</span>
              </span>
            )}
          </div>
        </div>

        {/* Error Alert if any */}
        {waState.lastError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Informasi Koneksi:</p>
                <p>{humanizeErrorMessage(waState.lastError)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleConnect(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-2xs transition-all shadow-2xs self-start sm:self-auto shrink-0 cursor-pointer"
            >
              Coba Hubungkan Ulang
            </button>
          </div>
        )}

        {/* STATE 1: CONNECTED */}
        {waState.isConnected && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/50 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-black text-slate-900">
                      WhatsApp {userName} Terhubung!
                    </h4>
                    <span className="px-2 py-0.5 rounded-md text-2xs font-extrabold bg-emerald-200 text-emerald-900">
                      Multi-Device Ready
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-600 font-medium">
                    {waState.phoneNumber && (
                      <span className="flex items-center space-x-1 text-emerald-800 font-bold">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>+{waState.phoneNumber}</span>
                      </span>
                    )}
                    {waState.pushName && (
                      <span className="text-slate-500">
                        Profil: <strong className="text-slate-800">{waState.pushName}</strong>
                      </span>
                    )}
                    {waState.lastConnectedAt && (
                      <span className="text-slate-400 text-2xs">
                        Aktif sejak:{' '}
                        {new Date(waState.lastConnectedAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                id="btn-disconnect-wa"
                type="button"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer disabled:opacity-60"
              >
                {isDisconnecting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
                <span>{isDisconnecting ? 'Memutuskan...' : 'Putuskan Perangkat'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start space-x-3">
              <Zap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Pengiriman Otomatis Aktif:</strong> Setiap pesan WhatsApp terjadwal, pengingat, atau tagihan milik akun <strong>{userName}</strong> akan dikirim secara otomatis melalui nomor WhatsApp +{waState.phoneNumber || 'Anda'}.
              </p>
            </div>
          </div>
        )}

        {/* STATE 2: QR CODE READY */}
        {!waState.isConnected && waState.qrCode && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* QR Code Container */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl border border-slate-200/90 text-center">
                <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 inline-block relative group">
                  <img
                    src={waState.qrCode}
                    alt="WhatsApp QR Code"
                    className="w-56 h-56 sm:w-64 sm:h-64 rounded-xl object-contain mx-auto"
                    onError={() => {
                      console.warn('QR image load error, refreshing...');
                      handleConnect(true);
                    }}
                  />
                  <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-2xl pointer-events-none" />
                </div>

                <div className="mt-4 flex items-center space-x-2 text-xs font-bold text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>
                    {waState.status === 'connecting'
                      ? 'Menghubungkan & Memperbarui QR...'
                      : `Scan Barcode ini dari WhatsApp HP ${userName}`}
                  </span>
                </div>

                <div className="mt-3 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleConnect(true)}
                    disabled={isLoading}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-2xs font-bold hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Perbarui Barcode QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-slate-500 hover:text-rose-600 text-2xs font-bold transition-all cursor-pointer"
                  >
                    <span>Tutup</span>
                  </button>
                </div>
              </div>

              {/* Instructions on the right */}
              <div className="md:col-span-7 space-y-4">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Petunjuk Tautkan WhatsApp untuk {userName}:</span>
                </h4>

                <ol className="space-y-3 text-xs text-slate-600">
                  <li className="flex items-start space-x-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center shrink-0 text-2xs">
                      1
                    </span>
                    <span>Buka aplikasi <strong>WhatsApp</strong> di ponsel pemilik/pengguna ini.</span>
                  </li>
                  <li className="flex items-start space-x-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center shrink-0 text-2xs">
                      2
                    </span>
                    <span>Ketuk <strong>Menu (titik tiga ⋮)</strong> di Android atau buka <strong>Pengaturan</strong> di iPhone.</span>
                  </li>
                  <li className="flex items-start space-x-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center shrink-0 text-2xs">
                      3
                    </span>
                    <span>Pilih menu <strong>Perangkat Tertaut (Linked Devices)</strong>.</span>
                  </li>
                  <li className="flex items-start space-x-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center shrink-0 text-2xs">
                      4
                    </span>
                    <span>Ketuk <strong>Tautkan Perangkat</strong> dan arahkan kamera HP ke Kode QR di sebelah kiri.</span>
                  </li>
                </ol>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-2xs text-emerald-800 flex items-center space-x-2.5">
                  <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sesi tersimpan aman di server dan tidak akan tertukar dengan akun pemilik lain.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STATE 2.5: CONNECTING / GENERATING QR CODE */}
        {!waState.isConnected && !waState.qrCode && (isLoading || waState.status === 'connecting') && (
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/40 border border-emerald-200/80 text-center space-y-5 animate-in fade-in duration-300 shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100/90 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
            </div>

            <div className="max-w-md mx-auto space-y-1.5">
              <h4 className="text-base font-black text-slate-900">
                Menyiapkan Kode QR WhatsApp...
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sedang menghubungi server WhatsApp untuk membuat barcode otorisasi baru khusus akun <strong>{userName}</strong>. Mohon tunggu beberapa detik, gambar QR akan otomatis muncul di sini.
              </p>
            </div>

            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-2xs font-extrabold">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <span>Membuat Barcode Otorisasi WhatsApp...</span>
            </div>

            <div>
              <button
                type="button"
                onClick={() => {
                  setIsLoading(false);
                  setWaState(prev => ({ ...prev, status: 'disconnected' }));
                }}
                className="text-xs text-slate-400 hover:text-rose-600 transition-colors cursor-pointer font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* STATE 3: DISCONNECTED / INITIAL */}
        {!waState.isConnected && !waState.qrCode && !isLoading && waState.status !== 'connecting' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 border border-slate-200/90 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <QrCode className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto space-y-1.5">
              <h4 className="text-base font-black text-slate-900">
                Tautkan WhatsApp Akun {userName}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Scan QR sekali saja dari HP pemilik akun ini untuk mengaktifkan pengiriman pesan otomatis tersendiri.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                id="btn-start-wa-qr"
                type="button"
                onClick={() => handleConnect(true)}
                disabled={isLoading}
                className="inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4" />
                )}
                <span>{isLoading ? 'Menyiapkan QR Code...' : `Tampilkan Kode QR Akun ${userName}`}</span>
              </button>
            </div>

            {/* Advantages Checklist & Info Note */}
            <div className="pt-4 border-t border-slate-100 max-w-lg mx-auto space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                <div className="flex items-center space-x-2 text-2xs text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Nomor WhatsApp Pribadi / Akun Tersendiri</span>
                </div>
                <div className="flex items-center space-x-2 text-2xs text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Otomatis &amp; Terjadwal Mandiri</span>
                </div>
                <div className="flex items-center space-x-2 text-2xs text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Bebas Biaya API Pihak Ketiga</span>
                </div>
                <div className="flex items-center space-x-2 text-2xs text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Multi-Device Resmi &amp; Aman</span>
                </div>
              </div>

              {/* Informational Callout regarding API Token */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-2xs text-left space-y-1">
                <div className="flex items-center space-x-1.5 font-bold text-amber-950">
                  <BadgeCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Tidak Memerlukan API Token / API Key</span>
                </div>
                <p className="text-amber-800/90 leading-relaxed">
                  Aplikasi ini menggunakan teknologi <strong>Gateway Mandiri (Scan QR WhatsApp Multi-Device)</strong>. Anda tidak perlu mendaftar atau memasukkan Token API pihak ketiga berbayar (seperti Fonnte/Wablas). Cukup klik tombol hijau di atas dan pindai Kode QR langsung dari HP Anda.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Interactive Live Message Tester */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-start space-x-3.5 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-teal-500/25">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Uji Coba Pengiriman Pesan WhatsApp ({userName})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kirim pesan tes langsung dari nomor WhatsApp yang tertaut ke akun ini.
            </p>
          </div>
        </div>

        <form onSubmit={handleSendTestMessage} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Target Phone Number */}
            <div className="sm:col-span-5 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
                <span>Nomor WhatsApp Tujuan:</span>
              </label>
              <input
                type="text"
                value={testTarget}
                onChange={(e) => setTestTarget(e.target.value)}
                placeholder="Contoh: 08123456789 atau 628123..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs font-semibold text-slate-900 bg-slate-50/50"
              />
              <p className="text-2xs text-slate-400">
                Format otomatis mendukung awalan 08xxx maupun 62xxx.
              </p>
            </div>

            {/* Test Message Body */}
            <div className="sm:col-span-7 space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Isi Pesan Uji Coba:</label>
              <textarea
                rows={2}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Tulis pesan pengujian..."
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs text-slate-800 bg-slate-50/50 resize-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-2xs text-slate-400">
              {waState.isConnected
                ? `● Siap kirim dari +${waState.phoneNumber || 'Nomor Akun Ini'}`
                : `⚠ WhatsApp akun ${userName} belum terhubung. Silakan scan QR di atas.`}
            </span>

            <button
              id="btn-send-wa-test"
              type="submit"
              disabled={isSendingTest || !waState.isConnected || !testTarget.trim()}
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm shadow-teal-600/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingTest ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{isSendingTest ? 'Mengirim Pesan...' : 'Kirim Pesan Tes Sekarang'}</span>
            </button>
          </div>
        </form>

        {/* Test Result Feedback */}
        {testResult && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-start space-x-3 animate-in fade-in duration-200 ${
              testResult.success
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border border-rose-200 text-rose-900'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <p className="font-bold">
                {testResult.success ? 'Pesan Berhasil Terkirim!' : 'Pengiriman Gagal'}
              </p>
              <p className="leading-relaxed">{testResult.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppQRSettingsCard;
