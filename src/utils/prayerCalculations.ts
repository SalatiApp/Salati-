import { CalculationMethod, CalculationParameters, Coordinates, Madhab, PrayerTimes, Qibla } from 'adhan';
import { CalculationMethodKey, MadhabKey, PrayerTimeItem, UserSettings } from '../types';

export function getCalculationParameters(methodKey: CalculationMethodKey, madhabKey: MadhabKey) {
  let params: CalculationParameters;

  switch (methodKey) {
    case 'Morocco': {
      // Moroccan Ministry of Habous and Islamic Affairs (وزارة الأوقاف والشؤون الإسلامية بالمملكة المغربية)
      // Fajr angle: 19°, Isha angle: 17°, Sunrise: -3m, Dhuhr: +5m, Maghrib: +5m, Asr: standard Maliki/shadow factor 1
      params = new CalculationParameters('Other', 19, 17);
      params.methodAdjustments.sunrise = -3;
      params.methodAdjustments.dhuhr = 5;
      params.methodAdjustments.maghrib = 5;
      params.madhab = madhabKey === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
      return params;
    }
    case 'Egyptian':
      params = CalculationMethod.Egyptian();
      break;
    case 'Karachi':
      params = CalculationMethod.Karachi();
      break;
    case 'UmmAlQura':
      params = CalculationMethod.UmmAlQura();
      break;
    case 'Dubai':
      params = CalculationMethod.Dubai();
      break;
    case 'Qatar':
      params = CalculationMethod.Qatar();
      break;
    case 'Kuwait':
      params = CalculationMethod.Kuwait();
      break;
    case 'NorthAmerica':
      params = CalculationMethod.NorthAmerica();
      break;
    case 'MoonsightingCommittee':
      params = CalculationMethod.MoonsightingCommittee();
      break;
    case 'MuslimWorldLeague':
    default:
      params = CalculationMethod.MuslimWorldLeague();
      break;
  }

  if (madhabKey === 'hanafi') {
    params.madhab = Madhab.Hanafi;
  } else {
    params.madhab = Madhab.Shafi;
  }

  return params;
}

export function getTimezoneOffsetMinutes(
  timeZone: string = 'Africa/Casablanca',
  date: Date = new Date()
): number {
  const effectiveTz = timeZone || 'Africa/Casablanca';

  // Specific check for Africa/Casablanca (Morocco)
  // Royal Decree No. 2.26.530 (passed June 25, 2026):
  // Morocco permanently returned to Greenwich Mean Time (GMT, UTC+0) on Sunday 20 September 2026 at 02:00 AM.
  // Older runtime tzdata incorrectly assumes GMT+1 during September 2026.
  if (effectiveTz === 'Africa/Casablanca') {
    const permanentGmtDate = new Date('2026-09-20T02:00:00Z');
    if (date.getTime() >= permanentGmtDate.getTime()) {
      return 0; // Permanent GMT (UTC+0)
    }
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: effectiveTz,
      timeZoneName: 'longOffset',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value;
    if (tzPart) {
      const match = tzPart.match(/GMT([+-]\d{1,2}):?(\d{2})?/);
      if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = match[2] ? parseInt(match[2], 10) : 0;
        return hours * 60 + (hours < 0 ? -minutes : minutes);
      }
    }
  } catch (err) {
    console.warn('Failed to resolve timezone offset for', effectiveTz, err);
  }

  return 0;
}

