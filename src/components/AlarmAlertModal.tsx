import React, { useEffect, useState } from 'react';
import { 
  BellRing, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  X,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { ReminderTask } from '../types';
import { speakText, playNotificationChime } from '../utils/audio';
import { sendWhatsAppMessage } from '../utils/whatsapp';

interface AlarmAlertModalProps {
  task: ReminderTask | null;
  onClose: () => void;
  onMarkDone: (taskId: string) => void;
  onSnooze: (taskId: string, minutes: number) => void;
}

export const AlarmAlertModal: React.FC<AlarmAlertModalProps> = ({
  task,
  onClose,
  onMarkDone,
  onSnooze,
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechCancel, setSpeechCancel] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!task) return;

    let isMounted = true;

    const triggerAlert = async () => {
      // 1. Play synthesized bell chime
      await playNotificationChime();
      
      if (!isMounted) return;

      // 2. Speak AI reminder script
      const scriptToSpeak = task.aiVoiceScript || `Perhatian! Ini adalah pengingat untuk tugas: ${task.title}. Rincian: ${task.note || 'Harap segera dikerjakan.'}`;
      setIsSpeaking(true);

      const controller = speakText(scriptToSpeak, task.aiVoiceTone, () => {
        if (isMounted) setIsSpeaking(false);
      });

      setSpeechCancel(() => controller.cancel);

      // 3. If WhatsApp Auto Send is enabled, prompt or send
      if (task.whatsappAutoSend && task.whatsappNumber) {
        // Can open WhatsApp or give visual spotlight
      }
    };

    triggerAlert();

    return () => {
      isMounted = false;
      if (speechCancel) speechCancel();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [task]);

  if (!task) return null;

  const handleStopSpeech = () => {
    if (speechCancel) speechCancel();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const handleReplaySpeech = async () => {
    handleStopSpeech();
    await playNotificationChime();
    const scriptToSpeak = task.aiVoiceScript || `Pengingat tugas: ${task.title}. ${task.note}`;
    setIsSpeaking(true);
    const controller = speakText(scriptToSpeak, task.aiVoiceTone, () => {
      setIsSpeaking(false);
    });
    setSpeechCancel(() => controller.cancel);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Animated Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500" />

        {/* Header with Icon and Close Button */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner animate-bounce">
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 mb-1">
                Waktu Pengingat Tiba!
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                {task.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Voice Indicator Box */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Suara AI Pengingat (Bahasa Indonesia)</span>
            </div>

            <div className="flex items-center space-x-1">
              {isSpeaking ? (
                <button
                  onClick={handleStopSpeech}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-xs hover:bg-emerald-700"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Hening</span>
                </button>
              ) : (
                <button
                  onClick={handleReplaySpeech}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-50"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Putar Ulang</span>
                </button>
              )}
            </div>
          </div>

          {/* Voice Wave Animation when speaking */}
          {isSpeaking && (
            <div className="flex items-center justify-center space-x-1 py-1 mb-2">
              <span className="w-1.5 h-3 bg-emerald-500 rounded-full animate-pulse" />
              <span className="w-1.5 h-5 bg-teal-500 rounded-full animate-pulse delay-75" />
              <span className="w-1.5 h-7 bg-emerald-600 rounded-full animate-pulse delay-150" />
              <span className="w-1.5 h-4 bg-teal-600 rounded-full animate-pulse delay-100" />
              <span className="w-1.5 h-2 bg-emerald-400 rounded-full animate-pulse" />
            </div>
          )}

          <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
            "{task.aiVoiceScript || `Pengingat tugas: ${task.title}. ${task.note || ''}`}"
          </p>
        </div>

        {/* Note Preview Section */}
        <div className="mt-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-slate-700">Preview Teks Catatan</span>
            <span>Jadwal: {task.dueDate} • {task.dueTime} WIB</span>
          </div>
          <p className="text-sm text-slate-800 font-normal leading-relaxed whitespace-pre-wrap">
            {task.note || 'Tidak ada teks catatan tambahan.'}
          </p>

          <div className="flex items-center space-x-2 mt-3 text-xs text-slate-500">
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-medium text-slate-700">
              Kategori: {task.category}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-medium text-slate-700">
              Prioritas: {task.priority === 'high' ? 'Tinggi' : task.priority === 'medium' ? 'Sedang' : 'Normal'}
            </span>
          </div>
        </div>

        {/* WhatsApp Dispatch Section if configured */}
        <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-900">
                Pesan WhatsApp Pengingat
              </h5>
              <p className="text-2xs text-slate-600">
                {task.whatsappNumber ? `Tujuan: ${task.whatsappNumber}` : 'Kirim ringkasan agenda ke WhatsApp'}
              </p>
            </div>
          </div>

          <button
            onClick={() => sendWhatsAppMessage(task)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
          >
            Buka WhatsApp
          </button>
        </div>

        {/* Action Buttons: Snooze, Mark Done, Dismiss */}
        <div className="mt-6 grid grid-cols-3 gap-2.5">
          <button
            onClick={() => onSnooze(task.id, 10)}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Tunda 10 Mnt</span>
          </button>

          <button
            onClick={() => onMarkDone(task.id)}
            className="col-span-2 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Selesai Dikerjakan</span>
          </button>
        </div>

      </div>
    </div>
  );
};
