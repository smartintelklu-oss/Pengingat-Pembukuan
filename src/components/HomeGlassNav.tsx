import React from 'react';
import { 
  CalendarCheck2, 
  WalletCards, 
  MessageSquare,
  Sparkles, 
  Volume2, 
  ArrowRight, 
  CheckCircle2, 
  Repeat,
  Clock,
  Send,
  Zap,
  Layers,
  ChevronRight,
  TrendingUp,
  Plus,
  Settings,
  Key,
  User,
  Users,
  Cloud,
  LogIn,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { AppTab, ReminderTask, Transaction, ScheduledWhatsApp, AppUser } from '../types';
import { playNotificationChime } from '../utils/audio';
import { PWAInstallButton } from './PWAInstallButton';

interface HomeGlassNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  pendingRemindersCount: number;
  totalRemindersCount: number;
  activeLedgerName: string;
  totalTransactionsCount: number;
  pendingWhatsAppCount: number;
  totalWhatsAppCount: number;
  onSimulateAlarm: () => void;
  recentReminders?: ReminderTask[];
  recentTransactions?: Transaction[];
  recentScheduledWhatsApp?: ScheduledWhatsApp[];
  currentUser?: AppUser;
  onOpenAccountModal?: () => void;
}

export const HomeGlassNav: React.FC<HomeGlassNavProps> = ({
  setActiveTab,
  pendingRemindersCount,
  totalRemindersCount,
  activeLedgerName,
  totalTransactionsCount,
  pendingWhatsAppCount,
  totalWhatsAppCount,
  onSimulateAlarm,
  recentReminders = [],
  recentTransactions = [],
  recentScheduledWhatsApp = [],
  currentUser,
  onOpenAccountModal,
}) => {
  return (
    <section 
      aria-label="Panel Beranda Kaca Modern"
      className="space-y-6 sm:space-y-8 animate-in fade-in duration-300"
    >
      {/* 1. Welcome Glass Hero Card */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-white/70 backdrop-blur-2xl backdrop-saturate-180 border border-white/80 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Specular Highlight line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/95 to-transparent pointer-events-none" />
        {/* Ambient Gradient Blobs */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-2xs font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pusat Kendali Modern</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Aplikasi Catatan Pengingat, Pembukuan &amp; WhatsApp
            </h2>
          </div>

          {/* Quick Utility Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Quick Access to Login Page for Owner / Staff */}
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 shadow-xs hover:shadow-sm text-xs font-bold transition-all cursor-pointer"
              title="Buka Halaman Masuk Akun Pemilik & Staf"
            >
              <LogIn className="w-4 h-4 text-emerald-400" />
              <span>Masuk Akun (Pemilik/Staf)</span>
            </button>

            {onOpenAccountModal && (
              <button
                type="button"
                onClick={onOpenAccountModal}
                className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl border backdrop-blur-md shadow-2xs hover:shadow-xs text-xs font-bold transition-all cursor-pointer ${
                  currentUser?.isCloudUser
                    ? 'bg-emerald-50/90 hover:bg-emerald-100 text-emerald-900 border-emerald-300/80'
                    : 'bg-indigo-50/90 hover:bg-indigo-100 text-indigo-900 border-indigo-200/80'
                }`}
                title="Ganti Akun Pengguna / Sinkronisasi Firebase Cloud"
              >
                {currentUser?.role === 'owner' ? (
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                ) : (
                  <Briefcase className="w-4 h-4 text-teal-600" />
                )}
                <span>Akun: <strong>{currentUser?.displayName || 'Profil'}</strong></span>
                <span className={`px-1.5 py-0.5 rounded-full text-3xs font-extrabold ${
                  currentUser?.role === 'owner' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                }`}>
                  {currentUser?.role === 'owner' ? 'Pemilik' : 'Staf'}
                </span>
                {currentUser?.isCloudUser && (
                  <span className="px-1.5 py-0.5 rounded-full text-3xs font-extrabold bg-emerald-600 text-white">Cloud</span>
                )}
              </button>
            )}
            <PWAInstallButton />
            <button
              type="button"
              onClick={onSimulateAlarm}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white/80 hover:bg-white text-slate-700 hover:text-emerald-800 border border-white/90 backdrop-blur-md shadow-2xs hover:shadow-xs text-xs font-bold transition-all cursor-pointer"
              title="Simulasi Alarm Pengingat Suara AI Instan"
            >
              <Volume2 className="w-4 h-4 text-emerald-600" />
              <span>Tes Alarm Suara AI</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500/30 shadow-xs hover:shadow-sm text-xs font-bold transition-all cursor-pointer"
              title="Buka Halaman Pengaturan & Tautkan WhatsApp"
            >
              <Settings className="w-4 h-4" />
              <span>Tautkan WhatsApp (Scan QR)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. FOUR MODERN GLASS ICON BUTTONS (Main Request) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider">
              Pilih Menu Halaman Utama
            </h3>
          </div>
          <span className="text-2xs text-slate-400 font-medium">
            Klik tombol kaca untuk membuka halaman baru
          </span>
        </div>

        {/* 4 Glass Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          
          {/* ======================================================== */}
          {/* TOMBOL KACA 1: PENGINGAT (AGENDA & TUGAS)               */}
          {/* ======================================================== */}
          <div
            id="btn-masuk-halaman-pengingat"
            onClick={() => setActiveTab('reminders')}
            className="group relative text-left p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-sky-100/95 via-blue-50/90 to-cyan-100/80 hover:from-sky-100 hover:via-blue-50 hover:to-cyan-100 backdrop-blur-2xl backdrop-saturate-180 border border-sky-200/90 hover:border-sky-400/80 shadow-[0_10px_30px_-5px_rgba(56,189,248,0.18)] hover:shadow-[0_20px_40px_-10px_rgba(14,165,233,0.28)] transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden ring-1 ring-sky-400/25 hover:ring-sky-500/35"
          >
            {/* Specular highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />
            {/* Ambient soft glow on hover (Light Blue / Sky tint) */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-sky-400/25 rounded-full blur-2xl group-hover:bg-sky-400/40 transition-all pointer-events-none" />

            <div>
              {/* Header: Glowing Glass Icon & Badge */}
              <div className="flex items-start justify-between gap-3 mb-5">
                {/* 3D Glass Icon (Area Sentuh 48x48 dp, Ikon 24x24 dp) */}
                <div 
                  className="relative w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 border border-white/40 group-hover:scale-105 transition-transform duration-300 shrink-0"
                  style={{ width: '48px', height: '48px' }}
                >
                  <CalendarCheck2 className="w-6 h-6 shrink-0" style={{ width: '24px', height: '24px' }} />
                  {pendingRemindersCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black border-2 border-white shadow-xs flex items-center justify-center animate-pulse">
                      {pendingRemindersCount}
                    </span>
                  )}
                </div>

                <span className="px-2.5 py-1 rounded-full text-2xs font-extrabold uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-800">
                  Modul 01
                </span>
              </div>

              {/* Title */}
              <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                Pengingat Agenda &amp; Tugas
              </h4>

              {/* Live Info Badges */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-xl text-2xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                  {pendingRemindersCount} Agenda Menunggu
                </span>
                <span className="px-2.5 py-1 rounded-xl text-2xs font-semibold bg-slate-100/80 text-slate-600">
                  {totalRemindersCount} Total Terdaftar
                </span>
              </div>
            </div>

            {/* Bottom Glass Action Button: Masuk Halaman Baru */}
            <div className="pt-5 mt-4 border-t border-sky-200/70">
              <div className="w-full flex items-center justify-between py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:from-emerald-700 group-hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-emerald-600/20 transition-all">
                <span>Masuk Halaman Pengingat</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* TOMBOL KACA 2: KEUANGAN (PEMBUKUAN KAS)                 */}
          {/* ======================================================== */}
          <div
            id="btn-masuk-halaman-keuangan"
            onClick={() => setActiveTab('bookkeeping')}
            className="group relative text-left p-6 sm:p-7 rounded-3xl bg-white/70 hover:bg-white/90 backdrop-blur-2xl backdrop-saturate-180 border border-white/80 hover:border-teal-300 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(20,184,166,0.15)] transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden ring-1 ring-slate-900/5 hover:ring-teal-500/20"
          >
            {/* Specular highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />
            {/* Ambient soft glow on hover */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-all pointer-events-none" />

            <div>
              {/* Header: Glowing Glass Icon & Badge */}
              <div className="flex items-start justify-between gap-3 mb-5">
                {/* 3D Glass Icon (Area Sentuh 48x48 dp, Ikon 24x24 dp) */}
                <div 
                  className="relative w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl bg-gradient-to-tr from-teal-600 via-cyan-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-teal-500/25 border border-white/40 group-hover:scale-105 transition-transform duration-300 shrink-0"
                  style={{ width: '48px', height: '48px' }}
                >
                  <WalletCards className="w-6 h-6 shrink-0" style={{ width: '24px', height: '24px' }} />
                </div>

                <span className="px-2.5 py-1 rounded-full text-2xs font-extrabold uppercase tracking-wider bg-teal-50 border border-teal-200 text-teal-800">
                  Modul 02
                </span>
              </div>

              {/* Title */}
              <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight group-hover:text-teal-700 transition-colors">
                Keuangan &amp; Pembukuan Kas
              </h4>

              {/* Live Info Badges */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-xl text-2xs font-bold bg-teal-50 text-teal-800 border border-teal-200/80 truncate max-w-[170px]">
                  Buku: {activeLedgerName}
                </span>
                <span className="px-2.5 py-1 rounded-xl text-2xs font-semibold bg-slate-100/80 text-slate-600">
                  {totalTransactionsCount} Transaksi
                </span>
              </div>
            </div>

            {/* Bottom Glass Action Button: Masuk Halaman Baru */}
            <div className="pt-5 mt-4 border-t border-slate-100/80">
              <div className="w-full flex items-center justify-between py-2.5 px-4 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 group-hover:from-teal-700 group-hover:to-cyan-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-teal-600/20 transition-all">
                <span>Masuk Halaman Keuangan</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* TOMBOL KACA 3: WHATSAPP (PESAN TERJADWAL & OTOMATIS)    */}
          {/* ======================================================== */}
          <div
            id="btn-masuk-halaman-whatsapp"
            onClick={() => setActiveTab('whatsapp')}
            className="group relative text-left p-6 sm:p-7 rounded-3xl bg-white/70 hover:bg-white/90 backdrop-blur-2xl backdrop-saturate-180 border border-white/80 hover:border-green-300 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(34,197,94,0.15)] transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden ring-1 ring-slate-900/5 hover:ring-green-500/20"
          >
            {/* Specular highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />
            {/* Ambient soft glow on hover */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all pointer-events-none" />

            <div>
              {/* Header: Glowing Glass Icon & Badge */}
              <div className="flex items-start justify-between gap-3 mb-5">
                {/* 3D Glass Icon (Area Sentuh 48x48 dp, Ikon 24x24 dp) */}
                <div 
                  className="relative w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl bg-gradient-to-tr from-green-600 via-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-green-600/25 border border-white/40 group-hover:scale-105 transition-transform duration-300 shrink-0"
                  style={{ width: '48px', height: '48px' }}
                >
                  <MessageSquare className="w-6 h-6 shrink-0" style={{ width: '24px', height: '24px' }} />
                  {pendingWhatsAppCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-emerald-600 text-white text-[9px] font-black border-2 border-white shadow-xs flex items-center justify-center">
                      {pendingWhatsAppCount}
                    </span>
                  )}
                </div>

                <span className="px-2.5 py-1 rounded-full text-2xs font-extrabold uppercase tracking-wider bg-green-50 border border-green-200 text-green-800">
                  Modul 03
                </span>
              </div>

              {/* Title */}
              <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight group-hover:text-green-700 transition-colors">
                WhatsApp Terjadwal &amp; Otomatis
              </h4>

              {/* Live Info Badges */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-xl text-2xs font-bold bg-green-50 text-green-800 border border-green-200/80">
                  {pendingWhatsAppCount} Pesan Menunggu
                </span>
                <span className="px-2.5 py-1 rounded-xl text-2xs font-semibold bg-slate-100/80 text-slate-600">
                  {totalWhatsAppCount} Terjadwal
                </span>
              </div>
            </div>

            {/* Bottom Glass Action Button: Masuk Halaman Baru */}
            <div className="pt-5 mt-4 border-t border-slate-100/80">
              <div className="w-full flex items-center justify-between py-2.5 px-4 rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 group-hover:from-green-700 group-hover:to-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-green-600/20 transition-all">
                <span>Masuk Halaman WhatsApp</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* TOMBOL KACA 4: PENGATURAN (WHATSAPP QR & SISTEM)        */}
          {/* ======================================================== */}
          <div
            id="btn-masuk-halaman-pengaturan"
            onClick={() => setActiveTab('settings')}
            className="group relative text-left p-6 sm:p-7 rounded-3xl bg-white/70 hover:bg-white/90 backdrop-blur-2xl backdrop-saturate-180 border border-white/80 hover:border-indigo-300 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(99,102,241,0.18)] transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden ring-1 ring-slate-900/5 hover:ring-indigo-500/20"
          >
            {/* Specular highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />
            {/* Ambient soft glow on hover */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />

            <div>
              {/* Header: Glowing Glass Icon & Badge */}
              <div className="flex items-start justify-between gap-3 mb-5">
                {/* 3D Glass Icon (Area Sentuh 48x48 dp, Ikon 24x24 dp) */}
                <div 
                  className="relative w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/25 border border-white/40 group-hover:scale-105 transition-transform duration-300 shrink-0"
                  style={{ width: '48px', height: '48px' }}
                >
                  <Key className="w-6 h-6 shrink-0" style={{ width: '24px', height: '24px' }} />
                </div>

                <span className="px-2.5 py-1 rounded-full text-2xs font-extrabold uppercase tracking-wider bg-indigo-50 border border-indigo-200 text-indigo-800">
                  Modul 04
                </span>
              </div>

              {/* Title */}
              <h4 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight group-hover:text-indigo-700 transition-colors">
                Pengaturan &amp; Tautkan WhatsApp
              </h4>

              {/* Live Info Badges */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-xl text-2xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                  Scan Barcode QR WhatsApp
                </span>
                <span className="px-2.5 py-1 rounded-xl text-2xs font-semibold bg-slate-100/80 text-slate-600">
                  Suara AI &amp; Cadangan
                </span>
              </div>
            </div>

            {/* Bottom Glass Action Button: Masuk Halaman Baru */}
            <div className="pt-5 mt-4 border-t border-slate-100/80">
              <div className="w-full flex items-center justify-between py-2.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600 group-hover:from-indigo-700 group-hover:to-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-indigo-600/20 transition-all">
                <span>Masuk Halaman Pengaturan</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Ringkasan Cepat Terkini di Beranda */}
      <div className="pt-2">
        <div className="p-5 sm:p-6 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Sekilas Status Aktivitas Terkini</span>
            </h4>
            <span className="text-3xs text-slate-400">Sinkronisasi Real-Time</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Quick Preview Pengingat */}
            <div 
              onClick={() => setActiveTab('reminders')}
              className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/70 hover:border-emerald-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-2xs font-bold text-slate-500 mb-1.5">
                <span className="flex items-center space-x-1 text-emerald-700">
                  <CalendarCheck2 className="w-3.5 h-3.5" />
                  <span>Pengingat Terdekat</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              {recentReminders.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {recentReminders[0].title}
                  </p>
                  <p className="text-3xs text-slate-500">
                    {recentReminders[0].dueDate} • {recentReminders[0].dueTime} WIB
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Belum ada agenda terdekat</p>
              )}
            </div>

            {/* Quick Preview Keuangan */}
            <div 
              onClick={() => setActiveTab('bookkeeping')}
              className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/70 hover:border-teal-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-2xs font-bold text-slate-500 mb-1.5">
                <span className="flex items-center space-x-1 text-teal-700">
                  <WalletCards className="w-3.5 h-3.5" />
                  <span>Transaksi Terakhir</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              {recentTransactions.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {recentTransactions[0].title}
                  </p>
                  <p className="text-3xs text-slate-500">
                    {recentTransactions[0].type === 'income' ? '+ Masuk' : '- Keluar'} Rp {recentTransactions[0].amount.toLocaleString('id-ID')}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Belum ada catatan transaksi</p>
              )}
            </div>

            {/* Quick Preview WhatsApp */}
            <div 
              onClick={() => setActiveTab('whatsapp')}
              className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/70 hover:border-green-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-2xs font-bold text-slate-500 mb-1.5">
                <span className="flex items-center space-x-1 text-green-700">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Terdekat</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              {recentScheduledWhatsApp.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    Ke: {recentScheduledWhatsApp[0].recipientName}
                  </p>
                  <p className="text-3xs text-slate-500">
                    {recentScheduledWhatsApp[0].scheduledDate} • {recentScheduledWhatsApp[0].scheduledTime} WIB
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Belum ada jadwal pesan</p>
              )}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
