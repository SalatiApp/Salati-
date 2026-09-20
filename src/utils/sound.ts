import { Capacitor } from '@capacitor/core';
import { triggerNativeHaptic } from './nativeAndroid';
import { checkPrayerAlarmPermissions, requestPrayerAlarmPermissions } from './prayerAlarmScheduler';

// Offline Web Audio API Synthesizer + Free Public Adhan Audio Player

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private activeSessionId: number = 0;

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

  // Play Adhan audio using local MP3 file (100% offline, zero external dependencies)
  // Uses the unified adhan.mp3 file for all 5 prayers, including Fajr
  async playAdhan(
    type: 'full' | 'takbeer' | 'beep' | 'silent' = 'full',
    _prayerId?: string
  ): Promise<void> {
    if (type === 'silent') return;

    if (type === 'beep') {
      this.playChime(587.33, 1.5);
      return;
    }

    if (type === 'takbeer') {
      this.playSyntheticTakbeer();
      return;
    }

    // Immediately stop any existing audio playback completely to prevent overlap
    this.stopAudio();

    // Start a new exclusive playback session
    const sessionId = ++this.activeSessionId;
    const adhanFile = 'adhan.mp3';

    return new Promise((resolve) => {
      // Build candidate local paths to ensure compatibility with Capacitor Android and Web
      const candidates: string[] = [
        `/audio/${adhanFile}`,
        `audio/${adhanFile}`,
        `./audio/${adhanFile}`,
        `/${adhanFile}`,
        adhanFile,
        `./${adhanFile}`,
      ];

      try {
        const base = document.baseURI || window.location.href;
        candidates.unshift(new URL(`audio/${adhanFile}`, base).href);
        candidates.unshift(new URL(adhanFile, base).href);
      } catch {}

      try {
        const baseUrl = import.meta.env.BASE_URL || '/';
        const cleanBase = baseUrl.replace(/\/+$/, '');
        candidates.unshift(`${cleanBase}/audio/${adhanFile}`);
        candidates.unshift(`${cleanBase}/${adhanFile}`);
      } catch {}

      // Unique candidates
      const uniqueCandidates = Array.from(new Set(candidates));
      let index = 0;
      let isDone = false;

      const finish = () => {
        if (!isDone) {
          isDone = true;
          if (this.activeSessionId === sessionId) {
            this.currentAudio = null;
          }
          resolve();
        }
      };

      const tryCandidate = () => {
        // If stopped or a new session has started, abort immediately
        if (isDone || this.activeSessionId !== sessionId) {
          return;
        }

        if (index >= uniqueCandidates.length) {
          console.warn('Could not load local Adhan audio from any local path');
          finish();
          return;
        }

        const candidateUrl = uniqueCandidates[index++];
        const audio = new Audio(candidateUrl);
        audio.volume = 1.0;
        audio.preload = 'auto';

        if (this.activeSessionId !== sessionId) {
          audio.src = '';
          return;
        }

        this.currentAudio = audio;

        // In Android WebView, pulling down the Notification Shade / Quick Settings can emit a pause event
        // to HTMLMediaElement even though playback was intentionally started and should keep running.
        // If a pause occurs without user explicitly calling stopAudio(), automatically resume it.
        audio.onpause = () => {
          if (this.activeSessionId === sessionId && !audio.ended && audio.currentTime > 0) {
            setTimeout(() => {
              if (this.activeSessionId === sessionId && audio.paused && !audio.ended) {
                audio.play().catch(() => {});
              }
            }, 50);
          }
        };

        audio.onended = () => {
          if (this.activeSessionId === sessionId) {
            finish();
          }
        };

        audio.onerror = () => {
          if (this.activeSessionId === sessionId && !isDone) {
            tryCandidate();
          }
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            if (this.activeSessionId === sessionId && !isDone) {
              tryCandidate();
            }
          });
        }
      };

      tryCandidate();
    });
  }

  stopAudio() {
    // Invalidate active session so in-flight candidate retries abort immediately
    this.activeSessionId++;

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
        this.currentAudio.src = '';
        this.currentAudio.load();
      } catch (e) {
        console.warn('Error stopping audio:', e);
      }
      this.currentAudio = null;
    }
  }

  isPlaying(): boolean {
    return !!(this.currentAudio && !this.currentAudio.paused && !this.currentAudio.ended);
  }
}

export const soundManager = new SoundManager();

// Notification permission helpers (supporting native Android Capacitor & browser fallback)
export const checkNotificationPermission = checkPrayerAlarmPermissions;
export const requestNotificationPermission = requestPrayerAlarmPermissions;

export function sendPrayerNotification(prayerName: string, timeFormatted?: string) {
  // On native Android, exact alarms with local adhan audio files are handled via @capacitor/local-notifications
  if (Capacitor.isNativePlatform()) {
    return;
  }
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(`حان الآن موعد أذان ${prayerName}`, {
      body: timeFormatted
        ? `الله أكبر - حان وقت صلاة ${prayerName} (${timeFormatted}). تقبل الله طاعتكم.`
        : `الله أكبر - حان وقت صلاة ${prayerName}. تقبل الله طاعتكم.`,
      icon: '/favicon.ico',
      tag: `prayer-${prayerName}`,
    });
  }
}

export function sendPrePrayerNotification(prayerName: string) {
  if (Capacitor.isNativePlatform()) {
    return;
  }
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(`اقتراب موعد الصلاة`, {
      body: `الصلاة القادمة: ${prayerName} — بعد 5 دقائق`,
      icon: '/favicon.ico',
      tag: `pre-prayer-${prayerName}`,
    });
  }
}
