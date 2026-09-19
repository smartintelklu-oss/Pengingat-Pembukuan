import React from 'react';
import { 
  ArrowLeft, 
  Home, 
  CalendarCheck2, 
  WalletCards, 
  MessageSquare,
  ChevronRight,
  Sparkles,
  Settings
} from 'lucide-react';
import { AppTab, AppUser } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { User, Users, Cloud, CloudOff, LogIn, ShieldCheck, Briefcase } from 'lucide-react';

interface PageGlassHeaderProps {
  currentTab: 'reminders' | 'bookkeeping' | 'whatsapp' | 'settings' | 'login';
  onNavigate: (tab: AppTab) => void;
  pendingRemindersCount?: number;
  pendingWhatsAppCount?: number;
  activeLedgerName?: string;
  currentUser?: AppUser;
  onOpenAccountModal?: () => void;
}

export const PageGlassHeader: React.FC<PageGlassHeaderProps> = ({
  currentTab,
  onNavigate,
  pendingRemindersCount = 0,
  pendingWhatsAppCount = 0,
  activeLedgerName,
  currentUser,
  onOpenAccountModal,
}) => {
  const getPageInfo = () => {
    switch (currentTab) {
      case 'reminders':
        return {
          title: 'Halaman Pengingat Agenda & Tugas',
          subtitle: 'Pengingat otomatis dengan suara AI, kalender kegiatan, dan alarm notifikasi.',
          badge: 'Pengingat Aktif',
          badgeColor: 'bg-emerald-100/80 text-emerald-800 border-emerald-200/80',
          icon: <CalendarCheck2 className="w-5 h-5 text-emerald-600" />,
        };
      case 'bookkeeping':
        return {
          title: 'Halaman Pembukuan & Keuangan',
          subtitle: 'Pencatatan arus kas masuk & keluar, multi-buku kas, dan ekspor Excel & PDF.',
          badge: `Buku: ${activeLedgerName || 'Kas Utama'}`,
          badgeColor: 'bg-teal-100/80 text-teal-800 border-teal-200/80',
          icon: <WalletCards className="w-5 h-5 text-teal-600" />,
        };
      case 'whatsapp':
        return {
          title: 'Halaman WhatsApp Terjadwal & Otomatis',
          subtitle: 'Jadwalkan pesan WhatsApp otomatis untuk pelanggan & mitra langsung via nomor HP Anda.',
          badge: 'WhatsApp Mandiri',
          badgeColor: 'bg-green-100/80 text-green-800 border-green-200/80',
          icon: <MessageSquare className="w-5 h-5 text-green-600" />,
        };
      case 'settings':
        return {
          title: 'Halaman Pengaturan & Tautkan WhatsApp',
          subtitle: 'Tautkan WhatsApp dengan scan QR barcode mandiri, konfigurasi suara AI, dan kelola cadangan data.',
          badge: 'Scan QR WhatsApp',
          badgeColor: 'bg-emerald-100/80 text-emerald-800 border-emerald-200/80',
          icon: <Settings className="w-5 h-5 text-emerald-600" />,
        };
      case 'login':
        return {
          title: 'Halaman Masuk Akun (Pemilik & Staf)',
          subtitle: 'Pilih dan masuk ke akun pemilik atau staf dengan verifikasi PIN dan akses cloud.',
          badge: 'Masuk Akun',
          badgeColor: 'bg-amber-100/80 text-amber-800 border-amber-200/80',
          icon: <LogIn className="w-5 h-5 text-amber-600" />,
        };
    }
  };

  const info = getPageInfo();

  return (
    <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-white/75 backdrop-blur-2xl backdrop-saturate-180 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
      {/* Specular highlight */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Left: Back Button & Breadcrumbs */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs">
            {/* Back to Home Glass Button */}
            <button
              id="btn-back-to-home"
              type="button"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/5 hover:bg-slate-900/10 text-slate-700 hover:text-slate-900 border border-slate-200/70 backdrop-blur-md transition-all font-bold cursor-pointer group"
              title="Kembali ke Beranda (Menu Utama Kaca)"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <Home className="w-3.5 h-3.5 text-slate-500" />
              <span>Kembali ke Beranda</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

            <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold border ${info.badgeColor}`}>
              {info.badge}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-white/90 border border-white flex items-center justify-center shrink-0 shadow-2xs">
              {info.icon}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                {info.title}
              </h2>
              <p className="text-xs text-slate-500 hidden sm:block">
                {info.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Quick Switcher to other pages */}
        <div className="flex items-center space-x-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider hidden md:inline">
            Pindah:
          </span>

          {currentTab !== 'reminders' && (
            <button
              type="button"
              onClick={() => onNavigate('reminders')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/60 hover:bg-white text-slate-700 border border-slate-200/60 text-xs font-semibold backdrop-blur-md transition-all shadow-2xs cursor-pointer"
              title="Buka Halaman Pengingat"
            >
              <CalendarCheck2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pengingat</span>
              {pendingRemindersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-3xs font-extrabold bg-amber-500 text-white">
                  {pendingRemindersCount}
                </span>
              )}
            </button>
          )}

          {currentTab !== 'bookkeeping' && (
            <button
              type="button"
              onClick={() => onNavigate('bookkeeping')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/60 hover:bg-white text-slate-700 border border-slate-200/60 text-xs font-semibold backdrop-blur-md transition-all shadow-2xs cursor-pointer"
              title="Buka Halaman Pembukuan"
            >
              <WalletCards className="w-3.5 h-3.5 text-teal-600" />
              <span>Keuangan</span>
            </button>
          )}

          {currentTab !== 'whatsapp' && (
            <button
              type="button"
              onClick={() => onNavigate('whatsapp')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/60 hover:bg-white text-slate-700 border border-slate-200/60 text-xs font-semibold backdrop-blur-md transition-all shadow-2xs cursor-pointer"
              title="Buka Halaman WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 text-green-600" />
              <span>WhatsApp</span>
              {pendingWhatsAppCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-3xs font-extrabold bg-emerald-600 text-white">
                  {pendingWhatsAppCount}
                </span>
              )}
            </button>
          )}

          {currentTab !== 'settings' && (
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/60 hover:bg-white text-slate-700 border border-slate-200/60 text-xs font-semibold backdrop-blur-md transition-all shadow-2xs cursor-pointer"
              title="Buka Halaman Pengaturan & Scan QR WhatsApp"
            >
              <Settings className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pengaturan &amp; WA</span>
            </button>
          )}

          {currentTab !== 'login' && (
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Buka Halaman Masuk Akun Pemilik & Staf"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>Masuk Akun</span>
            </button>
          )}

          {/* Account Profile Switcher */}
          {onOpenAccountModal && (
            <button
              type="button"
              onClick={onOpenAccountModal}
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md transition-all cursor-pointer shadow-2xs ${
                currentUser?.isCloudUser 
                  ? 'bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-900 border-emerald-300/80' 
                  : 'bg-indigo-50/80 hover:bg-indigo-100/90 text-indigo-900 border-indigo-200/80'
              }`}
              title="Ganti Akun Pengguna / Status Akun"
            >
              {currentUser?.isCloudUser ? (
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Users className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span className="hidden sm:inline max-w-[90px] truncate">{currentUser?.displayName || 'Akun'}</span>
            </button>
          )}

          <PWAInstallButton />
        </div>

      </div>
    </div>
  );
};
