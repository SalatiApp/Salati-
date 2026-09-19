import { Capacitor } from '@capacitor/core';
import {
  LocalNotifications,
  LocalNotificationSchema,
} from '@capacitor/local-notifications';
import { Coordinates, PrayerTimes } from 'adhan';
import { UserSettings } from '../types';
import { getCalculationParameters } from './prayerCalculations';
import { MORNING_AZKAR, EVENING_AZKAR } from '../data/azkar';

export const NOTIFICATION_SMALL_ICON = 'ic_stat_salati';
export const NOTIFICATION_ICON_COLOR = '#10b981';

export const ADHAN_CHANNEL_ID = 'salati_adhan_channel';
export const ADHAN_FAJR_CHANNEL_ID = 'salati_adhan_fajr_channel';
export const PRE_PRAYER_CHANNEL_ID = 'salati_pre_prayer_channel';
export const AZKAR_CHANNEL_ID = 'salati_azkar_channel';

const PRAYER_NOTIFICATION_START_ID = 1000;
const PRAYER_NOTIFICATION_END_ID = 1999;

const PRE_PRAYER_NOTIFICATION_START_ID = 4000;
const PRE_PRAYER_NOTIFICATION_END_ID = 4999;

const MORNING_AZKAR_START_ID = 2000;
const MORNING_AZKAR_END_ID = 2999;

const EVENING_AZKAR_START_ID = 3000;
const EVENING_AZKAR_END_ID = 3999;

export async function initPrayerAlarmChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Normal prayer adhan channel (Dhuhr, Asr, Maghrib, Isha)
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

    // Fajr adhan channel (uses the same adhan.mp3)
    await LocalNotifications.createChannel({
      id: ADHAN_FAJR_CHANNEL_ID,
      name: 'أذان الفجر',
      description: 'تنبيهات صلاة الفجر مع صوت الأذان',
      importance: 5,
      visibility: 1,
      sound: 'adhan.mp3',
      vibration: true,
      lights: true,
      lightColor: '#059669',
    });

    // Pre-prayer 5-minute reminder channel
    await LocalNotifications.createChannel({
      id: PRE_PRAYER_CHANNEL_ID,
      name: 'تنبيه قبل الصلاة (5 دقائق)',
      description: 'تنبيهات مسبقة قبل دخول وقت الصلاة بـ 5 دقائق',
      importance: 4,
      visibility: 1,
      vibration: true,
      lights: true,
      lightColor: '#10B981',
    });
  } catch (err) {
    console.warn(
      'Failed to initialize Adhan notification channel:',
      err
    );
  }
}

export async function initAzkarNotificationChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await LocalNotifications.createChannel({
      id: AZKAR_CHANNEL_ID,
      name: 'أذكار الصباح والمساء',
      description: 'تنبيهات يومية لأذكار الصباح والمساء',
      importance: 5,
      visibility: 1,
      vibration: true,
      lights: true,
      lightColor: '#059669',
    });
  } catch (err) {
    console.warn(
      'Failed to initialize Azkar notification channel:',
      err
    );
  }
}

export const initAzkarAlarmChannel = initAzkarNotificationChannel;

export async function checkPrayerAlarmPermissions(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status =
        await LocalNotifications.checkPermissions();

      if (status.display !== 'granted') {
        return false;
      }

      try {
        const exactSetting =
          await LocalNotifications.checkExactNotificationSetting();
        if (exactSetting && exactSetting.exact_alarm === 'denied') {
          return false;
        }
      } catch {
        // Platform or OS does not support checkExactNotificationSetting
      }

      return true;
    } catch (err) {
      console.warn(
        'Error checking notification permissions:',
        err
      );

      return false;
    }
  }

  if (
    typeof window !== 'undefined' &&
    'Notification' in window
  ) {
    return Notification.permission === 'granted';
  }

  return false;
}

export async function requestPrayerAlarmPermissions(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      let status =
        await LocalNotifications.checkPermissions();

      if (status.display !== 'granted') {
        status =
          await LocalNotifications.requestPermissions();
      }

      try {
        const exactSetting =
          await LocalNotifications.checkExactNotificationSetting();
        if (
          exactSetting &&
          (exactSetting.exact_alarm === 'denied' ||
            exactSetting.exact_alarm === 'prompt')
        ) {
          await LocalNotifications.changeExactNotificationSetting();
        }
      } catch (exactErr) {
        console.warn('Exact alarm check/request failed:', exactErr);
      }

      return status.display === 'granted';
    } catch (err) {
      console.warn(
        'Error requesting notification permissions:',
        err
      );

      return false;
    }
  }

  if (
    typeof window !== 'undefined' &&
    'Notification' in window
  ) {
    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const perm =
        await Notification.requestPermission();

      return perm === 'granted';
    }
  }

  return false;
}

