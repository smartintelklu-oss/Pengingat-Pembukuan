import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  Calendar, 
  Clock, 
  Repeat, 
  User, 
  Phone, 
  FileText, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ScheduledWhatsApp, WhatsAppTextType, RecurrenceType } from '../types';
import { 
  WHATSAPP_TEXT_TEMPLATES, 
  formatPhoneNumber, 
  displayPhoneNumber,
  generateScheduledWhatsAppLink
} from '../utils/whatsapp';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<ScheduledWhatsApp, 'id' | 'createdAt'>) => void;
  editingItem?: ScheduledWhatsApp | null;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
}) => {
  const [recipientName, setRecipientName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [textType, setTextType] = useState<WhatsAppTextType>('pengingat');
  const [messageContent, setMessageContent] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [validationError, setValidationError] = useState('');

  // Default date to today
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (editingItem) {
      setRecipientName(editingItem.recipientName);
      setWhatsappNumber(editingItem.whatsappNumber);
      setTextType(editingItem.textType);
      setMessageContent(editingItem.messageContent);
      setScheduledDate(editingItem.scheduledDate);
      setScheduledTime(editingItem.scheduledTime);
      setRecurrence(editingItem.recurrence);
      setValidationError('');
    } else {
      // New item defaults
      setRecipientName('');
      setWhatsappNumber('');
      setTextType('pengingat');
      setMessageContent(WHATSAPP_TEXT_TEMPLATES.pengingat.sample(''));
      setScheduledDate(todayStr);
      
      // Default time: next hour rounded
      const now = new Date();
      now.setHours(now.getHours() + 1);
      const nextH = String(now.getHours()).padStart(2, '0');
      setScheduledTime(`${nextH}:00`);
      
      setRecurrence('none');
      setValidationError('');
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  // Handle changing text type: offer template
  const handleTextTypeChange = (newType: WhatsAppTextType) => {
    setTextType(newType);
    const template = WHATSAPP_TEXT_TEMPLATES[newType].sample(recipientName);
    // If message is empty or matches an existing template, update it
    if (!messageContent.trim() || Object.values(WHATSAPP_TEXT_TEMPLATES).some(t => t.sample(recipientName) === messageContent || t.sample('') === messageContent)) {
      setMessageContent(template);
    }
  };

  // Helper to apply template explicitly
  const handleApplyTemplate = () => {
    const template = WHATSAPP_TEXT_TEMPLATES[textType].sample(recipientName);
    setMessageContent(template);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientName.trim()) {
      setValidationError('Nama penerima wajib diisi');
      return;
    }

    const cleanPhone = formatPhoneNumber(whatsappNumber);
    if (!cleanPhone || cleanPhone.length < 8) {
      setValidationError('Nomor WhatsApp harus valid (minimal 8 digit, diawali 08... atau 62...)');
      return;
    }

    if (!messageContent.trim()) {
      setValidationError('Isi teks pesan tidak boleh kosong');
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      setValidationError('Tanggal dan jam pengiriman wajib ditentukan');
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

    onSave({
      recipientName: recipientName.trim(),
      whatsappNumber: cleanPhone,
      textType,
      messageContent: messageContent.trim(),
      scheduledDate,
      scheduledTime,
      scheduledDateTime,
      recurrence,
      status: editingItem ? editingItem.status : 'pending',
    });

    onClose();
  };

  // Quick preview link object
  const previewItem: ScheduledWhatsApp = {
    id: 'preview',
    recipientName: recipientName || 'Penerima',
    whatsappNumber: whatsappNumber || '',
    textType,
    messageContent: messageContent || '',
    scheduledDate,
    scheduledTime,
    scheduledDateTime: '',
    recurrence,
    status: 'pending',
    createdAt: '',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {editingItem ? 'Edit Jadwal Pesan WhatsApp' : 'Jadwalkan Pesan WhatsApp Baru'}
              </h3>
              <p className="text-xs text-emerald-100">
                Atur penerima, jenis pesan, waktu kirim, dan frekuensi pengulangan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {validationError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Section 1: Kontak Penerima (Nama & Nomor WhatsApp) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Input Nama Penerima */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nama Penerima <span className="text-rose-500">*</span></span>
              </label>
              <input
                id="input-wa-name"
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Contoh: Budi Santoso / Bu Mega"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Input Nomor WhatsApp */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nomor WhatsApp <span className="text-rose-500">*</span></span>
              </label>
              <div className="relative">
                <input
                  id="input-wa-number"
                  type="tel"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="081234567890 / 62812..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                {whatsappNumber && (
                  <span className="absolute right-3 top-2.5 text-3xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {displayPhoneNumber(whatsappNumber)}
                  </span>
                )}
              </div>
              <p className="text-3xs text-slate-400 mt-1">
                Format Indonesia otomatis: 08xx atau 628xx
              </p>
            </div>
          </div>

          {/* Section 2: Jenis Teks & Pengulangan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
            {/* Pilihan Jenis Teks */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Jenis Teks Pesan</span>
              </label>
              <select
                id="select-wa-text-type"
                value={textType}
                onChange={(e) => handleTextTypeChange(e.target.value as WhatsAppTextType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="pengingat">📌 Pengingat Agenda &amp; Tugas</option>
                <option value="tagihan">💳 Pengingat Tagihan &amp; Pembayaran</option>
                <option value="ucapan">🎉 Ucapan Selamat &amp; Hari Spesial</option>
                <option value="laporan">📊 Laporan &amp; Rekap Informasi</option>
                <option value="kustom">✏️ Pesan Bebas / Kustom</option>
              </select>
            </div>

            {/* Pilihan Pengulangan (Setiap hari, minggu, bulan, tahun) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <Repeat className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pilihan Berulang</span>
              </label>
              <select
                id="select-wa-recurrence"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="none">Sekali Saja (Tanpa Pengulangan)</option>
                <option value="daily">Setiap Hari</option>
                <option value="weekly">Setiap Minggu</option>
                <option value="monthly">Setiap Bulan</option>
                <option value="yearly">Setiap Tahun</option>
              </select>
            </div>
          </div>

          {/* Section 3: Waktu Pengiriman Pesan (Tanggal & Jam) */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Waktu Pengiriman Pesan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tanggal Pengiriman</span>
                </label>
                <input
                  id="input-wa-date"
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-emerald-200 text-xs sm:text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Jam Pengiriman (WIB)</span>
                </label>
                <input
                  id="input-wa-time"
                  type="time"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-emerald-200 text-xs sm:text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Isi Teks Pesan WhatsApp */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Isi Teks Pesan WhatsApp <span className="text-rose-500">*</span></span>
              </label>

              <button
                type="button"
                onClick={handleApplyTemplate}
                className="text-2xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Isi Template Jenis Ini</span>
              </button>
            </div>

            <textarea
              id="textarea-wa-content"
              required
              rows={5}
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Tuliskan pesan WhatsApp yang ingin dijadwalkan..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans leading-relaxed"
            />
            <div className="flex items-center justify-between text-3xs text-slate-400 mt-1">
              <span>Tips: Format WhatsApp didukung (*tebal*, _miring_, emoji)</span>
              <span>{messageContent.length} karakter</span>
            </div>
          </div>

          {/* Preview Bubble Chat WhatsApp */}
          <div className="p-3.5 rounded-2xl bg-[#efeae2] border border-[#d1d7db] space-y-2">
            <span className="text-3xs font-extrabold uppercase tracking-wider text-slate-600 block">
              Pratinjau Gelembung Chat WhatsApp
            </span>
            <div className="max-w-md bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-xs border border-emerald-100/50 relative">
              <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {messageContent || '(Teks pesan akan tampil di sini)'}
              </p>
              <div className="flex items-center justify-end space-x-1 text-3xs text-slate-400 mt-1.5">
                <span>{scheduledTime}</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{editingItem ? 'Simpan Perubahan' : 'Jadwalkan WhatsApp'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
