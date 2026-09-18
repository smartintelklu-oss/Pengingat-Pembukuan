import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Smartphone, 
  Trash2, 
  Check, 
  Zap, 
  Info,
  Rocket,
  ShieldCheck,
  Server,
  Radio
} from 'lucide-react';
import { 
  WhatsAppProvider,
  getActiveWhatsAppProvider,
  setActiveWhatsAppProvider,
  getSavedBablastApiKey,
  saveBablastApiKey,
  getSavedBablastSenderCode,
  saveBablastSenderCode,
  getSavedFonnteApiKey,
  saveFonnteApiKey,
  checkFonnteDeviceStatus,
  sendViaBablast,
  sendViaFonnte,
  FonnteDeviceStatus
} from '../utils/whatsappGateway';
import { formatPhoneNumber, displayPhoneNumber } from '../utils/whatsapp';

interface WhatsAppGatewaySettingsCardProps {
  onApiKeyChange?: (hasKey: boolean) => void;
}

export const FonnteSettingsCard: React.FC<WhatsAppGatewaySettingsCardProps> = ({ onApiKeyChange }) => {
  // Active provider selection: 'bablast' or 'fonnte'
  const [selectedProvider, setSelectedProvider] = useState<WhatsAppProvider>('bablast');

  // Bablast.id state
  const [bablastApiKey, setBablastApiKey] = useState('');
  const [bablastSenderCode, setBablastSenderCode] = useState('');
  const [showBablastKey, setShowBablastKey] = useState(false);
  const [isBablastSaved, setIsBablastSaved] = useState(false);

  // Fonnte state
  const [fonnteApiKey, setFonnteApiKey] = useState('');
  const [showFonnteKey, setShowFonnteKey] = useState(false);
  const [isFonnteSaved, setIsFonnteSaved] = useState(false);
  const [isCheckingFonnteDevice, setIsCheckingFonnteDevice] = useState(false);
  const [fonnteDeviceStatus, setFonnteDeviceStatus] = useState<FonnteDeviceStatus | null>(null);
  const [fonnteDeviceError, setFonnteDeviceError] = useState<string | null>(null);

  // Test message state
  const [testTarget, setTestTarget] = useState('');
  const [testMessage, setTestMessage] = useState(
    'Halo! Ini adalah pesan tes pengiriman WhatsApp Gateway dari Aplikasi Catatan Pengingat & Pembukuan. Koneksi API berhasil berfungsi dengan baik! 🚀✨'
  );
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    provider: WhatsAppProvider;
    detail?: any;
  } | null>(null);

  // Load saved credentials on mount
  useEffect(() => {
    const active = getActiveWhatsAppProvider();
    setSelectedProvider(active);

    const savedBablast = getSavedBablastApiKey();
    const savedBablastSender = getSavedBablastSenderCode();
    const savedFonnte = getSavedFonnteApiKey();

    if (savedBablast) {
      setBablastApiKey(savedBablast);
    }
    if (savedBablastSender) {
      setBablastSenderCode(savedBablastSender);
    }
    if (savedFonnte) {
      setFonnteApiKey(savedFonnte);
      // Silently check device if Fonnte has key
      checkFonnteDevice(savedFonnte);
    }

    const hasAnyKey = Boolean(savedBablast.trim() || savedFonnte.trim());
    onApiKeyChange?.(hasAnyKey);
  }, []);

  const notifyKeyChange = () => {
    const hasAnyKey = Boolean(getSavedBablastApiKey().trim() || getSavedFonnteApiKey().trim());
    onApiKeyChange?.(hasAnyKey);
  };

  // Provider switcher handler
  const handleSelectProvider = (provider: WhatsAppProvider) => {
    setSelectedProvider(provider);
    setActiveWhatsAppProvider(provider);
    notifyKeyChange();
  };

  // Bablast.id save handler
  const handleSaveBablast = () => {
    saveBablastApiKey(bablastApiKey);
    saveBablastSenderCode(bablastSenderCode);
    setIsBablastSaved(true);
    setActiveWhatsAppProvider('bablast');
    notifyKeyChange();
    setTimeout(() => setIsBablastSaved(false), 2500);
  };

  const handleClearBablast = () => {
    if (confirm('Hapus API Key Bablast.id yang tersimpan di peramban ini?')) {
      setBablastApiKey('');
      setBablastSenderCode('');
      saveBablastApiKey('');
      saveBablastSenderCode('');
      setTestResult(null);
      notifyKeyChange();
    }
  };

  // Fonnte save handler
  const handleSaveFonnte = () => {
    saveFonnteApiKey(fonnteApiKey);
    setIsFonnteSaved(true);
    setActiveWhatsAppProvider('fonnte');
    notifyKeyChange();
    setTimeout(() => setIsFonnteSaved(false), 2500);

    if (fonnteApiKey.trim()) {
      checkFonnteDevice(fonnteApiKey.trim());
    } else {
      setFonnteDeviceStatus(null);
      setFonnteDeviceError(null);
    }
  };

  const handleClearFonnte = () => {
    if (confirm('Hapus API Key Fonnte yang tersimpan di peramban ini?')) {
      setFonnteApiKey('');
      saveFonnteApiKey('');
      setFonnteDeviceStatus(null);
      setFonnteDeviceError(null);
      setTestResult(null);
      notifyKeyChange();
    }
  };

  const checkFonnteDevice = async (keyToCheck?: string) => {
    const key = keyToCheck !== undefined ? keyToCheck : fonnteApiKey;
    if (!key.trim()) {
      setFonnteDeviceError('Masukkan API Key Fonnte terlebih dahulu.');
      return;
    }

    setIsCheckingFonnteDevice(true);
    setFonnteDeviceError(null);

    try {
      const res = await checkFonnteDeviceStatus(key);
      if (res.status) {
        setFonnteDeviceStatus(res);
      } else {
        setFonnteDeviceStatus(null);
        setFonnteDeviceError(res.message || 'Tidak dapat terhubung ke perangkat Fonnte.');
      }
    } catch (err: any) {
      setFonnteDeviceStatus(null);
      setFonnteDeviceError(err.message || 'Gagal memeriksa status Fonnte.');
    } finally {
      setIsCheckingFonnteDevice(false);
    }
  };

  // Test message send handler
  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!testTarget.trim()) {
      setTestResult({
        success: false,
        message: 'Nomor WhatsApp tujuan tes tidak boleh kosong.',
        provider: selectedProvider,
      });
      return;
    }

    if (!testMessage.trim()) {
      setTestResult({
        success: false,
        message: 'Teks pesan tes tidak boleh kosong.',
        provider: selectedProvider,
      });
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    const cleanedNumber = formatPhoneNumber(testTarget);

    try {
      if (selectedProvider === 'bablast') {
        if (!bablastApiKey.trim()) {
          setTestResult({
            success: false,
            message: 'Masukkan dan simpan API Key Bablast.id terlebih dahulu sebelum mengirim tes.',
            provider: 'bablast',
          });
          setIsSendingTest(false);
          return;
        }

        const res = await sendViaBablast({
          target: cleanedNumber,
          message: testMessage,
          apiKey: bablastApiKey.trim(),
          senderCode: bablastSenderCode.trim() || undefined,
        });

        if (res.status) {
          setTestResult({
            success: true,
            message: 'Pesan tes berhasil dikirim ke nomor WhatsApp melalui gateway Bablast.id!',
            provider: 'bablast',
            detail: res.data,
          });
        } else {
          setTestResult({
            success: false,
            message: res.message || 'Gagal mengirim pesan melalui Bablast.id.',
            provider: 'bablast',
            detail: res.data,
          });
        }
      } else {
        // Fonnte
        if (!fonnteApiKey.trim()) {
          setTestResult({
            success: false,
            message: 'Masukkan dan simpan API Key Fonnte terlebih dahulu sebelum mengirim tes.',
            provider: 'fonnte',
          });
          setIsSendingTest(false);
          return;
        }

        const res = await sendViaFonnte({
          target: cleanedNumber,
          message: testMessage,
          apiKey: fonnteApiKey.trim(),
        });

        if (res.status) {
          setTestResult({
            success: true,
            message: 'Pesan tes berhasil dikirim ke nomor WhatsApp melalui gateway Fonnte!',
            provider: 'fonnte',
            detail: res.data,
          });
        } else {
          setTestResult({
            success: false,
            message: res.message || 'Gagal mengirim pesan melalui Fonnte.',
            provider: 'fonnte',
            detail: res.data,
          });
        }
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Terjadi gangguan koneksi saat mengirim tes pesan.',
        provider: selectedProvider,
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const isFonnteConnected = fonnteDeviceStatus?.device_status === 'connect';
  const hasBablastKey = Boolean(bablastApiKey.trim());
  const hasFonnteKey = Boolean(fonnteApiKey.trim());

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
      
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                Pusat Gateway WhatsApp
              </span>
              <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                Pilihan Provider API
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-1">
              Pengaturan API Key WhatsApp Gateway (Bablast.id &amp; Fonnte)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              Pilih penyedia gateway WhatsApp yang Anda gunakan, masukkan API Key, dan lakukan pengujian pengiriman pesan otomatis secara langsung.
            </p>
          </div>
        </div>

        {/* Active Gateway Indicator Badge */}
        <div className="flex items-center space-x-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <div className="text-xs">
            <span className="text-3xs text-slate-400 block font-semibold uppercase tracking-wider">Gateway Aktif:</span>
            <span className="font-extrabold text-slate-800">
              {selectedProvider === 'bablast' ? 'Bablast.id' : 'Fonnte'}
            </span>
          </div>
        </div>
      </div>

      {/* 1. PROVIDER SWITCHER TABS (Bablast.id vs Fonnte) */}
      <div>
        <label className="block text-2xs font-extrabold text-slate-500 uppercase tracking-wider mb-2.5">
          Pilih Penyedia Gateway WhatsApp
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option 1: Bablast.id */}
          <button
            id="tab-provider-bablast"
            type="button"
            onClick={() => handleSelectProvider('bablast')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              selectedProvider === 'bablast'
                ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                selectedProvider === 'bablast'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-black text-slate-900">Bablast.id</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    api.bablast.id
                  </span>
                </div>
                <p className="text-2xs text-slate-500 mt-0.5">
                  Layanan WhatsApp Gateway cepat Indonesia dengan dukungan Sender Code &amp; WABA
                </p>
              </div>
            </div>

            <div className="shrink-0 ml-2">
              {hasBablastKey ? (
                <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Key Tersimpan</span>
                </span>
              ) : (
                <span className="text-3xs text-slate-400 font-medium">Belum Diisi</span>
              )}
            </div>
          </button>

          {/* Option 2: Fonnte */}
          <button
            id="tab-provider-fonnte"
            type="button"
            onClick={() => handleSelectProvider('fonnte')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              selectedProvider === 'fonnte'
                ? 'bg-gradient-to-r from-teal-50 via-cyan-50 to-white border-teal-500 shadow-sm ring-2 ring-teal-500/20'
                : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                selectedProvider === 'fonnte'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-black text-slate-900">Fonnte.com</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                    api.fonnte.com
                  </span>
                </div>
                <p className="text-2xs text-slate-500 mt-0.5">
                  Layanan integrasi WhatsApp dengan fitur cek kuota perangkat real-time
                </p>
              </div>
            </div>

            <div className="shrink-0 ml-2">
              {hasFonnteKey ? (
                <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-2xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  <Check className="w-3 h-3 text-teal-600" />
                  <span>Key Tersimpan</span>
                </span>
              ) : (
                <span className="text-3xs text-slate-400 font-medium">Belum Diisi</span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Grid: 2 Kolom (Kiri: Form Input Token Sesuai Provider, Kanan: Form Tes Pesan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        
        {/* ========================================================= */}
        {/* KOLOM KIRI: INPUT API KEY                                */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 space-y-4">
          
          {selectedProvider === 'bablast' ? (
            /* ========================================== */
            /* FORM INPUT BABLAST.ID                      */
            /* ========================================== */
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    <Rocket className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    Input API Key Bablast.id
                  </h4>
                </div>
                <a
                  href="https://bablast.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  <span>bablast.id</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>

              {/* Input API Key Bablast */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Key className="w-3.5 h-3.5 text-emerald-600" />
                    <span>API Key / Token Bablast.id</span>
                    <span className="text-rose-500">*</span>
                  </span>
                  {hasBablastKey && (
                    <span className="text-3xs text-emerald-700 font-bold flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Tersimpan</span>
                    </span>
                  )}
                </label>

                <div className="relative">
                  <input
                    id="input-bablast-api-key"
                    type={showBablastKey ? 'text' : 'password'}
                    value={bablastApiKey}
                    onChange={(e) => setBablastApiKey(e.target.value)}
                    placeholder="Contoh: eyJhbGciOi... atau API Key dari Developer Console Bablast.id"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBablastKey(!showBablastKey)}
                    title={showBablastKey ? 'Sembunyikan Token' : 'Lihat Token'}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showBablastKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-3xs text-slate-400 mt-1">
                  API Key dapat diperoleh melalui dashboard Developer Console di akun Bablast.id Anda.
                </p>
              </div>

              {/* Input Sender Code Bablast (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Server className="w-3.5 h-3.5 text-teal-600" />
                    <span>Sender Code / Device Code</span>
                    <span className="text-2xs font-normal text-slate-400">(Opsional)</span>
                  </span>
                </label>
                <input
                  id="input-bablast-sender-code"
                  type="text"
                  value={bablastSenderCode}
                  onChange={(e) => setBablastSenderCode(e.target.value)}
                  placeholder="Contoh: SND-A1B2C3 (jika akun Anda multi-device)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                />
                <p className="text-3xs text-slate-400 mt-1">
                  Diperlukan bila Anda menggunakan Global API Key dengan banyak nomor WhatsApp terdaftar.
                </p>
              </div>

              {/* Action Buttons for Bablast */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  id="btn-save-bablast-key"
                  type="button"
                  onClick={handleSaveBablast}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {isBablastSaved ? <Check className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{isBablastSaved ? 'Berhasil Disimpan!' : 'Simpan API Key Bablast'}</span>
                </button>

                {hasBablastKey && (
                  <button
                    type="button"
                    onClick={handleClearBablast}
                    title="Hapus API Key Bablast.id"
                    className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Guide Tips for Bablast.id */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-2xs text-slate-600 space-y-1 mt-2">
                <div className="flex items-center space-x-1 font-bold text-emerald-800">
                  <Info className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cara Mendapatkan API Key Bablast.id:</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                  <li>Buka website <a href="https://bablast.id" target="_blank" rel="noreferrer" className="text-emerald-700 font-bold underline">bablast.id</a> dan masuk ke dashboard akun Anda.</li>
                  <li>Hubungkan perangkat WhatsApp Anda melalui scan kode QR di menu Device.</li>
                  <li>Kunjungi menu <strong>Developer Console / API Keys</strong>, lalu buat atau salin <strong>API Key</strong> Anda.</li>
                  <li>Tempelkan API Key di atas, masukkan <em>Sender Code</em> (bila ada), dan klik <strong>Simpan</strong>.</li>
                </ol>
              </div>
            </div>
          ) : (
            /* ========================================== */
            /* FORM INPUT FONNTE.COM                      */
            /* ========================================== */
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    Input API Key Fonnte.com
                  </h4>
                </div>
                <a
                  href="https://fonnte.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline"
                >
                  <span>fonnte.com</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>

              {/* Input Token Fonnte */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Key className="w-3.5 h-3.5 text-teal-600" />
                    <span>API Key / Token Fonnte</span>
                    <span className="text-rose-500">*</span>
                  </span>
                  {hasFonnteKey && (
                    <span className="text-3xs text-teal-700 font-bold flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Tersimpan</span>
                    </span>
                  )}
                </label>

                <div className="relative">
                  <input
                    id="input-fonnte-api-key"
                    type={showFonnteKey ? 'text' : 'password'}
                    value={fonnteApiKey}
                    onChange={(e) => setFonnteApiKey(e.target.value)}
                    placeholder="Contoh: vG4o#kP9... (token dari akun Fonnte)"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFonnteKey(!showFonnteKey)}
                    title={showFonnteKey ? 'Sembunyikan Token' : 'Lihat Token'}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showFonnteKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons for Fonnte */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveFonnte}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {isFonnteSaved ? <Check className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{isFonnteSaved ? 'Berhasil Disimpan!' : 'Simpan Token Fonnte'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => checkFonnteDevice()}
                  disabled={isCheckingFonnteDevice || !fonnteApiKey.trim()}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingFonnteDevice ? 'animate-spin text-teal-600' : 'text-slate-400'}`} />
                  <span>{isCheckingFonnteDevice ? 'Memeriksa...' : 'Cek Status Device'}</span>
                </button>

                {hasFonnteKey && (
                  <button
                    type="button"
                    onClick={handleClearFonnte}
                    title="Hapus API Key Fonnte"
                    className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Fonnte Device Check Feedback */}
              {fonnteDeviceError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Koneksi Fonnte Gagal:</p>
                    <p className="mt-0.5">{fonnteDeviceError}</p>
                  </div>
                </div>
              )}

              {fonnteDeviceStatus && (
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-2xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Info Akun Fonnte</span>
                    <span className={isFonnteConnected ? 'text-emerald-700' : 'text-rose-600'}>
                      ● {fonnteDeviceStatus.device_status || 'Unknown'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-slate-700">
                    <div>
                      <span className="text-3xs text-slate-400 block">Nama Perangkat:</span>
                      <span className="font-semibold">{fonnteDeviceStatus.device || '-'}</span>
                    </div>
                    <div>
                      <span className="text-3xs text-slate-400 block">Sisa Kuota:</span>
                      <span className="font-semibold text-teal-700">{fonnteDeviceStatus.quota ?? '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Guide Tips for Fonnte */}
              <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-100 text-2xs text-slate-600 space-y-1 mt-2">
                <div className="flex items-center space-x-1 font-bold text-teal-800">
                  <Info className="w-3.5 h-3.5 text-teal-600" />
                  <span>Cara Mendapatkan Token Fonnte:</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                  <li>Buka <a href="https://fonnte.com" target="_blank" rel="noreferrer" className="text-teal-700 font-bold underline">fonnte.com</a> dan daftar/masuk.</li>
                  <li>Scan kode QR menggunakan nomor WhatsApp Anda di menu Device.</li>
                  <li>Salin <strong>Token</strong> yang tertera dan tempelkan di kolom Fonnte di atas.</li>
                </ol>
              </div>
            </div>
          )}

        </div>

        {/* ========================================================= */}
        {/* KOLOM KANAN: FORM TES PESAN WHATSAPP                    */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/90 flex flex-col justify-between space-y-4">
          <form onSubmit={handleSendTestMessage} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  <Send className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    Form Tes Pengiriman WhatsApp
                  </h4>
                  <span className="text-3xs text-slate-500">
                    Menguji pengiriman langsung via {selectedProvider === 'bablast' ? 'Bablast.id' : 'Fonnte'}
                  </span>
                </div>
              </div>

              {testTarget && (
                <span className="text-3xs font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {displayPhoneNumber(testTarget)}
                </span>
              )}
            </div>

            {/* Input Nomor WhatsApp Tujuan Tes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor WhatsApp Tujuan Tes <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="input-test-target"
                  type="text"
                  value={testTarget}
                  onChange={(e) => setTestTarget(e.target.value)}
                  placeholder="Contoh: 08123456789 atau 628123456789"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  required
                />
              </div>
              <p className="text-3xs text-slate-400 mt-1">
                Masukkan nomor ponsel WhatsApp Anda untuk memastikan pesan langsung terkirim.
              </p>
            </div>

            {/* Input Teks Pesan Tes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Isi Teks Pesan Tes <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="textarea-test-message"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
                placeholder="Tuliskan pesan teks yang ingin Anda uji kirimkan..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans leading-relaxed"
                required
              />
              <div className="flex items-center justify-between text-3xs text-slate-400 mt-1">
                <span>Pesan dikirim via server {selectedProvider === 'bablast' ? 'api.bablast.id' : 'api.fonnte.com'}</span>
                <span>{testMessage.length} karakter</span>
              </div>
            </div>

            {/* Tombol Kirim Pesan Tes */}
            <div className="pt-1">
              <button
                id="btn-submit-test-message"
                type="submit"
                disabled={isSendingTest}
                className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-60 cursor-pointer"
              >
                {isSendingTest ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sedang Mengirim via {selectedProvider === 'bablast' ? 'Bablast.id' : 'Fonnte'}...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Pesan Tes ({selectedProvider === 'bablast' ? 'Bablast.id' : 'Fonnte'})</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Test Result Banner */}
          {testResult && (
            <div className={`mt-3 p-3.5 rounded-xl border text-xs transition-all ${
              testResult.success
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/90 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-start space-x-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-bold">{testResult.message}</p>
                  {testResult.detail && (
                    <div className="text-3xs font-mono text-slate-700 bg-white/70 p-2 rounded-lg border border-slate-200/60 mt-1 max-h-24 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(testResult.detail, null, 2)}</pre>
                    </div>
                  )}
                  {!testResult.success && (
                    <p className="text-3xs text-rose-700 mt-1">
                      {testResult.provider === 'bablast' 
                        ? 'Tips: Pastikan API Key Bablast.id benar dan nomor WhatsApp terhubung aktif di dashboard bablast.id.'
                        : 'Tips: Pastikan perangkat WhatsApp di akun Fonnte Anda berstatus Connected dan memiliki kuota pesan aktif.'
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export const WhatsAppGatewaySettingsCard = FonnteSettingsCard;
