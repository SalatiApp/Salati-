export interface QuranAudioState {
  isPlaying: boolean;
  isLoading: boolean;
  surahNumber: number | null;
}

type AudioListener = (state: QuranAudioState) => void;

class QuranAudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentSurahNumber: number | null = null;
  private isPlaying: boolean = false;
  private isLoading: boolean = false;
  private requestId: number = 0;
  private listeners: Set<AudioListener> = new Set();

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('Quran audio listener error:', err);
      }
    });
  }

  public getState(): QuranAudioState {
    return {
      isPlaying: this.isPlaying,
      isLoading: this.isLoading,
      surahNumber: this.currentSurahNumber,
    };
  }

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public stop(): void {
    this.requestId++;
    const hadActiveState = this.isPlaying || this.isLoading || this.currentAudio !== null;

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
        this.currentAudio.onplay = null;
        this.currentAudio.onpause = null;
        this.currentAudio.src = '';
        this.currentAudio.load();
      } catch (e) {
        console.warn('Error stopping Quran audio:', e);
      }
      this.currentAudio = null;
    }

    this.isPlaying = false;
    this.isLoading = false;
    this.currentSurahNumber = null;

    if (hadActiveState) {
      this.notify();
    }
  }

  public play(surahNumber: number): void {
    // 1. Immediately stop and release any existing audio instance to ensure strictly one audio instance
    this.stop();

    const thisRequestId = ++this.requestId;
    this.currentSurahNumber = surahNumber;
    this.isLoading = true;
    this.isPlaying = false;
    this.notify();

    // High quality recitation by Sheikh Mishary Rashid Alafasy
    const padded = String(surahNumber).padStart(3, '0');
    const audioUrl = `https://server8.mp3quran.net/afs/${padded}.mp3`;

    const audio = new Audio();
    audio.preload = 'auto';
    this.currentAudio = audio;

    audio.onended = () => {
      if (this.requestId === thisRequestId) {
        this.stop();
      }
    };

    audio.onerror = (e) => {
      if (this.requestId === thisRequestId) {
        console.warn('Quran audio error:', e);
        this.stop();
      }
    };

    audio.src = audioUrl;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // If stopped or navigated away while play() was initializing
          if (this.requestId !== thisRequestId) {
            try {
              audio.pause();
              audio.currentTime = 0;
              audio.src = '';
              audio.load();
            } catch {}
            return;
          }
          this.isLoading = false;
          this.isPlaying = true;
          this.notify();
        })
        .catch((err) => {
          if (this.requestId === thisRequestId) {
            console.warn('Quran audio play prevented or failed:', err);
            this.stop();
          }
        });
    } else {
      this.isLoading = false;
      this.isPlaying = true;
      this.notify();
    }
  }
}

export const quranAudioManager = new QuranAudioManager();
