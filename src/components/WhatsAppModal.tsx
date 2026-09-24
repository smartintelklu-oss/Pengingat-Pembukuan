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
  AlertCircle,
  Plus,
  Trash2,
  ShieldCheck
} from 'lucide-react';
import { ScheduledWhatsApp, WhatsAppTextType, RecurrenceType } from '../types';
import { 
  WHATSAPP_TEXT_TEMPLATES, 
  formatPhoneNumber, 
  displayPhoneNumber,
  generateScheduledWhatsAppLink
} from '../utils/whatsapp';

interface RecipientItem {
  name: string;
  phone: string;
}

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<ScheduledWhatsApp, 'id' | 'createdAt'> | Omit<ScheduledWhatsApp, 'id' | 'createdAt'>[]) => void;
  editingItem?: ScheduledWhatsApp | null;
  defaultAntiSpamMinutes?: 5 | 10 | 20 | 30;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  defaultAntiSpamMinutes = 10,
}) => {
  const [recipients, setRecipients] = useState<RecipientItem[]>([{ name: '', phone: '' }]);
  const [sendIntervalMinutes, setSendIntervalMinutes] = useState<5 | 10 | 20 | 30>(defaultAntiSpamMinutes);
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
      setRecipients([{ name: editingItem.recipientName, phone: editingItem.whatsappNumber }]);
      setTextType(editingItem.textType);
      setMessageContent(editingItem.messageContent);
      setScheduledDate(editingItem.scheduledDate);
      setScheduledTime(editingItem.scheduledTime);
      setRecurrence(editingItem.recurrence);
      setValidationError('');
    } else {
      // New item defaults
      setRecipients([{ name: '', phone: '' }]);
      setSendIntervalMinutes(defaultAntiSpamMinutes);
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

  // Add recipient row (name + phone)
  const handleAddRecipient = () => {
    setRecipients(prev => [...prev, { name: '', phone: '' }]);
  };

  // Remove recipient row
  const handleRemoveRecipient = (index: number) => {
    if (recipients.length <= 1) return;
    setRecipients(prev => prev.filter((_, i) => i !== index));
  };

  // Update specific recipient field
  const handleUpdateRecipient = (index: number, field: 'name' | 'phone', value: string) => {
    setRecipients(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  // Handle changing text type: offer template
  const handleTextTypeChange = (newType: WhatsAppTextType) => {
    setTextType(newType);
    const firstName = recipients[0]?.name || '';
    const template = WHATSAPP_TEXT_TEMPLATES[newType].sample(firstName);
    // If message is empty or matches an existing template, update it
    if (!messageContent.trim() || Object.values(WHATSAPP_TEXT_TEMPLATES).some(t => t.sample(firstName) === messageContent || t.sample('') === messageContent)) {
      setMessageContent(template);
    }
  };

  // Helper to apply template explicitly
  const handleApplyTemplate = () => {
    const firstName = recipients[0]?.name || '';
    const template = WHATSAPP_TEXT_TEMPLATES[textType].sample(firstName);
    setMessageContent(template);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that each recipient has a name and valid phone
    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];
      if (!r.name.trim()) {
        setValidationError(`Nama penerima untuk nomor #${i + 1} wajib diisi`);
        return;
      }
      const cleanPhone = formatPhoneNumber(r.phone);
      if (!cleanPhone || cleanPhone.length < 8) {
        setValidationError(`Nomor WhatsApp #${i + 1} (${r.name.trim()}) harus valid (minimal 8 digit, diawali 08... atau 62...)`);
        return;
      }
    }

    if (!messageContent.trim()) {
      setValidationError('Isi teks pesan tidak boleh kosong');
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      setValidationError('Tanggal dan jam pengiriman wajib ditentukan');
      return;
    }

    const [y, m, d] = scheduledDate.split('-').map(Number);
    const [h, min] = scheduledTime.split(':').map(Number);

    if (recipients.length === 1) {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      const first = recipients[0];
      const cleanPhone = formatPhoneNumber(first.phone);
      const personalized = messageContent.replace(/\{nama\}/gi, first.name.trim());

      onSave({
        recipientName: first.name.trim(),
        whatsappNumber: cleanPhone,
        textType,
        messageContent: personalized.trim(),
        scheduledDate,
        scheduledTime,
        scheduledDateTime,
        recurrence,
        status: editingItem ? editingItem.status : 'pending',
      });
    } else {
      // Multiple recipients: staggered schedule based on sendIntervalMinutes
      const bulkItems = recipients.map((r, idx) => {
        const dt = new Date(y, m - 1, d, h, min);
        dt.setMinutes(dt.getMinutes() + (idx * sendIntervalMinutes));
        const sDate = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
        const sTime = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
        const cleanPhone = formatPhoneNumber(r.phone);
        const personalized = messageContent.replace(/\{nama\}/gi, r.name.trim());

        return {
          recipientName: r.name.trim(),
          whatsappNumber: cleanPhone,
          textType,
          messageContent: personalized.trim(),
          scheduledDate: sDate,
          scheduledTime: sTime,
          scheduledDateTime: dt.toISOString(),
          recurrence: 'none' as RecurrenceType,
          status: 'pending' as const,
        };
      });
      onSave(bulkItems);
    }

    onClose();
  };

  // Quick preview link object
  const previewItem: ScheduledWhatsApp = {
    id: 'preview',
    recipientName: recipients[0]?.name || 'Penerima',
    whatsappNumber: recipients[0]?.phone || '',
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

          {/* Section 1: Daftar Penerima & Nomor WhatsApp */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Daftar Penerima &amp; Nomor WhatsApp <span className="text-rose-500">*</span></span>
                  {recipients.length > 1 && (
                    <span className="text-3xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 ml-1">
                      {recipients.length} Nomor
                    </span>
                  )}
                </label>
                <p className="text-3xs text-slate-400 mt-0.5">
                  Setiap nomor memiliki nama penerimanya masing-masing
                </p>
              </div>

              {!editingItem && (
                <button
                  id="btn-add-recipient-row"
                  type="button"
                  onClick={handleAddRecipient}
                  className="inline-flex items-center space-x-1 text-2xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 shadow-2xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Nomor</span>
                </button>
              )}
            </div>

            {/* List of Recipient Rows */}
            <div className="space-y-3">
              {recipients.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-2.5 transition-all"
                >
                  {/* Row Header if multiple recipients */}
                  {recipients.length > 1 && (
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                      <span className="text-3xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200">
                        Nomor Penerima #{idx + 1}
                      </span>
                      {!editingItem && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(idx)}
                          className="inline-flex items-center space-x-1 text-3xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                          title="Hapus nomor penerima ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Input Nama Penerima untuk nomor ini */}
                    <div>
                      <label className="block text-3xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Nama Penerima <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        id={`input-recipient-name-${idx}`}
                        type="text"
                        required
                        value={item.name}
                        onChange={(e) => handleUpdateRecipient(idx, 'name', e.target.value)}
                        placeholder="Contoh: Budi Santoso / Bu Mega"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>

                    {/* Input Nomor WhatsApp untuk penerima ini */}
                    <div>
                      <label className="block text-3xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>Nomor WhatsApp <span className="text-rose-500">*</span></span>
                      </label>
                      <div className="relative">
                        <input
                          id={`input-wa-number-${idx}`}
                          type="tel"
                          required
                          value={item.phone}
                          onChange={(e) => handleUpdateRecipient(idx, 'phone', e.target.value)}
                          placeholder="081234567890 / 62812..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                        {item.phone && (
                          <span className="absolute right-2.5 top-2 text-3xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {displayPhoneNumber(item.phone)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-3xs text-slate-400">
              Format nomor otomatis: 08xx atau 628xx
            </p>

            {/* Jeda Pengiriman Pesan Antara Nomor (Anti-Spam) jika lebih dari 1 nomor */}
            {recipients.length > 1 && (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Jeda Pengiriman Antara Nomor (Anti-Spam) <span className="text-rose-500">*</span>
                    </span>
                  </div>
                  <span className="text-3xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                    Mencegah Spam WA
                  </span>
                </div>
                
                <p className="text-3xs text-slate-500 leading-relaxed">
                  Pilih jeda waktu pengiriman pesan antar nomor untuk menghindari risiko spam atau pemblokiran nomor WhatsApp:
                </p>

                {/* Tombol Pilihan Jeda: 5 Menit, 10 Menit, 20 Menit, 30 Menit */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([
                    { value: 5, label: '5 Menit', note: 'Kecepatan Sedang' },
                    { value: 10, label: '10 Menit', note: 'Direkomendasikan' },
                    { value: 20, label: '20 Menit', note: 'Ekstra Aman' },
                    { value: 30, label: '30 Menit', note: 'Maksimal Anti-Spam' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSendIntervalMinutes(opt.value)}
                      className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                        sendIntervalMinutes === opt.value
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-extrabold">{opt.label}</div>
                      <div className={`text-3xs mt-0.5 ${sendIntervalMinutes === opt.value ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {opt.note}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Simulasi Waktu Pengiriman Bertahap */}
                {scheduledDate && scheduledTime && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <div className="text-3xs font-bold text-slate-600 mb-1 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <span>Simulasi Jadwal Bertahap ({recipients.length} Nomor):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-3xs text-slate-600">
                      {recipients.map((r, i) => {
                        const [y, m, d] = scheduledDate.split('-').map(Number);
                        const [h, min] = scheduledTime.split(':').map(Number);
                        const dt = new Date(y, m - 1, d, h, min);
                        dt.setMinutes(dt.getMinutes() + (i * sendIntervalMinutes));
                        const timeStr = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
                        return (
                          <span key={i} className="px-2 py-1 rounded-lg bg-white border border-slate-200 font-mono shadow-2xs">
                            #{i + 1} {r.name ? `(${r.name})` : ''}: <b className="text-emerald-700">{timeStr} WIB</b>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
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
              <span>Tips: Gunakan tag <code className="bg-slate-100 text-emerald-700 px-1 py-0.5 rounded font-mono font-bold">{"{nama}"}</code> agar pesan otomatis menyebut nama masing-masing penerima (*tebal*, _miring_, emoji didukung)</span>
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
                {(messageContent ? messageContent.replace(/\{nama\}/gi, recipients[0]?.name || 'Nama Penerima') : '(Teks pesan akan tampil di sini)')}
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
              <span>
                {editingItem 
                  ? 'Simpan Perubahan' 
                  : (recipients.length > 1 
                      ? `Jadwalkan ${recipients.length} Pesan WhatsApp` 
                      : 'Jadwalkan WhatsApp')}
              </span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
