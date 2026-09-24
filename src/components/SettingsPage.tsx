import React, { useState } from 'react';
import { 
  Settings, 
  Key, 
  MessageSquare, 
  Volume2, 
  Database, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Smartphone, 
  ExternalLink, 
  ShieldCheck, 
  Info,
  Server,
  Zap,
  HardDrive,
  Laptop,
  User,
  Sliders,
  Bell,
  Check,
  Radio,
  Timer
} from 'lucide-react';
import { 
  AppTab, 
  ReminderTask, 
  LedgerBook, 
  Transaction, 
  ScheduledWhatsApp, 
  AppUser, 
  UserSettings 
} from '../types';
import { PageGlassHeader } from './PageGlassHeader';
import { WhatsAppQRSettingsCard } from './WhatsAppQRSettingsCard';
import { PWAInstallButton } from './PWAInstallButton';
import { playNotificationChime } from '../utils/audio';

interface SettingsPageProps {
  onNavigate: (tab: AppTab) => void;
  currentUser?: AppUser;
  userSettings?: UserSettings;
  onUpdateUserSettings?: (newSettings: UserSettings) => void;
  reminders?: ReminderTask[];
  ledgers?: LedgerBook[];
  transactions?: Transaction[];
  scheduledWhatsApp?: ScheduledWhatsApp[];
  onDataImported?: (
    reminders?: ReminderTask[],
    ledgers?: LedgerBook[],
    transactions?: Transaction[],
    scheduledWhatsApp?: ScheduledWhatsApp[]
  ) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onNavigate,
  currentUser,
  userSettings,
  onUpdateUserSettings,
  reminders = [],
  ledgers = [],
  transactions = [],
  scheduledWhatsApp = [],
  onDataImported,
}) => {
  const [activeSettingsSection, setActiveSettingsSection] = useState<'gateway' | 'voice' | 'automation' | 'backup' | 'pwa'>('gateway');
  const [backupSuccessMessage, setBackupSuccessMessage] = useState<string | null>(null);
  const [backupErrorMessage, setBackupErrorMessage] = useState<string | null>(null);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // Active user details
  const activeUserId = currentUser?.id || 'user-utama';
  const activeUserName = currentUser?.displayName || 'Pemilik Usaha';
  const isOwner = currentUser?.role === 'owner' || !currentUser?.role;

  // Local settings state
  const currentVoicePitch = userSettings?.voicePitch ?? 1.05;
  const currentVoiceRate = userSettings?.voiceRate ?? 1.0;
  const currentVoiceTone = userSettings?.voiceTone ?? 'friendly';
  const currentEnableVoice = userSettings?.enableVoiceAssistant ?? true;
  const currentPlayChime = userSettings?.playChime ?? true;
  const currentAutoSend = userSettings?.autoSendEnabled ?? true;
  const currentAntiSpam = userSettings?.antiSpamIntervalMinutes ?? 10;
  const currentBrowserNotif = userSettings?.browserNotifications ?? true;

  const updateSetting = (partial: Partial<UserSettings>) => {
    if (userSettings && onUpdateUserSettings) {
      const updated: UserSettings = {
        ...userSettings,
        ...partial,
        userId: activeUserId,
        updatedAt: new Date().toISOString(),
      };
      onUpdateUserSettings(updated);
      setSettingsSavedToast(true);
      setTimeout(() => setSettingsSavedToast(false), 2500);
    }
  };

  // Export all application data as JSON
  const handleExportData = () => {
    try {
      const dataToExport = {
        app: 'Pengingat & Pembukuan',
        user: {
          id: activeUserId,
          name: activeUserName,
          role: currentUser?.role || 'owner',
        },
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        data: {
          reminders,
          ledgers,
          transactions,
          scheduledWhatsApp,
          settings: userSettings,
        },
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('download', `cadangan_${activeUserName.replace(/\s+/g, '_')}_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setBackupSuccessMessage('Data cadangan berhasil diunduh ke perangkat Anda!');
      setTimeout(() => setBackupSuccessMessage(null), 4000);
    } catch (err: any) {
      setBackupErrorMessage('Gagal mengekspor data: ' + (err.message || 'Kesalahan sistem'));
      setTimeout(() => setBackupErrorMessage(null), 4000);
    }
  };

  // Import application data from JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && json.data) {
          const { reminders: impReminders, ledgers: impLedgers, transactions: impTransactions, scheduledWhatsApp: impWa, settings: impSettings } = json.data;

          if (onDataImported) {
            onDataImported(impReminders, impLedgers, impTransactions, impWa);
          }

          if (impSettings && onUpdateUserSettings) {
            onUpdateUserSettings({ ...impSettings, userId: activeUserId });
          }

          setBackupSuccessMessage('Data cadangan berhasil dipulihkan!');
          setTimeout(() => setBackupSuccessMessage(null), 4000);
        } else {
          throw new Error('Format file JSON tidak valid.');
        }
      } catch (err: any) {
        setBackupErrorMessage('Gagal memulihkan data: ' + (err.message || 'Format tidak sesuai'));
        setTimeout(() => setBackupErrorMessage(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Voice AI test
  const handleTestVoice = () => {
    if (currentPlayChime) {
      playNotificationChime();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `Halo ${activeUserName}! Ini adalah uji coba suara asisten AI dengan gaya bicara ${currentVoiceTone}. Agenda dan catatan Anda siap diingatkan.`
      );
      utterance.lang = 'id-ID';
      utterance.rate = currentVoiceRate;
      utterance.pitch = currentVoicePitch;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Glass Header with Back Button */}
      <PageGlassHeader
        currentTab="settings"
        onNavigate={onNavigate}
        pendingRemindersCount={reminders.filter(r => !r.completed).length}
        pendingWhatsAppCount={scheduledWhatsApp.filter(w => w.status === 'pending').length}
      />

      {/* Top Banner: Active Account Scope Notification */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black text-lg shadow-md shadow-indigo-500/20">
            {activeUserName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-slate-900">
                Pengaturan Akun: {activeUserName}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold ${
                isOwner ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-blue-100 text-blue-900 border border-blue-200'
              }`}>
                {isOwner ? 'Pemilik Usaha (Owner)' : 'Staf / Kasir'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap akun pemilik memiliki data pengingat, pembukuan, nomor WhatsApp &amp; pengaturan yang berdiri sendiri.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('login')}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs self-start sm:self-center"
        >
          <User className="w-4 h-4" />
          <span>Ganti Akun Pemilik / Staf</span>
        </button>
      </div>

      {/* Settings Saved Notification Pill */}
      {settingsSavedToast && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 shadow-2xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Pengaturan untuk akun {activeUserName} berhasil diperbarui!</span>
        </div>
      )}

      {/* 2. Top Navigation Tabs for Settings Page */}
      <div className="flex items-center space-x-2 p-1.5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-2xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSettingsSection('gateway')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeSettingsSection === 'gateway'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-500/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Tautkan WhatsApp (Scan QR)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingsSection('voice')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeSettingsSection === 'voice'
              ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm shadow-indigo-500/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>Suara AI &amp; Alarm</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingsSection('automation')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeSettingsSection === 'automation'
              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm shadow-teal-500/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Otomasi &amp; Anti-Spam</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingsSection('backup')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeSettingsSection === 'backup'
              ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-sm shadow-slate-700/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Cadangan &amp; Pemulihan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingsSection('pwa')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeSettingsSection === 'pwa'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Install Aplikasi (PWA)</span>
        </button>
      </div>

      {/* 3. Main Content based on active section */}
      {/* SECTION 1: WHATSAPP SCAN QR */}
      {activeSettingsSection === 'gateway' && (
        <div className="space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/50 border border-emerald-200/80 text-slate-800 flex items-start space-x-3.5 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900">
                Integrasi WhatsApp Mandiri untuk {activeUserName}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scan QR di bawah ini dari HP Anda sendiri untuk mengaktifkan koneksi WhatsApp khusus akun <strong>{activeUserName}</strong>. 
                Sesi tidak akan bercampur dengan akun pemilik lainnya.
              </p>
            </div>
          </div>

          {/* User-Scoped WhatsApp QR Scanner & Live Tester */}
          <WhatsAppQRSettingsCard 
            userId={activeUserId}
            userName={activeUserName}
            userRole={currentUser?.role || 'owner'}
          />
        </div>
      )}

      {/* SECTION 2: SUARA AI & ALARM */}
      {activeSettingsSection === 'voice' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Pengaturan Suara Pengingat AI &amp; Alarm ({activeUserName})
                </h3>
                <p className="text-xs text-slate-500">
                  Konfigurasi suara asisten AI yang akan membacakan judul dan catatan agenda Anda.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Toggle Asisten Suara AI */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Asisten Suara AI (Bicara Otomatis)</span>
                  <input
                    type="checkbox"
                    checked={currentEnableVoice}
                    onChange={(e) => updateSetting({ enableVoiceAssistant: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
                <p className="text-2xs text-slate-500">
                  Membacakan pesan pengingat dengan suara sintetis saat alarm agenda berbunyi.
                </p>
              </div>

              {/* Toggle Lonceng Chime */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Bunyi Nada Lonceng (Chime Alarm)</span>
                  <input
                    type="checkbox"
                    checked={currentPlayChime}
                    onChange={(e) => updateSetting({ playChime: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
                <p className="text-2xs text-slate-500">
                  Memainkan alunan nada melodi elegan sebelum suara AI berbicara.
                </p>
              </div>

              {/* Gaya Nada Suara AI */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 md:col-span-2">
                <span className="text-xs font-bold text-slate-800">Gaya Nada Suara Asisten AI:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'friendly', label: 'Ramah & Santun', desc: 'Hangat & bersahabat' },
                    { id: 'professional', label: 'Profesional', desc: 'Tegas & lugas' },
                    { id: 'urgent', label: 'Mendesak (Tegas)', desc: 'Prioritas tinggi' },
                    { id: 'cheerful', label: 'Ceria & Semangat', desc: 'Energik & positif' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => updateSetting({ voiceTone: t.id as any })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        currentVoiceTone === t.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{t.label}</div>
                      <div className={`text-3xs mt-0.5 ${currentVoiceTone === t.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {t.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Kecepatan Suara (Rate) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Kecepatan Bicara (Speed):</span>
                  <span className="font-mono font-bold text-indigo-600">{currentVoiceRate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.05"
                  value={currentVoiceRate}
                  onChange={(e) => updateSetting({ voiceRate: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-3xs text-slate-400">
                  <span>Perlahan (0.8x)</span>
                  <span>Normal (1.0x)</span>
                  <span>Cepat (1.2x)</span>
                </div>
              </div>

              {/* Tinggi Nada (Pitch) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Tinggi Nada (Pitch):</span>
                  <span className="font-mono font-bold text-indigo-600">{currentVoicePitch.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.05"
                  value={currentVoicePitch}
                  onChange={(e) => updateSetting({ voicePitch: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-3xs text-slate-400">
                  <span>Berat (0.8)</span>
                  <span>Normal (1.0)</span>
                  <span>Tinggi (1.2)</span>
                </div>
              </div>
            </div>

            {/* Test Voice Button */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
              <span className="text-2xs text-slate-500">
                Pengaturan suara di atas disimpan khusus untuk akun <strong>{activeUserName}</strong>.
              </span>
              <button
                type="button"
                onClick={handleTestVoice}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-600/25 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Uji Suara Asisten AI Akun Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: OTOMASI & ANTI-SPAM */}
      {activeSettingsSection === 'automation' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Preferensi Otomasi &amp; Anti-Spam WhatsApp ({activeUserName})
                </h3>
                <p className="text-xs text-slate-500">
                  Atur perilaku otomatisasi pengiriman pesan WhatsApp dan proteksi jeda nomor.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Toggle Kirim Otomatis di Latar Belakang */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Kirim Otomatis Saat Jadwal Tiba (Background Auto-Send)
                  </span>
                  <input
                    type="checkbox"
                    checked={currentAutoSend}
                    onChange={(e) => updateSetting({ autoSendEnabled: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                  />
                </div>
                <p className="text-2xs text-slate-500 leading-relaxed">
                  Jika aktif, pesan WhatsApp terjadwal akan langsung dikirim oleh sistem saat jam jatuh tempo tiba tanpa perlu membuka tab WhatsApp atau klik tombol kirim manual.
                </p>
              </div>

              {/* Pilihan Jeda Anti-Spam Default */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center space-x-2">
                  <Timer className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Jeda Anti-Spam Default Pengiriman Banyak Nomor:
                  </span>
                </div>
                <p className="text-2xs text-slate-500">
                  Beri jeda bertahap antar pengiriman nomor agar akun WhatsApp Anda terhindar dari deteksi spam / pemblokiran.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { value: 5, label: '5 Menit', desc: 'Standar ringan' },
                    { value: 10, label: '10 Menit', desc: 'Rekomendasi aman' },
                    { value: 20, label: '20 Menit', desc: 'Sangat aman' },
                    { value: 30, label: '30 Menit', desc: 'Maksimal santai' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateSetting({ antiSpamIntervalMinutes: opt.value as any })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        currentAntiSpam === opt.value
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{opt.label}</div>
                      <div className={`text-3xs mt-0.5 ${currentAntiSpam === opt.value ? 'text-teal-100' : 'text-slate-400'}`}>
                        {opt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notifikasi Pop-up Browser */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Notifikasi Desktop / Pop-up Peramban
                  </span>
                  <input
                    type="checkbox"
                    checked={currentBrowserNotif}
                    onChange={(e) => updateSetting({ browserNotifications: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                  />
                </div>
                <p className="text-2xs text-slate-500">
                  Menampilkan pemberitahuan pop-up saat pesan berhasil dikirim atau saat ada pengingat agenda.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: CADANGAN & PEMULIHAN */}
      {activeSettingsSection === 'backup' && (
        <div className="space-y-6">
          {backupSuccessMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center space-x-2 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{backupSuccessMessage}</span>
            </div>
          )}

          {backupErrorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center space-x-2 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{backupErrorMessage}</span>
            </div>
          )}

          <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Pencadangan &amp; Pemulihan Data Akun ({activeUserName})
                </h3>
                <p className="text-xs text-slate-500">
                  Simpan cadangan data pengingat, buku kas, transaksi, dan jadwal WhatsApp khusus akun ini ke file JSON.
                </p>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-2xs font-bold text-slate-400 uppercase">Pengingat</span>
                <p className="text-lg font-black text-slate-800 mt-0.5">{reminders.length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-2xs font-bold text-slate-400 uppercase">Buku Kas</span>
                <p className="text-lg font-black text-slate-800 mt-0.5">{ledgers.length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-2xs font-bold text-slate-400 uppercase">Transaksi</span>
                <p className="text-lg font-black text-slate-800 mt-0.5">{transactions.length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-2xs font-bold text-slate-400 uppercase">Pesan WA</span>
                <p className="text-lg font-black text-slate-800 mt-0.5">{scheduledWhatsApp.length}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                type="button"
                onClick={handleExportData}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-slate-900/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Cadangan ({activeUserName})</span>
              </button>

              <label className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Pulihkan Data dari File JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: INSTALL APLIKASI (PWA) */}
      {activeSettingsSection === 'pwa' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Pasang Aplikasi ke Layar Utama (PWA)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Aplikasi ini dapat diinstal di Android, iPhone/iPad, serta Laptop (Windows/Mac/Linux).
                  </p>
                </div>
              </div>
              <PWAInstallButton />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>HP Android (Chrome)</span>
                </div>
                <p className="text-2xs text-slate-600 leading-relaxed">
                  Buka di Google Chrome, ketuk menu titik tiga (⋮) di pojok kanan atas, lalu pilih <strong>Instal aplikasi</strong> atau <strong>Tambahkan ke Layar Utama</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>iPhone / iPad (Safari)</span>
                </div>
                <p className="text-2xs text-slate-600 leading-relaxed">
                  Buka di Safari, ketuk tombol <strong>Bagikan (Share)</strong> di bilah bawah, lalu pilih <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                  <Laptop className="w-4 h-4 text-indigo-600" />
                  <span>Laptop / Komputer</span>
                </div>
                <p className="text-2xs text-slate-600 leading-relaxed">
                  Di browser Chrome atau Edge, klik ikon <strong>Install</strong> di sebelah kanan bilah alamat (URL), lalu klik <strong>Instal</strong>.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-blue-900">Buka di Tab Baru Peramban</span>
                <p className="text-2xs text-blue-700">
                  Jika sedang berada di jendela pratinjau, buka di tab baru agar tombol instalasi bawaan browser muncul otomatis.
                </p>
              </div>
              <a
                href={window.location.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Tab Baru</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