interface PrayerDef {
  key:
    | 'fajr'
    | 'dhuhr'
    | 'asr'
    | 'maghrib'
    | 'isha';

  nameAr: string;
  index: number;
}

const PRAYERS: PrayerDef[] = [
  {
    key: 'fajr',
    nameAr: 'الفجر',
    index: 1,
  },
  {
    key: 'dhuhr',
    nameAr: 'الظهر',
    index: 2,
  },
  {
    key: 'asr',
    nameAr: 'العصر',
    index: 3,
  },
  {
    key: 'maghrib',
    nameAr: 'المغرب',
    index: 4,
  },
  {
    key: 'isha',
    nameAr: 'العشاء',
    index: 5,
  },
];

async function cancelPrayerNotifications(): Promise<void> {
  try {
    const pending =
      await LocalNotifications.getPending();

    const prayerNotifications =
      pending.notifications
        .filter(
          notification =>
            (notification.id >=
              PRAYER_NOTIFICATION_START_ID &&
            notification.id <=
              PRAYER_NOTIFICATION_END_ID) ||
            (notification.id >=
              PRE_PRAYER_NOTIFICATION_START_ID &&
            notification.id <=
              PRE_PRAYER_NOTIFICATION_END_ID)
        )
        .map(notification => ({
          id: notification.id,
        }));

    if (prayerNotifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: prayerNotifications,
      });
    }
  } catch (err) {
    console.warn(
      'Failed to cancel prayer notifications:',
      err
    );
  }
}

async function cancelAzkarNotifications(): Promise<void> {
  try {
    const idsToCancel: { id: number }[] = [];

    const pending =
      await LocalNotifications.getPending();

    if (pending && Array.isArray(pending.notifications)) {
      const azkarNotifications =
        pending.notifications
          .filter(
            notification =>
              (
                notification.id >=
                  MORNING_AZKAR_START_ID &&
                notification.id <=
                  MORNING_AZKAR_END_ID
              ) ||
              (
                notification.id >=
                  EVENING_AZKAR_START_ID &&
                notification.id <=
                  EVENING_AZKAR_END_ID
              )
          )
          .map(notification => ({
            id: notification.id,
          }));

      idsToCancel.push(...azkarNotifications);
    }

    // Also proactively cancel all potential IDs in the 14-day window
    // to guarantee no duplicate or orphan alarms remain
    for (let dayOffset = 0; dayOffset < 15; dayOffset++) {
      const morningId = MORNING_AZKAR_START_ID + dayOffset;
      const eveningId = EVENING_AZKAR_START_ID + dayOffset;
      if (!idsToCancel.some(item => item.id === morningId)) {
        idsToCancel.push({ id: morningId });
      }
      if (!idsToCancel.some(item => item.id === eveningId)) {
        idsToCancel.push({ id: eveningId });
      }
    }

    if (idsToCancel.length > 0) {
      await LocalNotifications.cancel({
        notifications: idsToCancel,
      });
    }
  } catch (err) {
    console.warn(
      'Failed to cancel Azkar notifications:',
      err
    );
  }
}

export async function scheduleAutomaticAzkarNotifications(
  settings: UserSettings
): Promise<number> {
  if (!Capacitor.isNativePlatform()) return 0;

  try {
    await initAzkarNotificationChannel();

    await cancelAzkarNotifications();

    const morningEnabled =
      settings.morningAzkarAlerts !== false;

    const eveningEnabled =
      settings.eveningAzkarAlerts !== false;

    // If both morning and evening Azkar are disabled, nothing to schedule
    if (!morningEnabled && !eveningEnabled) {
      console.log('Azkar notifications are disabled in settings.');
      return 0;
    }

    const now = new Date();

    const notificationsToSchedule: LocalNotificationSchema[] =
      [];

    const DAYS_TO_SCHEDULE = 14;

    for (
      let dayOffset = 0;
      dayOffset < DAYS_TO_SCHEDULE;
      dayOffset++
    ) {
      /*
       * Morning Azkar - 07:00
       */
      if (morningEnabled) {
        const morningTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + dayOffset,
          7,
          0,
          0,
          0
        );

        if (
          morningTime.getTime() >
          now.getTime()
        ) {
          const morningZikr =
            MORNING_AZKAR[dayOffset % MORNING_AZKAR.length];

          notificationsToSchedule.push({
            id:
              MORNING_AZKAR_START_ID +
              dayOffset,

            title: '🌿 أذكار الصباح',

            body: morningZikr.text,

            largeBody: morningZikr.text,

            summaryText: morningZikr.virtue || 'أذكار الصباح',

            schedule: {
              at: morningTime,
              allowWhileIdle: true,
            },

            channelId:
              AZKAR_CHANNEL_ID,

            smallIcon: NOTIFICATION_SMALL_ICON,

            iconColor: NOTIFICATION_ICON_COLOR,

            autoCancel: true,
          });
        }
      }

      /*
       * Evening Azkar - 18:00
       */
      if (eveningEnabled) {
        const eveningTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + dayOffset,
          18,
          0,
          0,
          0
        );

        if (
          eveningTime.getTime() >
          now.getTime()
        ) {
          const eveningZikr =
            EVENING_AZKAR[dayOffset % EVENING_AZKAR.length];

          notificationsToSchedule.push({
            id:
              EVENING_AZKAR_START_ID +
              dayOffset,

            title: '🌙 أذكار المساء',

            body: eveningZikr.text,

            largeBody: eveningZikr.text,

            summaryText: eveningZikr.virtue || 'أذكار المساء',

            schedule: {
              at: eveningTime,
              allowWhileIdle: true,
            },

            channelId:
              AZKAR_CHANNEL_ID,

            smallIcon: NOTIFICATION_SMALL_ICON,

            iconColor: NOTIFICATION_ICON_COLOR,

            autoCancel: true,
          });
        }
      }
    }

    if (
      notificationsToSchedule.length > 0
    ) {
      await LocalNotifications.schedule({
        notifications:
          notificationsToSchedule,
      });
    }

    console.log(
      `Successfully scheduled ${notificationsToSchedule.length} Azkar notifications.`
    );

    return notificationsToSchedule.length;
  } catch (err) {
    console.warn(
      'Failed to schedule Azkar notifications:',
      err
    );

    return 0;
  }
}

