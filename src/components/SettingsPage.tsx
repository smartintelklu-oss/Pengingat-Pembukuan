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
  Laptop
} from 'lucide-react';
import { AppTab, ReminderTask, LedgerBook, Transaction, ScheduledWhatsApp } from '../types';
import { PageGlassHeader } from './PageGlassHeader';
import { WhatsAppQRSettingsCard } from './WhatsAppQRSettingsCard';
import { PWAInstallButton } from './PWAInstallButton';
import { playNotificationChime } from '../utils/audio';

interface SettingsPageProps {
  onNavigate: (tab: AppTab) => void;
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
  reminders = [],
  ledgers = [],
  transactions = [],
  scheduledWhatsApp = [],
  onDataImported,
}) => {
  const [activeSettingsSection, setActiveSettingsSection] = useState<'gateway' | 'voice' | 'backup' | 'pwa'>('gateway');
  const [backupSuccessMessage, setBackupSuccessMessage] = useState<string | null>(null);
  const [backupErrorMessage, setBackupErrorMessage] = useState<string | null>(null);

  // Export all application data as JSON
  const handleExportData = () => {
    try {
      const dataToExport = {
        app: 'Pengingat & Pembukuan',
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        data: {
          reminders,
          ledgers,
          transactions,
          scheduledWhatsApp,
        },
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('download', `cadangan_pengingat_pembukuan_${dateStr}.json`);
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
          const { reminders: impReminders, ledgers: impLedgers, transactions: impTransactions, scheduledWhatsApp: impWa } = json.data;

          if (onDataImported) {
            onDataImported(impReminders, impLedgers, impTransactions, impWa);
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
    // Reset file input
    e.target.value = '';
  };

  // Voice AI test
  const handleTestVoice = () => {
    playNotificationChime();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        'Halo! Ini adalah uji coba suara AI pengingat dari aplikasi Pengingat dan Pembukuan Anda.'
      );
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
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
          onClick={() => setActiveSettingsSection('backup')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeSettingsSection === 'backup'
              ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm shadow-indigo-500/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Cadangan &amp; Pemulihan Data</span>
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
      {activeSettingsSection === 'gateway' && (
        <div className="space-y-6">
          {/* Informational Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/50 border border-emerald-200/80 text-slate-800 flex items-start space-x-3.5 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900">
                Integrasi WhatsApp Mandiri (Scan Barcode Ponsel Sendiri)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aplikasi ini terhubung langsung ke nomor WhatsApp Anda sendiri seperti WhatsApp Web. 
                Tanpa perlu API key atau perantara pihak ketiga, Anda cukup scan QR di bawah sekali saja untuk mengaktifkan pengiriman pesan otomatis di latar belakang.
              </p>
            </div>
          </div>

          {/* Self-Hosted WhatsApp QR Scanner & Live Tester */}
          <WhatsAppQRSettingsCard />
        </div>
      )}

      {activeSettingsSection === 'voice' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-5">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Pengaturan Suara Pengingat AI &amp; Alarm
                </h3>
                <p className="text-xs text-slate-500">
                  Uji coba dan dengarkan suara asisten AI yang akan membacakan judul dan catatan agenda Anda.
                </p>
              </div>
            </div>

            <div className="space-y-4 max-w-xl">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Uji Suara Asisten AI (Speech Synthesis)</span>
                  <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold bg-emerald-100 text-emerald-800">
                    Bahasa Indonesia
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ketika alarm pengingat berbunyi, aplikasi akan memainkan nada lonceng (*chime*) lalu mengucapkan teks pengingat secara otomatis.
                </p>
                <button
                  type="button"
                  onClick={handleTestVoice}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-600/25 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Dengarkan Contoh Suara AI</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-xs font-bold text-slate-800">Notifikasi Pop-up Peramban (Push Alerts)</span>
                <p className="text-xs text-slate-600">
                  Untuk mendapatkan pengingat saat layar terkunci atau aplikasi berada di latar belakang, pastikan izin notifikasi peramban telah diberikan.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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

          <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Pencadangan &amp; Pemulihan Data
                </h3>
                <p className="text-xs text-slate-500">
                  Simpan cadangan seluruh data pengingat, buku kas, transaksi, dan jadwal WhatsApp Anda ke dalam file JSON lokal.
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
                <span>Unduh File Cadangan (JSON)</span>
              </button>

              <label className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Pulihkan Data dari Cadangan</span>
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

      {/* 4. Section: PWA Install Guide & Status */}
      {activeSettingsSection === 'pwa' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
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
