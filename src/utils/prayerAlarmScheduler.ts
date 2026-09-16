import { Capacitor } from '@capacitor/core';
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { Coordinates, PrayerTimes } from 'adhan';
import { UserSettings } from '../types';
import { getCalculationParameters } from './prayerCalculations';

export const ADHAN_CHANNEL_ID = 'salati_adhan_channel';

/**
 * Initializes the Android notification channel configured with local adhan.mp3
 */
export async function initPrayerAlarmChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Register the channel with sound pointing to the bundled adhan.mp3 in res/raw/
    await LocalNotifications.createChannel({
      id: ADHAN_CHANNEL_ID,
      name: 'أذان الصلاة',
      description: 'تنبيهات مواقيت الصلاة مع صوت الأذان',
      importance: 5, // High importance (heads-up notification & sound)
      visibility: 1, // Public visibility on lockscreen
      sound: 'adhan.mp3', // Matches res/raw/adhan.mp3 on Android
      vibration: true,
      lights: true,
      lightColor: '#059669',
    });
  } catch (err) {
    console.warn('Failed to initialize Adhan notification channel:', err);
  }
}

/**
 * Check notification permissions using @capacitor/local-notifications on Android
 */
export async function checkPrayerAlarmPermissions(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.checkPermissions();
      return status.display === 'granted';
    } catch (err) {
      console.warn('Error checking notification permissions:', err);
      return false;
    }
  }

  // Browser fallback
  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission === 'granted';
  }
  return false;
}

/**
 * Request notification and exact alarm permissions on Android
 */
export async function requestPrayerAlarmPermissions(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    } catch (err) {
      console.warn('Error requesting notification permissions:', err);
      return false;
    }
  }

  // Browser fallback
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    }
  }
  return false;
}

interface PrayerDef {
  key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  nameAr: string;
  index: number;
}

const PRAYERS: PrayerDef[] = [
  { key: 'fajr', nameAr: 'الفجر', index: 1 },
  { key: 'dhuhr', nameAr: 'الظهر', index: 2 },
  { key: 'asr', nameAr: 'العصر', index: 3 },
  { key: 'maghrib', nameAr: 'المغرب', index: 4 },
  { key: 'isha', nameAr: 'العشاء', index: 5 },
];

/**
 * Schedules exact alarms for all enabled prayers over the next 7 days.
 * When the alarm triggers, Android wakes up even if closed/locked and plays adhan.mp3.
 */
export async function scheduleAutomaticAdhanAlarms(
  latitude: number,
  longitude: number,
  settings: UserSettings
): Promise<number> {
  if (!Capacitor.isNativePlatform()) return 0;

  try {
    await initPrayerAlarmChannel();

    // Cancel all previously scheduled prayer notifications to avoid duplicate alarms
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((n) => ({ id: n.id })),
      });
    }

    // If adhan is set to silent, do not schedule audio alarms
    if (settings.adhanType === 'silent') {
      return 0;
    }

    const coordinates = new Coordinates(latitude, longitude);
    const params = getCalculationParameters(settings.calculationMethod, settings.madhab);
    const now = new Date();
    const notificationsToSchedule: LocalNotificationSchema[] = [];

    // Schedule for the next 7 days
    const DAYS_TO_SCHEDULE = 7;

    for (let dayOffset = 0; dayOffset < DAYS_TO_SCHEDULE; dayOffset++) {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() + dayOffset);
      const prayerTimes = new PrayerTimes(coordinates, targetDate, params);

      for (const prayer of PRAYERS) {
        // Check if alert is enabled for this specific prayer
        if (!settings.prayerAlerts[prayer.key]) continue;

        let prayerTime: Date | null = null;
        switch (prayer.key) {
          case 'fajr':
            prayerTime = prayerTimes.fajr;
            break;
          case 'dhuhr':
            prayerTime = prayerTimes.dhuhr;
            break;
          case 'asr':
            prayerTime = prayerTimes.asr;
            break;
          case 'maghrib':
            prayerTime = prayerTimes.maghrib;
            break;
          case 'isha':
            prayerTime = prayerTimes.isha;
            break;
        }

        if (!prayerTime || isNaN(prayerTime.getTime())) continue;

        // Only schedule if in the future
        if (prayerTime.getTime() > now.getTime()) {
          // Deterministic unique integer ID: dayOffset (0-9) * 10 + prayer index + 1000
          const notificationId = 1000 + dayOffset * 10 + prayer.index;

          const timeFormatted = prayerTime.toLocaleTimeString('ar-MA', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: !settings.timeFormat24,
          });

          notificationsToSchedule.push({
            id: notificationId,
            title: `حان الآن موعد أذان ${prayer.nameAr}`,
            body: `الله أكبر - حان وقت صلاة ${prayer.nameAr} (${timeFormatted})`,
            schedule: {
              at: prayerTime,
              allowWhileIdle: true, // Wakes device from deep sleep / Doze mode using exact alarm
            },
            channelId: ADHAN_CHANNEL_ID,
            sound: 'adhan.mp3', // Bundled in res/raw/adhan.mp3
            smallIcon: 'ic_launcher',
            autoCancel: true,
          });
        }
      }
    }

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({
        notifications: notificationsToSchedule,
      });
      console.log(`Successfully scheduled ${notificationsToSchedule.length} automatic Adhan alarms.`);
    }

    return notificationsToSchedule.length;
  } catch (err) {
    console.warn('Failed to schedule automatic Adhan alarms:', err);
    return 0;
  }
}
