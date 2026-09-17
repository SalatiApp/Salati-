import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { initPrayerAlarmChannel, initAzkarAlarmChannel } from './prayerAlarmScheduler';

export const isNativeAndroid = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

export const initNativeAndroid = async () => {
  if (!isNativeAndroid()) return;

  // 1. Prevent ServiceWorker caching issues inside native Android WebView
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      }).catch(() => {});
    }
  } catch (e) {
    console.warn('SW cleanup notice:', e);
  }

  // 2. Configure native status bar with Emerald theme
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#064e3b' });
  } catch (e) {
    console.warn('Status bar config error:', e);
  }

  // 3. Initialize notification channels for Adhan and Azkar without prompting permission
  try {
    await initPrayerAlarmChannel();
    await initAzkarAlarmChannel();
  } catch (e) {
    console.warn('Notification channels initialization error:', e);
  }

  // 4. Hide splash screen smoothly after app initialization
  try {
    setTimeout(async () => {
      try {
        await SplashScreen.hide({
          fadeOutDuration: 300,
        });
      } catch {
        // Fallback ignore
      }
    }, 250);
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
