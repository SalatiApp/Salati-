import { registerPlugin, Capacitor } from '@capacitor/core';

export interface AdhanNativePlugin {
  playAdhan(options: { prayerName?: string; adhanType?: string; isTest?: boolean }): Promise<{ success: boolean }>;
  stopAdhan(): Promise<{ success: boolean }>;
  isAdhanPlaying(): Promise<{ isPlaying: boolean; prayerName?: string }>;
  schedulePrayerAlarms(options: {
    prayers: Array<{ id: number; nameAr: string; time: number; adhanType?: string }>;
  }): Promise<{ success: boolean; count: number }>;
  cancelAllAlarms(): Promise<{ success: boolean }>;
}

export const AdhanNative = registerPlugin<AdhanNativePlugin>('AdhanNative');

export async function isNativeAdhanPlaying(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }
  try {
    const res = await AdhanNative.isAdhanPlaying();
    return !!res?.isPlaying;
  } catch {
    return false;
  }
}
