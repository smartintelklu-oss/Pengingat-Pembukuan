import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  BookOpen, 
  CalendarClock, 
  CheckCircle2, 
  Sparkles,
  Volume2,
  CalendarCheck2,
  WalletCards,
  Clock,
  MessageSquare,
  Home
} from 'lucide-react';
import { playNotificationChime, requestNotificationPermission } from '../utils/audio';
import { AppTab } from '../types';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  pendingRemindersCount: number;
  pendingWhatsAppCount?: number;
  currentLedgerName: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  pendingRemindersCount,
  pendingWhatsAppCount = 0,
  currentLedgerName,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [currentDateTime, setCurrentDateTime] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }

    const updateClock = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) + ' WIB'
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      playNotificationChime();
    }
  };

  const handleTestChime = () => {
    playNotificationChime();
  };

  return (
    <>
      {/* Top Navigation Header with Modern Glassmorphism */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl backdrop-saturate-180 border-b border-white/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 sm:h-20">
            
            {/* Brand Identity with Glass Glow Effect */}
            <div 
              onClick={() => setActiveTab('home')} 
              className="flex items-center space-x-3.5 cursor-pointer select-none group"
              title="Kembali ke Beranda"
            >
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl blur-xs opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm border border-white/30">
                  <CalendarClock className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-extrabold text-base sm:text-xl text-slate-900 tracking-tight leading-tight">
                    Catatan <span className="text-emerald-600">&amp;</span> Pembukuan
                  </h1>
                  <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-white/80 backdrop-blur-md text-emerald-800 border border-emerald-200/70 shadow-2xs">
                    <Sparkles className="w-3 h-3 mr-1 text-emerald-600" /> AI Powered
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                  <span className="truncate max-w-[180px] sm:max-w-none">
                    {currentDateTime || 'Pengingat Agenda & Arus Kas'}
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop / Tablet Glass Navigation Switcher */}
            <nav 
              aria-label="Navigasi Utama"
              className="hidden sm:flex items-center p-1.5 rounded-2xl bg-slate-900/[0.04] backdrop-blur-md border border-white/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)]"
            >
              {/* Tab 0: Beranda */}
              <button
                id="tab-beranda-btn"
                type="button"
                onClick={() => setActiveTab('home')}
                className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === 'home'
                    ? 'bg-white/95 text-slate-900 shadow-sm border border-white/90 ring-1 ring-slate-900/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  activeTab === 'home' ? 'bg-slate-900 text-white' : 'text-slate-500'
                }`}>
                  <Home className="w-4 h-4" />
                </div>
                <span>Beranda</span>
              </button>

              {/* Tab 1: Pengingat Tugas */}
              <button
                id="tab-pengingat-btn"
                type="button"
                onClick={() => setActiveTab('reminders')}
                className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === 'reminders'
                    ? 'bg-white/95 text-slate-900 shadow-sm border border-white/90 ring-1 ring-slate-900/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  activeTab === 'reminders' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500'
                }`}>
                  <CalendarCheck2 className="w-4 h-4" />
                </div>
                <span>Pengingat Tugas</span>
                {pendingRemindersCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-2xs font-extrabold bg-amber-500 text-white shadow-xs animate-pulse">
                    {pendingRemindersCount}
                  </span>
                )}
              </button>

              {/* Tab 2: Pembukuan */}
              <button
                id="tab-pembukuan-btn"
                type="button"
                onClick={() => setActiveTab('bookkeeping')}
                className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === 'bookkeeping'
                    ? 'bg-white/95 text-slate-900 shadow-sm border border-white/90 ring-1 ring-slate-900/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  activeTab === 'bookkeeping' ? 'bg-teal-50 text-teal-600' : 'text-slate-500'
                }`}>
                  <WalletCards className="w-4 h-4" />
                </div>
                <span>Pembukuan</span>
                {currentLedgerName && (
                  <span className="hidden lg:inline-flex px-2 py-0.5 rounded-md bg-teal-50/80 border border-teal-200/60 text-2xs font-semibold text-teal-800 truncate max-w-[100px]">
                    {currentLedgerName}
                  </span>
                )}
              </button>

              {/* Tab 3: WhatsApp Terjadwal */}
              <button
                id="tab-whatsapp-btn"
                type="button"
                onClick={() => setActiveTab('whatsapp')}
                className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === 'whatsapp'
                    ? 'bg-white/95 text-slate-900 shadow-sm border border-white/90 ring-1 ring-slate-900/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  activeTab === 'whatsapp' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500'
                }`}>
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span>WhatsApp</span>
                {pendingWhatsAppCount !== undefined && pendingWhatsAppCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-2xs font-extrabold bg-emerald-600 text-white shadow-xs">
                    {pendingWhatsAppCount}
                  </span>
                )}
              </button>
            </nav>

            {/* Glass Utility Controls (Test Chime & Web Notification Status) */}
            <div className="flex items-center space-x-2">
              <button
                id="btn-test-sound"
                type="button"
                onClick={handleTestChime}
                title="Uji Suara Notifikasi (Chime)"
                className="p-2.5 rounded-xl bg-white/70 hover:bg-white/95 text-slate-600 hover:text-emerald-700 backdrop-blur-md border border-white/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
              </button>

              {permission === 'granted' ? (
                <div className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 backdrop-blur-md text-emerald-800 border border-emerald-500/20 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600 shrink-0" />
                  <span>Notifikasi Aktif</span>
                </div>
              ) : (
                <button
                  id="btn-request-notification"
                  type="button"
                  onClick={handleRequestPermission}
                  className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 backdrop-blur-md text-amber-900 border border-amber-500/30 hover:border-amber-500/40 transition-all shadow-2xs cursor-pointer"
                >
                  <BellRing className="w-3.5 h-3.5 mr-1.5 text-amber-600 animate-bounce" />
                  <span className="hidden sm:inline">Aktifkan Notifikasi</span>
                  <span className="sm:hidden">Notif</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Floating Modern Glass Navigation Bar for Mobile Screens */}
      <div className="sm:hidden fixed bottom-4 inset-x-4 z-40">
        <div className="bg-white/85 backdrop-blur-2xl backdrop-saturate-180 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-3xl p-1.5 flex items-center justify-between gap-1 ring-1 ring-black/5">
          
          {/* Mobile Tab 0: Beranda */}
          <button
            id="mobile-tab-beranda"
            type="button"
            onClick={() => setActiveTab('home')}
            className={`flex-1 flex flex-col xs:flex-row items-center justify-center gap-1 xs:space-x-1.5 py-2 px-1 rounded-2xl text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === 'home'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Home className="w-6 h-6 shrink-0" />
            <span>Beranda</span>
          </button>

          {/* Mobile Tab 1: Pengingat */}
          <button
            id="mobile-tab-pengingat"
            type="button"
            onClick={() => setActiveTab('reminders')}
            className={`flex-1 flex flex-col xs:flex-row items-center justify-center gap-1 xs:space-x-1.5 py-2 px-1 rounded-2xl text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === 'reminders'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <CalendarCheck2 className="w-6 h-6 shrink-0" />
              {pendingRemindersCount > 0 && (
                <span className={`absolute -top-1 -right-1.5 min-w-4 h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center shadow-xs ${
                  activeTab === 'reminders' ? 'bg-white text-emerald-800' : 'bg-amber-500 text-white'
                }`}>
                  {pendingRemindersCount}
                </span>
              )}
            </div>
            <span className="hidden xs:inline">Pengingat</span>
          </button>

          {/* Mobile Tab 2: Pembukuan */}
          <button
            id="mobile-tab-pembukuan"
            type="button"
            onClick={() => setActiveTab('bookkeeping')}
            className={`flex-1 flex flex-col xs:flex-row items-center justify-center gap-1 xs:space-x-1.5 py-2 px-1 rounded-2xl text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === 'bookkeeping'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <WalletCards className="w-6 h-6 shrink-0" />
            <span className="hidden xs:inline">Buku</span>
          </button>

          {/* Mobile Tab 3: WhatsApp */}
          <button
            id="mobile-tab-whatsapp"
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 flex flex-col xs:flex-row items-center justify-center gap-1 xs:space-x-1.5 py-2 px-1 rounded-2xl text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <MessageSquare className="w-6 h-6 shrink-0" />
              {pendingWhatsAppCount !== undefined && pendingWhatsAppCount > 0 && (
                <span className={`absolute -top-1 -right-1.5 min-w-4 h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center shadow-xs ${
                  activeTab === 'whatsapp' ? 'bg-white text-emerald-800' : 'bg-emerald-600 text-white'
                }`}>
                  {pendingWhatsAppCount}
                </span>
              )}
            </div>
            <span className="hidden xs:inline">WA</span>
          </button>

        </div>
      </div>
    </>
  );
};
