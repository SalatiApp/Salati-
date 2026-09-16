import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { initPrayerAlarmChannel, requestPrayerAlarmPermissions } from './prayerAlarmScheduler';

export const isNativeAndroid = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

export const initNativeAndroid = async () => {
  if (!isNativeAndroid()) return;

  try {
    // Configure native status bar with Emerald theme
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#064e3b' });
  } catch (e) {
    console.warn('Status bar config error:', e);
  }

  try {
    // Initialize notification channel for Adhan and request notification & alarm permissions
    await initPrayerAlarmChannel();
    await requestPrayerAlarmPermissions();
  } catch (e) {
    console.warn('Adhan notification initialization error:', e);
  }

  try {
    // Hide splash screen smoothly after app initialization
    setTimeout(async () => {
      await SplashScreen.hide({
        fadeOutDuration: 400,
      });
    }, 600);
  } catch (e) {
    console.warn('Splash screen hide error:', e);
  }
};

export const triggerNativeHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Haptics.impact({ style });
  } catch {
    // ignore if haptics not available
  }
};