export async function scheduleAutomaticAdhanAlarms(
  latitude: number,
  longitude: number,
  settings: UserSettings
): Promise<number> {
  if (!Capacitor.isNativePlatform()) {
    return 0;
  }

  try {
    await initPrayerAlarmChannel();

    await cancelPrayerNotifications();

    /*
     * Schedule Azkar independently from Adhan.
     * Even if Adhan is silent, Azkar notifications
     * can still be scheduled.
     */
    await scheduleAutomaticAzkarNotifications(
      settings
    );

    /*
     * If Adhan is set to silent, don't schedule
     * Adhan sound notifications.
     */
    if (
      settings.adhanType === 'silent'
    ) {
      return 0;
    }

    const coordinates =
      new Coordinates(
        latitude,
        longitude
      );

    const params =
      getCalculationParameters(
        settings.calculationMethod,
        settings.madhab
      );

    const now = new Date();

    const notificationsToSchedule: LocalNotificationSchema[] =
      [];

    const DAYS_TO_SCHEDULE = 7;

    for (
      let dayOffset = 0;
      dayOffset < DAYS_TO_SCHEDULE;
      dayOffset++
    ) {
      const targetDate = new Date();

      targetDate.setDate(
        now.getDate() + dayOffset
      );

      const prayerTimes =
        new PrayerTimes(
          coordinates,
          targetDate,
          params
        );

      for (const prayer of PRAYERS) {
        if (
          !settings.prayerAlerts[
            prayer.key
          ]
        ) {
          continue;
        }

        let prayerTime: Date | null =
          null;

        switch (prayer.key) {
          case 'fajr':
            prayerTime =
              prayerTimes.fajr;
            break;

          case 'dhuhr':
            prayerTime =
              prayerTimes.dhuhr;
            break;

          case 'asr':
            prayerTime =
              prayerTimes.asr;
            break;

          case 'maghrib':
            prayerTime =
              prayerTimes.maghrib;
            break;

          case 'isha':
            prayerTime =
              prayerTimes.isha;
            break;
        }

        if (
          !prayerTime ||
          isNaN(prayerTime.getTime())
        ) {
          continue;
        }

        // 1. Schedule 5-minute pre-prayer notification
        const prePrayerTime = new Date(
          prayerTime.getTime() - 5 * 60 * 1000
        );

        if (prePrayerTime.getTime() > now.getTime()) {
          const preNotificationId =
            PRE_PRAYER_NOTIFICATION_START_ID +
            dayOffset * 10 +
            prayer.index;

          notificationsToSchedule.push({
            id: preNotificationId,
            title: `اقتراب موعد الصلاة`,
            body: `الصلاة القادمة: ${prayer.nameAr} — بعد 5 دقائق`,
            largeBody: `حان وقت الاستعداد لصلاة ${prayer.nameAr}، تفصلنا عنها 5 دقائق بإذن الله.`,
            summaryText: `تنبيه مسبق`,
            schedule: {
              at: prePrayerTime,
              allowWhileIdle: true,
            },
            channelId: PRE_PRAYER_CHANNEL_ID,
            smallIcon: NOTIFICATION_SMALL_ICON,
            iconColor: NOTIFICATION_ICON_COLOR,
            autoCancel: true,
          });
        }

        // 2. Schedule Adhan notification at exact prayer time
        if (
          prayerTime.getTime() >
          now.getTime()
        ) {
          const notificationId =
            PRAYER_NOTIFICATION_START_ID +
            dayOffset * 10 +
            prayer.index;

          const timeFormatted =
            prayerTime.toLocaleTimeString(
              'ar-MA-u-nu-latn',
              {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }
            );

          notificationsToSchedule.push({
            id: notificationId,

            title:
              `حان الآن موعد أذان ${prayer.nameAr}`,

            body:
              `الله أكبر - حان وقت صلاة ${prayer.nameAr} (${timeFormatted})`,

            largeBody:
              `الله أكبر، الله أكبر. حان الآن موعد أذان صلاة ${prayer.nameAr} (${timeFormatted}). تقبل الله طاعتكم.`,

            summaryText: `صلاة ${prayer.nameAr}`,

            schedule: {
              at: prayerTime,
              allowWhileIdle: true,
            },

            channelId:
              prayer.key === 'fajr'
                ? ADHAN_FAJR_CHANNEL_ID
                : ADHAN_CHANNEL_ID,

            sound: 'adhan.mp3',

            smallIcon: NOTIFICATION_SMALL_ICON,

            iconColor: NOTIFICATION_ICON_COLOR,

            autoCancel: true,
          });
        }
      }
    }

    if (
      notificationsToSchedule.length > 0
    ) {
      await LocalNotifications.schedule({
        notifications:
          notificationsToSchedule,
      });

      console.log(
        `Successfully scheduled ${notificationsToSchedule.length} automatic Adhan alarms.`
      );
    }

    return notificationsToSchedule.length;
  } catch (err) {
    console.warn(
      'Failed to schedule automatic Adhan alarms:',
      err
    );

    return 0;
  }
}

