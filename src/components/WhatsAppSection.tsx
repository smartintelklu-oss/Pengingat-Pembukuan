import React, { useState, useMemo, useEffect } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Send, 
  Calendar, 
  Clock, 
  Repeat, 
  User, 
  Phone, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Zap,
  RefreshCw,
  Rocket,
  Radio
} from 'lucide-react';
import { ScheduledWhatsApp, WhatsAppTextType } from '../types';
import { 
  displayPhoneNumber, 
  sendScheduledWhatsApp, 
  WHATSAPP_TEXT_TEMPLATES 
} from '../utils/whatsapp';
import { 
  getWhatsAppStatus,
  WhatsAppState 
} from '../utils/whatsappGateway';

interface WhatsAppSectionProps {
  items: ScheduledWhatsApp[];
  onAdd: () => void;
  onEdit: (item: ScheduledWhatsApp) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onSendNow: (item: ScheduledWhatsApp) => void;
  onSendViaGateway?: (item: ScheduledWhatsApp) => Promise<{ success: boolean; message: string; provider?: string }>;
  onOpenSettings?: () => void;
}

export const WhatsAppSection: React.FC<WhatsAppSectionProps> = ({
  items,
  onAdd,
  onEdit,
  onDelete,
  onToggleStatus,
  onSendNow,
  onSendViaGateway,
  onOpenSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'recurring' | 'sent'>('all');
  const [textTypeFilter, setTextTypeFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Self-Hosted WhatsApp Connection State
  const [waState, setWaState] = useState<WhatsAppState>({
    status: 'disconnected',
    isConnected: false,
    qrCode: null,
    phoneNumber: null,
    pushName: null,
    lastConnectedAt: null,
    lastError: null,
  });
  const [sendingGatewayId, setSendingGatewayId] = useState<string | null>(null);
  const [gatewayFeedback, setGatewayFeedback] = useState<{
    id: string;
    success: boolean;
    message: string;
  } | null>(null);

  const fetchStatus = async () => {
    try {
      const state = await getWhatsAppStatus();
      setWaState(state);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Statistics calculation
  const totalCount = items.length;
  const pendingCount = items.filter(i => i.status === 'pending').length;
  const sentCount = items.filter(i => i.status === 'sent').length;
  const recurringCount = items.filter(i => i.recurrence !== 'none').length;

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.recipientName.toLowerCase().includes(q);
        const matchesNumber = item.whatsappNumber.includes(q);
        const matchesMsg = item.messageContent.toLowerCase().includes(q);
        if (!matchesName && !matchesNumber && !matchesMsg) return false;
      }

      // Status tab filter
      if (statusFilter === 'pending' && item.status !== 'pending') return false;
      if (statusFilter === 'sent' && item.status !== 'sent') return false;
      if (statusFilter === 'recurring' && item.recurrence === 'none') return false;

      // Text type filter
      if (textTypeFilter !== 'all' && item.textType !== textTypeFilter) return false;

      return true;
    }).sort((a, b) => {
      // Pending first, then by scheduledDateTime ascending
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(a.scheduledDateTime).getTime() - new Date(b.scheduledDateTime).getTime();
    });
  }, [items, searchQuery, statusFilter, textTypeFilter]);

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendGatewayDirect = async (item: ScheduledWhatsApp) => {
    if (!onSendViaGateway) return;
    setSendingGatewayId(item.id);
    setGatewayFeedback(null);

    try {
      const res = await onSendViaGateway(item);
      setGatewayFeedback({
        id: item.id,
        success: res.success,
        message: res.message,
      });
      setTimeout(() => {
        setGatewayFeedback(null);
      }, 5000);
    } catch (err: any) {
      setGatewayFeedback({
        id: item.id,
        success: false,
        message: err.message || 'Gagal mengirim pesan via WhatsApp mandiri.',
      });
    } finally {
      setSendingGatewayId(null);
    }
  };

  // Helper for text type badges
  const getTextTypeBadge = (type: WhatsAppTextType) => {
    switch (type) {
      case 'pengingat':
        return { label: 'Pengingat Agenda', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'tagihan':
        return { label: 'Tagihan & Bayar', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'ucapan':
        return { label: 'Ucapan Spesial', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'laporan':
        return { label: 'Laporan & Rekap', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'kustom':
      default:
        return { label: 'Pesan Kustom', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  // Recurrence label
  const getRecurrenceLabel = (rec: string) => {
    switch (rec) {
      case 'daily': return 'Setiap Hari';
      case 'weekly': return 'Setiap Minggu';
      case 'monthly': return 'Setiap Bulan';
      case 'yearly': return 'Setiap Tahun';
      default: return 'Sekali Saja';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              Integrasi WhatsApp
            </span>
            <span className="text-xs text-slate-400 font-medium">Auto-Format +62</span>
            
            {/* Gateway status chip */}
            <button
              type="button"
              onClick={onOpenSettings}
              title="Klik untuk membuka pengaturan integrasi WhatsApp"
              className={`px-3 py-1 rounded-full text-2xs font-bold border inline-flex items-center space-x-1.5 transition-all cursor-pointer ${
                waState.isConnected 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${waState.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>
                {waState.isConnected 
                  ? `WhatsApp HP Terhubung (+${waState.phoneNumber || 'Aktif'})` 
                  : 'WhatsApp Belum Tertaut (Klik Scan QR)'}
              </span>
            </button>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Pesan WhatsApp Terjadwal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Kelola pesan WhatsApp otomatis terjadwal untuk mitra, pelanggan, atau keluarga. Terhubung langsung ke nomor HP WhatsApp Anda tanpa perantara pihak ketiga.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Add Scheduled WhatsApp Button */}
          <button
            id="btn-add-scheduled-wa"
            type="button"
            onClick={onAdd}
            className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Jadwalkan WhatsApp Baru</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <p className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Total Jadwal</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{totalCount}</p>
          <span className="text-3xs text-slate-400">Pesan terdaftar</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 shadow-2xs">
          <p className="text-2xs font-bold text-emerald-800 uppercase tracking-wider">Menunggu Kirim</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">{pendingCount}</p>
          <span className="text-3xs text-emerald-600 font-medium">Sesuai tanggal jadwal</span>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 shadow-2xs">
          <p className="text-2xs font-bold text-purple-800 uppercase tracking-wider">Pesan Berulang</p>
          <p className="text-xl sm:text-2xl font-black text-purple-700 mt-0.5">{recurringCount}</p>
          <span className="text-3xs text-purple-600 font-medium">Harian/Minggu/Bulan/Tahun</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
          <p className="text-2xs font-bold text-slate-500 uppercase tracking-wider">Telah Terkirim</p>
          <p className="text-xl sm:text-2xl font-black text-slate-700 mt-0.5">{sentCount}</p>
          <span className="text-3xs text-slate-400">Pesan berhasil dikirim</span>
        </div>
      </div>

      {/* Global Feedback Banner for Gateway Direct Sends */}
      {gatewayFeedback && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm transition-all flex items-start space-x-2.5 animate-in fade-in duration-200 ${
          gatewayFeedback.success 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {gatewayFeedback.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <p className="font-bold">{gatewayFeedback.message}</p>
            <p className="text-xs opacity-80">
              {gatewayFeedback.success 
                ? 'Status pesan telah diperbarui secara otomatis.' 
                : 'Periksa kembali API Key dan status perangkat di akun penyedia gateway Anda.'}
            </p>
          </div>
        </div>
      )}


      {/* Filters and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari penerima, nomor HP, atau isi pesan..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100/80 border border-slate-200/60 text-2xs font-bold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'pending' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Menunggu ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('recurring')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'recurring' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Berulang ({recurringCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('sent')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'sent' ? 'bg-slate-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Terkirim ({sentCount})
            </button>
          </div>

          {/* Text Type Dropdown */}
          <select
            value={textTypeFilter}
            onChange={(e) => setTextTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">Semua Jenis Teks</option>
            <option value="pengingat">📌 Pengingat Agenda</option>
            <option value="tagihan">💳 Tagihan &amp; Bayar</option>
            <option value="ucapan">🎉 Ucapan Spesial</option>
            <option value="laporan">📊 Laporan &amp; Rekap</option>
            <option value="kustom">✏️ Pesan Kustom</option>
          </select>
        </div>
      </div>

      {/* Scheduled Items List */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            {searchQuery ? 'Tidak ada pesan WhatsApp yang cocok' : 'Belum ada jadwal pesan WhatsApp'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {searchQuery 
              ? 'Silakan coba kata kunci pencarian lain atau ubah filter status.' 
              : 'Jadwalkan pesan WhatsApp otomatis untuk pengingat janji temu, tagihan pembayaran, atau ucapan selamat.'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Jadwalkan Pesan Sekarang</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const badge = getTextTypeBadge(item.textType);
            const isPending = item.status === 'pending';
            const isSendingGateway = sendingGatewayId === item.id;

            // Format date
            const dateObj = new Date(`${item.scheduledDate}T${item.scheduledTime}`);
            const dateStr = !isNaN(dateObj.getTime())
              ? dateObj.toLocaleDateString('id-ID', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : item.scheduledDate;

            return (
              <div 
                key={item.id}
                className={`p-5 rounded-3xl bg-white border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between ${
                  isPending 
                    ? 'border-emerald-200/80 ring-1 ring-emerald-500/10' 
                    : 'border-slate-200/80 opacity-90'
                }`}
              >
                <div>
                  {/* Card Top: Recipient & Badges */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                        {item.recipientName.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1">
                          {item.recipientName}
                        </h4>
                        <div className="flex items-center space-x-1 text-xs text-emerald-800 font-semibold mt-0.5">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{displayPhoneNumber(item.whatsappNumber)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wider border ${
                        isPending 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {isPending ? 'Menunggu Jadwal' : 'Terkirim'}
                      </span>

                      {item.recurrence !== 'none' && (
                        <span className="inline-flex items-center text-3xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                          <Repeat className="w-2.5 h-2.5 mr-1" />
                          {getRecurrenceLabel(item.recurrence)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata Row: Jenis Teks & Waktu Pengiriman */}
                  <div className="flex flex-wrap items-center gap-2 mb-3 text-2xs">
                    {/* Jenis Teks badge */}
                    <span className={`px-2 py-0.5 rounded-md font-semibold border ${badge.color}`}>
                      {badge.label}
                    </span>

                    {/* Waktu Pengiriman */}
                    <span className="inline-flex items-center space-x-1 text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md font-medium">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{dateStr}</span>
                      <span className="text-slate-300">•</span>
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="font-bold text-slate-700">{item.scheduledTime} WIB</span>
                    </span>
                  </div>

                  {/* WhatsApp Chat Bubble Preview */}
                  <div className="relative p-3.5 rounded-2xl bg-[#efeae2]/80 border border-[#d1d7db] mb-4">
                    <div className="bg-white rounded-xl rounded-tl-xs p-3 shadow-2xs border border-emerald-100/50">
                      <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed line-clamp-4 font-sans">
                        {item.messageContent}
                      </p>
                      
                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-100 text-3xs text-slate-400">
                        <span>Pesan WhatsApp</span>
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyText(item.id, item.messageContent)}
                            title="Salin isi teks pesan"
                            className="hover:text-emerald-700 flex items-center space-x-0.5 cursor-pointer"
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600 font-bold">Disalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Salin</span>
                              </>
                            )}
                          </button>
                          <span>•</span>
                          <span>{item.scheduledTime}</span>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-1">
                    {/* Toggle Sent Status */}
                    <button
                      type="button"
                      onClick={() => onToggleStatus(item.id)}
                      title={isPending ? 'Tandai sudah terkirim' : 'Tandai belum terkirim'}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer flex items-center space-x-1 ${
                        isPending 
                          ? 'bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border-slate-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isPending ? 'Tandai Kirim' : 'Terkirim'}</span>
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      title="Edit jadwal WhatsApp"
                      className="p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      title="Hapus jadwal WhatsApp"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Send Action Buttons */}
                  <div className="flex items-center space-x-1.5">
                    {/* If WhatsApp device is connected: Provide Direct Automatic Background Send */}
                    {waState.isConnected && onSendViaGateway && (
                      <button
                        type="button"
                        onClick={() => handleSendGatewayDirect(item)}
                        disabled={sendingGatewayId === item.id}
                        title="Kirim pesan otomatis langsung dari HP WhatsApp Anda"
                        className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl text-white text-xs font-bold shadow-2xs transition-all disabled:opacity-50 cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                      >
                        {sendingGatewayId === item.id ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Mengirim...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3 h-3" />
                            <span>Kirim Otomatis</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Primary Send WhatsApp via Web / App (Manual link) */}
                    <button
                      type="button"
                      onClick={() => onSendNow(item)}
                      title="Buka WhatsApp Web / Aplikasi secara manual"
                      className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${
                        waState.isConnected
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{waState.isConnected ? 'Buka WA Web' : 'Kirim Sekarang'}</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
