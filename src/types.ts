export type TabType = 'prayers' | 'quran' | 'azkar' | 'duas' | 'settings';

export interface PrayerTimeItem {
  id: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  nameAr: string;
  nameEn: string;
  time: Date;
  timeFormatted: string;
  isNext: boolean;
  isPassed: boolean;
  adhanEnabled: boolean;
}

export interface CityData {
  id: string;
  nameAr: string;
  nameEn: string;
  countryAr: string;
  countryEn: string;
  latitude: number;
  longitude: number;
  timezone: string;
  defaultMethod: string;
}

export type CalculationMethodKey =
  | 'Morocco'
  | 'MuslimWorldLeague'
  | 'Egyptian'
  | 'Karachi'
  | 'UmmAlQura'
  | 'Dubai'
  | 'Qatar'
  | 'Kuwait'
  | 'NorthAmerica'
  | 'MoonsightingCommittee';

export type MadhabKey = 'shafi' | 'hanafi';

export interface UserSettings {
  locationMode: 'city' | 'gps';
  selectedCityId: string;
  customCoordinates?: {
    latitude: number;
    longitude: number;
    cityName: string;
  };
  calculationMethod: CalculationMethodKey;
  madhab: MadhabKey;

  adhanType: 'full' | 'takbeer' | 'beep' | 'silent';

  prayerAlerts: {
    fajr: boolean;
    dhuhr: boolean;
    asr: boolean;
    maghrib: boolean;
    isha: boolean;
  };

  // إشعارات أذكار الصباح والمساء
  morningAzkarAlerts?: boolean;
  eveningAzkarAlerts?: boolean;

  quranFontSize: number;
  quranReadingMode: 'day' | 'night' | 'sepia';
  timeFormat24: boolean;
  theme: 'emerald' | 'dark' | 'midnight';
}

export interface ZikrItem {
  id: string;
  text: string;
  repeat: number;
  currentCount?: number;
  hadith?: string;
  virtue?: string;
}

export interface DuaCategory {
  id: string;
  titleAr: string;
  iconName: string;
  duas: DuaItem[];
}

export interface DuaItem {
  id: string;
  titleAr: string;
  textAr: string;
  reference?: string;
  translation?: string;
}

export interface SurahMeta {
  number: number;
  nameAr: string;
  nameEn: string;
  englishTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
  page: number;
}

export interface AyahItem {
  numberInSurah: number;
  text: string;
  translation?: string;
  numberInQuran?: number;
}

export interface SurahDetail extends SurahMeta {
  ayahs: AyahItem[];
}
