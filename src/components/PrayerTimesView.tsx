import React, { useState } from 'react';
import { 
  Bell, 
  BellOff, 
  Play, 
  Square, 
  Compass, 
  Sparkles, 
  MapPin, 
  Sunrise, 
  Sun, 
  Sunset, 
  Moon, 
  CloudSun,
  ChevronLeft,
  Volume2
} from 'lucide-react';
import { CityData, PrayerTimeItem, UserSettings } from '../types';
import { formatSecondsToCountdown } from '../utils/prayerCalculations';
import { soundManager } from '../utils/sound';

interface PrayerTimesViewProps {
  prayers?: PrayerTimeItem[];
  nextPrayerItem?: PrayerTimeItem | null;
  timeRemainingSeconds?: number;
  progressPercent?: number;
  prayerData?: {
    prayers: PrayerTimeItem[];
    nextPrayerItem: PrayerTimeItem | null;
    timeRemainingSeconds: number;
    progressPercent: number;
  };
  currentCity?: CityData;
  settings: UserSettings;
  updateSettings?: (newSettings: Partial<UserSettings>) => void;
  onUpdatePrayerAlert?: (prayerId: keyof UserSettings['prayerAlerts']) => void;
  onOpenQibla?: () => void;
  onOpenTasbeeh?: () => void;
  onOpenSettings?: () => void;
  isMuted?: boolean;
  setIsMuted?: (muted: boolean) => void;
}

