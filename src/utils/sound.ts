import { triggerNativeHaptic } from './nativeAndroid';

// Offline Web Audio API Synthesizer + Free Public Adhan Audio Player

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Play peaceful prayer chime using Web Audio (100% offline, zero network cost)
  playChime(frequency = 440, duration = 1.2) {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      // Gentle pitch bend down
      osc.frequency.exponentialRampToValueAtTime(frequency * 0.98, ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Play Tasbeeh click feedback (very subtle, pleasant wooden click sound)
  playTasbeehClick() {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);

      // Trigger light haptic if supported
      triggerNativeHaptic();
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
    } catch {
      // Fallback silent
    }
  }

  // Play synthetic Islamic Takbeerat chime sequence offline
  playSyntheticTakbeer() {
    const notes = [
      { freq: 440, delay: 0, dur: 0.5 },    // Al-
      { freq: 554.37, delay: 0.45, dur: 0.8 }, // laa-
      { freq: 493.88, delay: 1.1, dur: 0.6 },  // hu
      { freq: 440, delay: 1.6, dur: 0.9 },     // Ak-bar
    ];

    notes.forEach(n => {
      setTimeout(() => {
        this.playChime(n.freq, n.dur);
      }, n.delay * 1000);
    });
  }

  // Play authentic Makkah Adhan audio with graceful fallback to synthesized takbeer
  async playAdhan(type: 'full' | 'takbeer' | 'beep' | 'silent' = 'full'): Promise<void> {
    if (type === 'silent') return;

    if (type === 'beep') {
      this.playChime(587.33, 1.5);
      return;
    }

    if (type === 'takbeer') {
      this.playSyntheticTakbeer();
      return;
    }

    // Full Adhan: Try public domain authentic Makkah Adhan audio from high-availability Wikimedia/Archive CDN
    this.stopAudio();

    try {
      const adhanUrl = 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Adhan_Makkah.ogg';
      this.currentAudio = new Audio(adhanUrl);
      this.currentAudio.volume = 0.9;
      
      const playPromise = this.currentAudio.play();
      if (playPromise !== undefined) {
        await playPromise.catch(() => {
          // If network error or blocked by autoplay policy, fallback to lovely synthetic takbeer
          this.playSyntheticTakbeer();
        });
      }
    } catch {
      this.playSyntheticTakbeer();
    }
  }

  stopAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  isPlaying(): boolean {
    return !!(this.currentAudio && !this.currentAudio.paused);
  }
}

export const soundManager = new SoundManager();

// Browser notification helper for prayer alerts
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }
  return false;
}

export function sendPrayerNotification(prayerName: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`حان الآن موعد أذان ${prayerName}`, {
      body: `حي على الصلاة، حي على الفلاح. تقبل الله طاعتكم.`,
      icon: '/favicon.ico',
      tag: `prayer-${prayerName}`,
    });
  }
}