export function formatPrayerTime(
  d: Date,
  timeZone: string = 'Africa/Casablanca',
  use24: boolean = true
): string {
  const offsetMin = getTimezoneOffsetMinutes(timeZone, d);
  const localTime = new Date(d.getTime() + offsetMin * 60 * 1000);
  let h = localTime.getUTCHours();
  const m = String(localTime.getUTCMinutes()).padStart(2, '0');

  if (use24) {
    return `${String(h).padStart(2, '0')}:${m}`;
  }

  const suffix = h >= 12 ? 'م' : 'ص';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${suffix}`;
}

export function getCalendarDateInTimezone(
  date: Date = new Date(),
  timeZone: string = 'Africa/Casablanca'
): Date {
  const offsetMin = getTimezoneOffsetMinutes(timeZone, date);
  const localTime = new Date(date.getTime() + offsetMin * 60 * 1000);
  const year = localTime.getUTCFullYear();
  const month = localTime.getUTCMonth();
  const day = localTime.getUTCDate();

  return new Date(year, month, day, 12, 0, 0);
}

export function calculateDailyPrayers(
  lat: number,
  lng: number,
  date: Date = new Date(),
  settings: UserSettings,
  timeZone: string = 'Africa/Casablanca'
): {
  prayers: PrayerTimeItem[];
  nextPrayerItem: PrayerTimeItem | null;
  previousPrayerItem: PrayerTimeItem | null;
  timeRemainingSeconds: number;
  progressPercent: number;
  prayerTimesRaw: PrayerTimes;
} {
  const targetDate = getCalendarDateInTimezone(date, timeZone);
  const coordinates = new Coordinates(lat, lng);
  const params = getCalculationParameters(settings.calculationMethod, settings.madhab);
  const prayerTimes = new PrayerTimes(coordinates, targetDate, params);

  const now = date || new Date();

  // عرض مواقيت الصلاة بدقة حسب نظام 24 ساعة أو 12 ساعة وفق التوقيت الرسمي للمدينة
  const formatTime = (d: Date) => {
    return formatPrayerTime(d, timeZone, settings.timeFormat24 !== false);
  };

  const rawList: {
    id: PrayerTimeItem['id'];
    nameAr: string;
    nameEn: string;
    time: Date;
    adhanEnabled: boolean;
  }[] = [
    {
      id: 'fajr',
      nameAr: 'الفَجْر',
      nameEn: 'Fajr',
      time: prayerTimes.fajr,
      adhanEnabled: settings.prayerAlerts.fajr,
    },
    {
      id: 'sunrise',
      nameAr: 'الشُّرُوق',
      nameEn: 'Sunrise',
      time: prayerTimes.sunrise,
      adhanEnabled: false,
    },
    {
      id: 'dhuhr',
      nameAr: 'الظُّهْر',
      nameEn: 'Dhuhr',
      time: prayerTimes.dhuhr,
      adhanEnabled: settings.prayerAlerts.dhuhr,
    },
    {
      id: 'asr',
      nameAr: 'العَصْر',
      nameEn: 'Asr',
      time: prayerTimes.asr,
      adhanEnabled: settings.prayerAlerts.asr,
    },
    {
      id: 'maghrib',
      nameAr: 'المَغْرِب',
      nameEn: 'Maghrib',
      time: prayerTimes.maghrib,
      adhanEnabled: settings.prayerAlerts.maghrib,
    },
    {
      id: 'isha',
      nameAr: 'العِشَاء',
      nameEn: 'Isha',
      time: prayerTimes.isha,
      adhanEnabled: settings.prayerAlerts.isha,
    },
  ];

  let nextIdx = rawList.findIndex(
    p => p.time.getTime() > now.getTime()
  );

  let nextPrayerItem: PrayerTimeItem | null = null;
  let previousPrayerItem: PrayerTimeItem | null = null;
  let timeRemainingSeconds = 0;
  let progressPercent = 0;

  if (nextIdx === -1) {
    const tomorrow = new Date(targetDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowPrayers = new PrayerTimes(
      coordinates,
      tomorrow,
      params
    );

    const tomorrowFajr = tomorrowPrayers.fajr;

    nextPrayerItem = {
      id: 'fajr',
      nameAr: 'الفَجْر (غداً)',
      nameEn: 'Fajr (Tomorrow)',
      time: tomorrowFajr,
      timeFormatted: formatTime(tomorrowFajr),
      isNext: true,
      isPassed: false,
      adhanEnabled: settings.prayerAlerts.fajr,
    };

    previousPrayerItem = {
      id: 'isha',
      nameAr: 'العِشَاء',
      nameEn: 'Isha',
      time: prayerTimes.isha,
      timeFormatted: formatTime(prayerTimes.isha),
      isNext: false,
      isPassed: true,
      adhanEnabled: settings.prayerAlerts.isha,
    };

    const totalWindow =
      tomorrowFajr.getTime() - prayerTimes.isha.getTime();

    const elapsed =
      now.getTime() - prayerTimes.isha.getTime();

    progressPercent = Math.min(
      100,
      Math.max(0, (elapsed / totalWindow) * 100)
    );

    timeRemainingSeconds = Math.max(
      0,
      Math.floor(
        (tomorrowFajr.getTime() - now.getTime()) / 1000
      )
    );
  } else {
    const rawNext = rawList[nextIdx];

    nextPrayerItem = {
      ...rawNext,
      timeFormatted: formatTime(rawNext.time),
      isNext: true,
      isPassed: false,
    };

    const prevTime =
      nextIdx > 0
        ? rawList[nextIdx - 1].time
        : new Date(
            prayerTimes.fajr.getTime() -
              8 * 3600 * 1000
          );

    previousPrayerItem =
      nextIdx > 0
        ? {
            ...rawList[nextIdx - 1],
            timeFormatted: formatTime(
              rawList[nextIdx - 1].time
            ),
            isNext: false,
            isPassed: true,
          }
        : null;

    const totalWindow =
      rawNext.time.getTime() - prevTime.getTime();

    const elapsed =
      now.getTime() - prevTime.getTime();

    progressPercent = Math.min(
      100,
      Math.max(0, (elapsed / totalWindow) * 100)
    );

    timeRemainingSeconds = Math.max(
      0,
      Math.floor(
        (rawNext.time.getTime() - now.getTime()) /
          1000
      )
    );
  }

  const prayers: PrayerTimeItem[] = rawList.map(p => {
    const isNext =
      nextPrayerItem?.id === p.id &&
      (nextIdx !== -1
        ? rawList[nextIdx].id === p.id
        : false);

    const isPassed =
      p.time.getTime() < now.getTime();

    return {
      ...p,
      timeFormatted: formatTime(p.time),
      isNext,
      isPassed,
    };
  });

  return {
    prayers,
    nextPrayerItem,
    previousPrayerItem,
    timeRemainingSeconds,
    progressPercent,
    prayerTimesRaw: prayerTimes,
  };
}

export function getQiblaDirection(
  lat: number,
  lng: number
): number {
  const coordinates = new Coordinates(lat, lng);
  return Math.round(Qibla(coordinates));
}

export function formatSecondsToCountdown(
  seconds: number
): {
  hours: string;
  minutes: string;
  seconds: string;
} {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return {
    hours: String(h).padStart(2, '0'),
    minutes: String(m).padStart(2, '0'),
    seconds: String(s).padStart(2, '0'),
  };
}

export function getFormattedHijriDate(
  date: Date = new Date(),
  timeZone: string = 'Africa/Casablanca'
): string {
  try {
    const formatter = new Intl.DateTimeFormat(
      'ar-SA-u-ca-islamic-umalqura-nu-latn',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: timeZone || 'Africa/Casablanca',
      }
    );

    return formatter.format(date);
  } catch {
    return '1448 هـ';
  }
}

export function getFormattedGregorianDate(
  date: Date = new Date(),
  timeZone: string = 'Africa/Casablanca'
): string {
  return new Intl.DateTimeFormat(
    'ar-EG-u-nu-latn',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: timeZone || 'Africa/Casablanca',
    }
  ).format(date);
}