export const PrayerTimesView: React.FC<PrayerTimesViewProps> = ({
  prayers,
  nextPrayerItem,
  timeRemainingSeconds,
  progressPercent,
  prayerData,
  currentCity,
  settings,
  onUpdatePrayerAlert,
  onOpenQibla,
  onOpenTasbeeh,
  onOpenSettings,
}) => {
  const effectivePrayers = prayers || prayerData?.prayers || [];
  const effectiveNextPrayer = nextPrayerItem !== undefined ? nextPrayerItem : (prayerData?.nextPrayerItem || null);
  const effectiveTimeRemaining = timeRemainingSeconds !== undefined ? timeRemainingSeconds : (prayerData?.timeRemainingSeconds || 0);
  const effectiveProgressPercent = progressPercent !== undefined ? progressPercent : (prayerData?.progressPercent || 0);

  const cityName = currentCity?.nameAr || 'مكة المكرمة';
  const countryName = currentCity?.countryAr || 'المملكة العربية السعودية';

  const [isPlayingAdhan, setIsPlayingAdhan] = useState(false);
  const countdown = formatSecondsToCountdown(effectiveTimeRemaining);

  const getPrayerIcon = (id: PrayerTimeItem['id'], isNext: boolean) => {
    const className = `w-4.5 h-4.5 sm:w-5 sm:h-5 ${isNext ? 'text-amber-300' : 'text-emerald-700 dark:text-emerald-400'}`;
    switch (id) {
      case 'fajr':
        return <Moon className={className} />;
      case 'sunrise':
        return <Sunrise className={className} />;
      case 'dhuhr':
        return <Sun className={className} />;
      case 'asr':
        return <CloudSun className={className} />;
      case 'maghrib':
        return <Sunset className={className} />;
      case 'isha':
        return <Moon className={className} />;
      default:
        return <Sun className={className} />;
    }
  };

  const handleToggleAdhanAudio = async () => {
    if (isPlayingAdhan) {
      soundManager.stopAudio();
      setIsPlayingAdhan(false);
    } else {
      setIsPlayingAdhan(true);
      try {
        await soundManager.playAdhan('full', effectiveNextPrayer?.id, undefined, true);
      } finally {
        setIsPlayingAdhan(false);
      }
    }
  };

  return (
    <div className="w-full space-y-2.5 sm:space-y-3 animate-fadeIn">
      {/* Hero Card: Next Prayer & Countdown */}
      <div className="w-full relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#065f46] to-[#042f2e] text-white shadow-lg border border-emerald-600/40 p-3.5 sm:p-5">
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:18px_18px] opacity-10 pointer-events-none" />

        <div className="relative z-10">
          {/* Header Row: City & Quick Change */}
          <div className="flex items-center justify-between text-xs text-emerald-200/90 mb-2.5">
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 hover:bg-emerald-800/60 active:scale-95 transition font-medium shadow-xs text-xs"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span>{cityName}، {countryName}</span>
              <ChevronLeft className="w-3 h-3 text-emerald-300" />
            </button>

            <button
              onClick={handleToggleAdhanAudio}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition border active:scale-95 shadow-xs ${
                isPlayingAdhan
                  ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse font-bold'
                  : 'bg-emerald-700/60 text-emerald-100 hover:bg-emerald-700 border-emerald-500/40'
              }`}
            >
              {isPlayingAdhan ? (
                <>
                  <Square className="w-3 h-3 fill-current" />
                  <span>إيقاف الأذان</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>سماع الأذان</span>
                </>
              )}
            </button>
          </div>

          {/* Next Prayer Title */}
          <div className="text-center my-3 sm:my-3.5">
            <p className="text-[11px] sm:text-xs uppercase tracking-widest text-emerald-300 font-semibold mb-1.5 sm:mb-2 font-tajawal drop-shadow-xs">
              الصلاة القادمة
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-tajawal drop-shadow-md flex items-baseline justify-center gap-2.5">
              <span className="tracking-tight text-white">
                {effectiveNextPrayer?.nameAr || 'الفجر'}
              </span>
              <span className="text-base sm:text-lg font-medium text-emerald-100/90 font-mono" dir="ltr">
                ({effectiveNextPrayer?.timeFormatted || '--:--'})
              </span>
            </h2>
          </div>

          {/* Countdown Clock Display */}
          <div className="my-3 flex items-center justify-center gap-2" dir="ltr">
            <div className="flex flex-col items-center bg-emerald-950/60 backdrop-blur-xs border border-emerald-600/40 rounded-xl px-3 py-1.5 min-w-[62px] shadow-inner">
              <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-amber-300 drop-shadow-xs">
                {countdown.hours}
              </span>
              <span className="text-[9px] text-emerald-200 font-tajawal font-medium">ساعة</span>
            </div>
            <span className="text-xl font-bold text-emerald-300/70 mb-2.5">:</span>
            <div className="flex flex-col items-center bg-emerald-950/60 backdrop-blur-xs border border-emerald-600/40 rounded-xl px-3 py-1.5 min-w-[62px] shadow-inner">
              <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-amber-300 drop-shadow-xs">
                {countdown.minutes}
              </span>
              <span className="text-[9px] text-emerald-200 font-tajawal font-medium">دقيقة</span>
            </div>
            <span className="text-xl font-bold text-emerald-300/70 mb-2.5">:</span>
            <div className="flex flex-col items-center bg-emerald-950/60 backdrop-blur-xs border border-emerald-600/40 rounded-xl px-3 py-1.5 min-w-[62px] shadow-inner">
              <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-amber-300 drop-shadow-xs">
                {countdown.seconds}
              </span>
              <span className="text-[9px] text-emerald-200 font-tajawal font-medium">ثانية</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="w-full bg-emerald-950/70 h-2 rounded-full overflow-hidden border border-emerald-700/50 p-[1px]">
              <div
                className="bg-gradient-to-r from-amber-400 to-emerald-300 h-full rounded-full transition-all duration-1000 shadow-sm"
                style={{ width: `${effectiveProgressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-emerald-200/90 mt-1 font-medium">
              <span>الوقت المنقضي</span>
              <span>المتبقي حتى الأذان</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Action Badges: In the middle between Next Prayer and Schedule */}
      <div className="w-full grid grid-cols-2 gap-2 sm:gap-2.5">
        <button
          onClick={onOpenTasbeeh}
          className="w-full flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-800/95 border border-emerald-100/80 dark:border-slate-700/60 shadow-xs hover:shadow-md hover:border-emerald-500/50 active:scale-[0.98] transition-all text-right group"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition shadow-xs shrink-0">
            <Sparkles className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.1]" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-tajawal truncate">السبحة الإلكترونية</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">تسبيح واستغفار ذكي</div>
          </div>
        </button>

        <button
          onClick={onOpenQibla}
          className="w-full flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-800/95 border border-emerald-100/80 dark:border-slate-700/60 shadow-xs hover:shadow-md hover:border-emerald-500/50 active:scale-[0.98] transition-all text-right group"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition shadow-xs shrink-0">
            <Compass className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.1]" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-tajawal truncate">بوصلة القبلة</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">تحديد اتجاه الكعبة</div>
          </div>
        </button>
      </div>

      {/* 3. Prayer Times Schedule Card */}
      <div className="w-full bg-white dark:bg-slate-800/95 rounded-2xl sm:rounded-3xl border border-emerald-100/80 dark:border-slate-700/60 shadow-xs p-3 sm:p-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-700/50 mb-1.5">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 font-tajawal">
            مواقيت الصلاة اليوم
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {settings?.timeFormat24 ? 'نظام 24 ساعة' : 'صباحاً / مساءً'}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
          {effectivePrayers.map((prayer) => {
            const isAlertOn = settings?.prayerAlerts ? (settings.prayerAlerts[prayer.id as keyof UserSettings['prayerAlerts']] ?? true) : true;

            return (
              <div
                key={prayer.id}
                className={`py-2 px-2.5 rounded-xl sm:rounded-2xl transition-all duration-200 flex items-center justify-between ${
                  prayer.isNext
                    ? 'bg-gradient-to-r from-emerald-800 to-emerald-700 text-white shadow-md my-1 border border-emerald-600/40'
                    : prayer.isPassed
                    ? 'text-slate-400 dark:text-slate-500 opacity-80'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50/80 dark:hover:bg-slate-700/40'
                }`}
              >
                {/* Right: Icon and Prayer Name */}
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8.5 h-8.5 rounded-lg sm:rounded-xl flex items-center justify-center transition-transform ${
                      prayer.isNext
                        ? 'bg-emerald-700/80 text-amber-300 shadow-xs'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {getPrayerIcon(prayer.id, prayer.isNext)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm sm:text-base font-tajawal ${prayer.isNext ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                        {prayer.nameAr}
                      </span>
                      {prayer.isNext && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-400 text-slate-950 shadow-xs">
                          الآن
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-medium ${prayer.isNext ? 'text-emerald-200' : 'text-slate-400'}`}>
                      {prayer.nameEn}
                    </span>
                  </div>
                </div>

                {/* Left: Time and Notification Toggle */}
                <div className="flex items-center gap-2.5" dir="ltr">
                  <button
                    onClick={() => onUpdatePrayerAlert && onUpdatePrayerAlert(prayer.id as keyof UserSettings['prayerAlerts'])}
                    className={`p-1 rounded-md transition active:scale-95 ${
                      prayer.isNext
                        ? isAlertOn
                          ? 'text-amber-300 hover:bg-emerald-700/80'
                          : 'text-emerald-400/50 hover:bg-emerald-700/80'
                        : isAlertOn
                        ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700'
                        : 'text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    title={isAlertOn ? 'التنبيه مفعل' : 'التنبيه معطل'}
                    aria-label={`تنبيه ${prayer.nameAr}`}
                  >
                    {isAlertOn ? <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <BellOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </button>
                  <span
                    className={`font-bold text-base sm:text-lg tracking-tight font-mono min-w-[3.2rem] text-right ${
                      prayer.isNext ? 'text-amber-300' : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {prayer.timeFormatted}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Spiritual Quran Verse Card: At the very bottom with dark, clear background */}
      <div className="w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#042f2e] via-[#064e3b] to-[#022c22] text-white p-3.5 sm:p-4.5 border border-emerald-500/40 shadow-lg text-center relative overflow-hidden">
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

        <div className="relative z-10">
          <p className="font-quran text-xl sm:text-2xl md:text-[26px] text-white font-bold leading-[2] sm:leading-[2.2] tracking-normal my-0.5 drop-shadow-md selection:bg-white/20 selection:text-white">
            ﴿ إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا ﴾
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-2.5 pt-2.5 border-t border-emerald-600/40 text-xs sm:text-sm font-tajawal">
            <span className="font-bold text-white bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-400/40 shadow-xs text-xs">
              سورة النساء: الآية 103
            </span>
            <span className="text-emerald-200/90 font-medium text-xs">
              المحافظة على الصلاة في وقتها من أحب الأعمال إلى الله
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
