import { CalculationMethod, Coordinates, Madhab, PrayerTimes, Qibla } from 'adhan';
import { CalculationMethodKey, MadhabKey, PrayerTimeItem, UserSettings } from '../types';

export function getCalculationParameters(methodKey: CalculationMethodKey, madhabKey: MadhabKey) {
  let params;

  switch (methodKey) {
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

export function getCalendarDateInTimezone(
  date: Date = new Date(),
  timeZone: string = 'Africa/Casablanca'
): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone || 'Africa/Casablanca',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = formatter.formatToParts(date);
  const year = parseInt(parts.find((p) => p.type === 'year')!.value, 10);
  const month = parseInt(parts.find((p) => p.type === 'month')!.value, 10) - 1;
  const day = parseInt(parts.find((p) => p.type === 'day')!.value, 10);

  return new Date(year, month, day, 12, 0, 0);
}

export function calculateDailyPrayers(
  lat: number,
  lng: number,
  date: Date,
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

  const now = new Date();

  // عرض مواقيت الصلاة دائماً بنظام 24 ساعة وبالأرقام الغربية وفق التوقيت الرسمي للمدينة (Africa/Casablanca افتراضياً للمغرب)
  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('ar-EG-u-nu-latn', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timeZone || 'Africa/Casablanca',
    });
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
