import { Capacitor } from '@capacitor/core';
import {
  LocalNotifications,
  LocalNotificationSchema,
} from '@capacitor/local-notifications';
import { Coordinates, PrayerTimes } from 'adhan';
import { UserSettings } from '../types';
import { getCalculationParameters } from './prayerCalculations';

export const ADHAN_CHANNEL_ID = 'salati_adhan_channel';
export const AZKAR_CHANNEL_ID = 'salati_azkar_channel';

const PRAYER_NOTIFICATION_START_ID = 1000;
const PRAYER_NOTIFICATION_END_ID = 1999;

const MORNING_AZKAR_START_ID = 2000;
const EVENING_AZKAR_START_ID = 3000;

export async function initPrayerAlarmChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await LocalNotifications.createChannel({
      id: ADHAN_CHANNEL_ID,
      name: 'أذان الصلاة',
      description: 'تنبيهات مواقيت الصلاة مع صوت الأذان',
      importance: 5,
      visibility: 1,
      sound: 'adhan.mp3',
      vibration: true,
      lights: true,
      lightColor: '#059669',
    });
  } catch (err) {
    console.warn('Failed to initialize Adhan notification channel:', err);
  }
}

export async function initAzkarNotificationChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await LocalNotifications.createChannel({
      id: AZKAR_CHANNEL_ID,
      name: 'أذكار الصباح والمساء',
      description: 'تنبيهات يومية لأذكار الصباح والمساء',
      importance: 4,
      visibility: 1,
      vibration: true,
      lights: true,
      lightColor: '#059669',
    });
  } catch (err) {
    console.warn('Failed to initialize Azkar notification channel:', err);
  }
}

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

  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission === 'granted';
  }

  return false;
}

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

async function cancelPrayerNotifications(): Promise<void> {
  try {
    const pending = await LocalNotifications.getPending();

    const prayerNotifications = pending.notifications
      .filter(
        (notification) =>
          notification.id >= PRAYER_NOTIFICATION_START_ID &&
          notification.id <= PRAYER_NOTIFICATION_END_ID
      )
      .map((notification) => ({ id: notification.id }));

    if (prayerNotifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: prayerNotifications,
      });
    }
  } catch (err) {
    console.warn('Failed to cancel prayer notifications:', err);
  }
}

async function cancelAzkarNotifications(): Promise<void> {
  try {
    const pending = await LocalNotifications.getPending();

    const azkarNotifications = pending.notifications
      .filter(
        (notification) =>
          (notification.id >= MORNING_AZKAR_START_ID &&
            notification.id < EVENING_AZKAR_START_ID) ||
          notification.id >= EVENING_AZKAR_START_ID
      )
      .map((notification) => ({ id: notification.id }));

    if (azkarNotifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: azkarNotifications,
      });
    }
  } catch (err) {
    console.warn('Failed to cancel Azkar notifications:', err);
  }
}

export async function scheduleAutomaticAzkarNotifications(): Promise<number> {
  if (!Capacitor.isNativePlatform()) return 0;

  try {
    await initAzkarNotificationChannel();
    await cancelAzkarNotifications();

    const now = new Date();
    const notificationsToSchedule: LocalNotificationSchema[] = [];

    const DAYS_TO_SCHEDULE = 7;

    for (let dayOffset = 0; dayOffset < DAYS_TO_SCHEDULE; dayOffset++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + dayOffset);

      const morningTime = new Date(targetDate);
      morningTime.setHours(7, 0, 0, 0);

      if (morningTime.getTime() > now.getTime()) {
        notificationsToSchedule.push({
          id: MORNING_AZKAR_START_ID + dayOffset,
          title: 'أذكار الصباح',
          body: 'حان وقت أذكار الصباح 🌅',
          schedule: {
            at: morningTime,
            allowWhileIdle: true,
          },
          channelId: AZKAR_CHANNEL_ID,
          smallIcon: 'ic_launcher',
          autoCancel: true,
        });
      }

      const eveningTime = new Date(targetDate);
      eveningTime.setHours(18, 0, 0, 0);

      if (eveningTime.getTime() > now.getTime()) {
        notificationsToSchedule.push({
          id: EVENING_AZKAR_START_ID + dayOffset,
          title: 'أذكار المساء',
          body: 'حان وقت أذكار المساء 🌙',
          schedule: {
            at: eveningTime,
            allowWhileIdle: true,
          },
          channelId: AZKAR_CHANNEL_ID,
          smallIcon: 'ic_launcher',
          autoCancel: true,
        });
      }
    }

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({
        notifications: notificationsToSchedule,
      });
    }

    console.log(
      `Successfully scheduled ${notificationsToSchedule.length} Azkar notifications.`
    );

    return notificationsToSchedule.length;
  } catch (err) {
    console.warn('Failed to schedule Azkar notifications:', err);
    return 0;
  }
}

export async function scheduleAutomaticAdhanAlarms(
  latitude: number,
  longitude: number,
  settings: UserSettings
): Promise<number> {
  if (!Capacitor.isNativePlatform()) return 0;

  try {
    await initPrayerAlarmChannel();

    await cancelPrayerNotifications();

    await scheduleAutomaticAzkarNotifications();

    if (settings.adhanType === 'silent') {
      return 0;
    }

    const coordinates = new Coordinates(latitude, longitude);
    const params = getCalculationParameters(
      settings.calculationMethod,
      settings.madhab
    );

    const now = new Date();
    const notificationsToSchedule: LocalNotificationSchema[] = [];

    const DAYS_TO_SCHEDULE = 7;

    for (let dayOffset = 0; dayOffset < DAYS_TO_SCHEDULE; dayOffset++) {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() + dayOffset);

      const prayerTimes = new PrayerTimes(
        coordinates,
        targetDate,
        params
      );

      for (const prayer of PRAYERS) {
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

        if (prayerTime.getTime() > now.getTime()) {
          const notificationId =
            PRAYER_NOTIFICATION_START_ID +
            dayOffset * 10 +
            prayer.index;

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
              allowWhileIdle: true,
            },
            channelId: ADHAN_CHANNEL_ID,
            sound: 'adhan.mp3',
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

      console.log(
        `Successfully scheduled ${notificationsToSchedule.length} automatic Adhan alarms.`
      );
    }

    return notificationsToSchedule.length;
  } catch (err) {
    console.warn('Failed to schedule automatic Adhan alarms:', err);
    return 0;
  }
}