/**
 * Utility function to test notifications with exact payload, authentic Azkar text, and correct icon
 */
export async function sendTestNotification(
  type: 'prayer' | 'pre_prayer' | 'morning_azkar' | 'evening_azkar'
): Promise<{ success: boolean; title: string; body: string }> {
  let title = '';
  let body = '';
  let largeBody = '';
  let summaryText = '';
  let channelId = AZKAR_CHANNEL_ID;
  let sound: string | undefined = undefined;

  if (type === 'morning_azkar') {
    const zikr = MORNING_AZKAR[0];
    title = '🌿 أذكار الصباح';
    body = zikr.text;
    largeBody = zikr.text;
    summaryText = zikr.virtue || 'أذكار الصباح';
    channelId = AZKAR_CHANNEL_ID;
  } else if (type === 'evening_azkar') {
    const zikr = EVENING_AZKAR[0];
    title = '🌙 أذكار المساء';
    body = zikr.text;
    largeBody = zikr.text;
    summaryText = zikr.virtue || 'أذكار المساء';
    channelId = AZKAR_CHANNEL_ID;
  } else if (type === 'pre_prayer') {
    title = 'اقتراب موعد الصلاة';
    body = 'الصلاة القادمة: الظهر — بعد 5 دقائق';
    largeBody = 'حان وقت الاستعداد لصلاة الظهر، تفصلنا عنها 5 دقائق بإذن الله.';
    summaryText = 'تنبيه مسبق';
    channelId = PRE_PRAYER_CHANNEL_ID;
  } else {
    title = 'حان الآن موعد أذان الظهر';
    body = 'الله أكبر - حان وقت صلاة الظهر (12:30)';
    largeBody = 'الله أكبر، الله أكبر. حان الآن موعد أذان الظهر حسب توقيت مدينتك (12:30). تقبل الله طاعتكم.';
    summaryText = 'صلاة الظهر';
    channelId = ADHAN_CHANNEL_ID;
    sound = 'adhan.mp3';
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const testId =
        99000 +
        (type === 'morning_azkar'
          ? 1
          : type === 'evening_azkar'
          ? 2
          : type === 'pre_prayer'
          ? 3
          : 4);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: testId,
            title,
            body,
            largeBody,
            summaryText,
            channelId,
            sound,
            smallIcon: NOTIFICATION_SMALL_ICON,
            iconColor: NOTIFICATION_ICON_COLOR,
            autoCancel: true,
          },
        ],
      });
      return { success: true, title, body };
    } catch (e) {
      console.warn('Failed to schedule native test notification:', e);
      return { success: false, title, body };
    }
  } else if (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted'
  ) {
    new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      tag: `test-${type}`,
    });
    return { success: true, title, body };
  }

  return { success: true, title, body };
}

// Expose globally for instant testing / verification
if (typeof window !== 'undefined') {
  (window as unknown as { __testSalatiNotification?: typeof sendTestNotification }).__testSalatiNotification = sendTestNotification;
}
