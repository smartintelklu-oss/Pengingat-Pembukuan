import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  RotateCw, 
  Check, 
  Copy, 
  Loader2 
} from 'lucide-react';
import { ReminderTask } from '../types';
import { speakText, playNotificationChime } from '../utils/audio';

interface VoicePreviewModalProps {
  task: ReminderTask | null;
  onClose: () => void;
  onUpdateScript: (taskId: string, newScript: string, newTone: any) => void;
}

export const VoicePreviewModal: React.FC<VoicePreviewModalProps> = ({
  task,
  onClose,
  onUpdateScript,
}) => {
  if (!task) return null;

  const [script, setScript] = useState(task.aiVoiceScript || '');
  const [tone, setTone] = useState(task.aiVoiceTone || 'friendly');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  const handlePlayVoice = async () => {
    setIsPlaying(true);
    await playNotificationChime();
    speakText(script, tone, () => {
      setIsPlaying(false);
    });
  };

  const handleStopVoice = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/voice-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          note: task.note,
          scheduledTime: `${task.dueDate} pukul ${task.dueTime} WIB`,
          tone,
          priority: task.priority,
        }),
      });
      const data = await res.json();
      if (data.script) {
        setScript(data.script);
        onUpdateScript(task.id, data.script, tone);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onUpdateScript(task.id, script, tone);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Suara Pengingat AI
              </h4>
              <p className="text-xs text-slate-500">
                {task.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tone Selector */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Karakter Suara AI
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'friendly', label: 'Ramah' },
              { id: 'professional', label: 'Profesional' },
              { id: 'urgent', label: 'Mendesak' },
              { id: 'cheerful', label: 'Ceria' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTone(t.id as any)}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                  tone === t.id
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Script Content Area */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-600">
              Naskah Suara Pengingat (Bahasa Indonesia):
            </label>
            <button
              onClick={handleCopy}
              className="text-2xs text-slate-500 hover:text-slate-800 flex items-center space-x-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>
          <textarea
            rows={3}
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200 text-sm leading-relaxed bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Playback Controls & Waveform */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isPlaying ? (
              <button
                onClick={handleStopVoice}
                className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 transition-colors shadow-xs"
                title="Hentikan Suara"
              >
                <VolumeX className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handlePlayVoice}
                className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors shadow-xs"
                title="Putar Suara AI"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            )}

            <div>
              <p className="text-xs font-bold text-slate-800">
                {isPlaying ? 'Memutar Pengingat Suara...' : 'Dengarkan Pengucapan AI'}
              </p>
              <p className="text-2xs text-slate-500">
                Dilengkapi nada lonceng pembuka &amp; intonasi alami
              </p>
            </div>
          </div>

          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="flex items-center space-x-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 transition-colors disabled:opacity-60"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCw className="w-3.5 h-3.5" />
            )}
            <span>Generate Ulang</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Tutup
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
          >
            Terapkan Perubahan
          </button>
        </div>

      </div>
    </div>
  );
};
