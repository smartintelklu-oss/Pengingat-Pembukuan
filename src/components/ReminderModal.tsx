import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Sparkles, 
  Volume2, 
  Loader2
} from 'lucide-react';
import { ReminderTask, RecurrenceType } from '../types';
import { speakText, playNotificationChime } from '../utils/audio';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<ReminderTask>) => void;
  editingTask?: ReminderTask | null;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTask,
}) => {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('Usaha');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('09:00');
  const [reminderOffset, setReminderOffset] = useState<string>('15');
  const [customOffsetMinutes, setCustomOffsetMinutes] = useState<number>(45);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');

  // AI Voice
  const [aiVoiceTone, setAiVoiceTone] = useState<'friendly' | 'professional' | 'urgent' | 'cheerful'>('friendly');
  const [aiVoiceScript, setAiVoiceScript] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setNote(editingTask.note);
      setCategory(editingTask.category);
      setDueDate(editingTask.dueDate);
      setDueTime(editingTask.dueTime);
      
      const standardOffsets = [0, 5, 15, 30, 60, 120, 1440];
      if (standardOffsets.includes(editingTask.reminderOffsetMinutes)) {
        setReminderOffset(String(editingTask.reminderOffsetMinutes));
      } else {
        setReminderOffset('custom');
        setCustomOffsetMinutes(editingTask.reminderOffsetMinutes);
      }

      setRecurrence(editingTask.recurrence);
      setAiVoiceTone(editingTask.aiVoiceTone);
      setAiVoiceScript(editingTask.aiVoiceScript || '');
    } else {
      // Default new task
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDueDate(tomorrow.toISOString().split('T')[0]);
      setDueTime('09:00');
      setTitle('');
      setNote('');
      setCategory('Usaha');
      setReminderOffset('15');
      setCustomOffsetMinutes(45);
      setRecurrence('none');
      setAiVoiceTone('friendly');
      setAiVoiceScript('');
    }
  }, [editingTask, isOpen]);

  if (!isOpen) return null;

  // Generate voice script with Gemini AI endpoint
  const handleGenerateAiVoice = async () => {
    if (!title.trim()) {
      alert('Mohon isi judul tugas terlebih dahulu untuk menghasilkan naskah suara AI.');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/voice-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          note,
          scheduledTime: `${dueDate} pukul ${dueTime} WIB`,
          tone: aiVoiceTone,
          priority: editingTask?.priority || 'medium',
        }),
      });
      const data = await res.json();
      if (data.script) {
        setAiVoiceScript(data.script);
      }
    } catch (err) {
      console.error('Error fetching voice script:', err);
      setAiVoiceScript(`Halo! Ini pengingat untuk ${title}. Harap periksa catatan Anda.`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleTestVoice = async () => {
    const textToSpeak = aiVoiceScript.trim() || `Pengingat tugas: ${title}. ${note}`;
    setIsPlayingPreview(true);
    await playNotificationChime();
    speakText(textToSpeak, aiVoiceTone, () => {
      setIsPlayingPreview(false);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const offsetMinutes = reminderOffset === 'custom' ? Number(customOffsetMinutes) : Number(reminderOffset);
    
    // Calculate exact reminder trigger timestamp
    const dueDateTime = new Date(`${dueDate}T${dueTime}`);
    const triggerTime = new Date(dueDateTime.getTime() - offsetMinutes * 60000);

    onSave({
      ...(editingTask ? { id: editingTask.id } : {}),
      title: title.trim(),
      note: note.trim(),
      category,
      dueDate,
      dueTime,
      reminderOffsetMinutes: offsetMinutes,
      reminderDateTime: triggerTime.toISOString(),
      recurrence,
      priority: editingTask?.priority || 'medium',
      whatsappNumber: editingTask?.whatsappNumber || '',
      whatsappAutoSend: editingTask?.whatsappAutoSend || false,
      whatsappCustomMessage: editingTask?.whatsappCustomMessage || '',
      aiVoiceTone,
      aiVoiceScript: aiVoiceScript.trim() || `Halo! Pengingat untuk ${title}. ${note}`,
      notified: false,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-6 shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {editingTask ? 'Edit Catatan Pengingat' : 'Tambah Pengingat Agenda Baru'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Atur waktu pengingat fleksibel dan notifikasi suara AI
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Judul & Kategori */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Judul Agenda / Catatan *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Kirim invoice penagihan klien..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Kategori Catatan
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="Usaha">Usaha / Bisnis</option>
                  <option value="Pekerjaan">Pekerjaan</option>
                  <option value="Pribadi">Pribadi</option>
                  <option value="Keuangan">Keuangan</option>
                  <option value="Ibadah">Ibadah</option>
                  <option value="Keluarga">Keluarga</option>
                  <option value="Kesehatan">Kesehatan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Pengulangan Agenda
                </label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="none">Sekali saja</option>
                  <option value="daily">Setiap Hari</option>
                  <option value="weekly">Setiap Minggu</option>
                  <option value="monthly">Setiap Bulan</option>
                  <option value="yearly">Setiap Tahun</option>
                </select>
              </div>
            </div>
          </div>

          {/* Preview Teks Catatan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Preview Isi Catatan &amp; Detail Tugas
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tuliskan rincian, instruksi checklist, catatan rapat, atau detail yang akan dibacakan AI..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all leading-relaxed"
            />
          </div>

          {/* Pengaturan Waktu Pengingat Fleksibel */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan Waktu Pengingat Fleksibel</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tanggal Pelaksanaan
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Jam Pelaksanaan (WIB)
                </label>
                <input
                  type="time"
                  required
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Waktu Bunyi Notifikasi Pengingat
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: '0', label: 'Tepat Waktu' },
                  { value: '5', label: '5 Mnt Sebelumnya' },
                  { value: '15', label: '15 Mnt Sebelumnya' },
                  { value: '30', label: '30 Mnt Sebelumnya' },
                  { value: '60', label: '1 Jam Sebelumnya' },
                  { value: '120', label: '2 Jam Sebelumnya' },
                  { value: '1440', label: '1 Hari Sebelumnya' },
                  { value: 'custom', label: 'Kustom Menit...' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setReminderOffset(item.value)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                      reminderOffset === item.value
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {reminderOffset === 'custom' && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-xs text-slate-600">Beri pengingat</span>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={customOffsetMinutes}
                    onChange={(e) => setCustomOffsetMinutes(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                  <span className="text-xs text-slate-600">menit sebelum agenda dimulai</span>
                </div>
              )}
            </div>
          </div>

          {/* Notifikasi Suara AI Pengingat */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Notifikasi Suara AI Pengingat</span>
              </div>
              <button
                type="button"
                onClick={handleGenerateAiVoice}
                disabled={isGeneratingAi}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-2xs disabled:opacity-60"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghasilkan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate AI Script</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Gaya Suara AI (Tone)
                </label>
                <select
                  value={aiVoiceTone}
                  onChange={(e) => setAiVoiceTone(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-200 text-xs sm:text-sm bg-white"
                >
                  <option value="friendly">Ramah &amp; Santai (Friendly)</option>
                  <option value="professional">Profesional &amp; Tegas (Professional)</option>
                  <option value="urgent">Mendesak &amp; Penting (Urgent)</option>
                  <option value="cheerful">Ceria &amp; Bersemangat (Cheerful)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleTestVoice}
                  disabled={isPlayingPreview}
                  className="w-full py-2 px-3 rounded-xl border border-emerald-300 bg-white text-emerald-800 text-xs font-semibold hover:bg-emerald-50 transition-colors flex items-center justify-center space-x-1.5 shadow-2xs"
                >
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                  <span>{isPlayingPreview ? 'Sedang Memutar...' : 'Uji Dengarkan Suara'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Naskah Ucapan Suara AI yang Akan Dibacakan:
              </label>
              <textarea
                rows={2}
                value={aiVoiceScript}
                onChange={(e) => setAiVoiceScript(e.target.value)}
                placeholder="Naskah kalimat pengingat yang akan diucapkan suara AI saat notifikasi berbunyi..."
                className="w-full px-3 py-2 rounded-xl border border-emerald-200 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200"
            >
              Simpan Pengingat
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
