// Audio synthesis and Text-to-Speech utilities for Indonesian AI voice reminders

// Web Audio API Chime Synthesizer
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a modern, pleasant arpeggio chime to alert the user before AI voice speaks
 */
export function playNotificationChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Chime notes: E5 (659.25), G#5 (830.61), B5 (987.77), E6 (1318.51)
      const frequencies = [659.25, 830.61, 987.77, 1318.51];

      frequencies.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);

        gain.gain.setValueAtTime(0, now + index * 0.08);
        gain.gain.linearRampToValueAtTime(0.18, now + index * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.5);
      });

      setTimeout(resolve, 600);
    } catch (e) {
      console.warn('Could not play audio chime:', e);
      resolve();
    }
  });
}

/**
 * Gets best available Indonesian voice or fallback voice from Web Speech API
 */
export function getIndonesianVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  
  // Prefer Indonesian voices (id-ID or id_ID)
  const idVoice = voices.find(v => v.lang.toLowerCase().includes('id') || v.name.toLowerCase().includes('indonesia'));
  if (idVoice) return idVoice;

  // Malay fallback (ms-MY) or standard default
  const msVoice = voices.find(v => v.lang.toLowerCase().includes('ms'));
  if (msVoice) return msVoice;

  return voices.find(v => v.default) || voices[0] || null;
}

/**
 * Speaks text using SpeechSynthesis with custom tone adjustments
 */
export function speakText(
  text: string, 
  tone: 'friendly' | 'professional' | 'urgent' | 'cheerful' = 'friendly',
  onEnd?: () => void
): { cancel: () => void } {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return { cancel: () => {} };
  }

  // Cancel ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = getIndonesianVoice();
  if (voice) {
    utterance.voice = voice;
  }
  utterance.lang = 'id-ID';

  // Customize pitch and rate based on tone
  switch (tone) {
    case 'urgent':
      utterance.rate = 1.15;
      utterance.pitch = 1.1;
      break;
    case 'cheerful':
      utterance.rate = 1.05;
      utterance.pitch = 1.25;
      break;
    case 'professional':
      utterance.rate = 0.95;
      utterance.pitch = 0.95;
      break;
    case 'friendly':
    default:
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      break;
  }

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (e) => {
    console.warn('SpeechSynthesis error:', e);
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);

  return {
    cancel: () => {
      window.speechSynthesis.cancel();
    }
  };
}

/**
 * Checks and requests push notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    return await Notification.requestPermission();
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Shows browser native push notification
 */
export function showPushNotification(title: string, body: string, tag?: string) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: tag || 'reminder-' + Date.now(),
      });
    } catch (e) {
      console.warn('Native notification failed:', e);
    }
  }
}
