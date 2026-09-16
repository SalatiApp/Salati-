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
  prayers: PrayerTimeItem[];
  nextPrayerItem: PrayerTimeItem | null;
  timeRemainingSeconds: number;
  progressPercent: number;
  currentCity: CityData;
  settings: UserSettings;
  onUpdatePrayerAlert: (prayerId: keyof UserSettings['prayerAlerts']) => void;
  onOpenQibla: () => void;
  onOpenTasbeeh: () => void;
  onOpenSettings: () => void;
}

export const PrayerTimesView: React.FC<PrayerTimesViewProps> = ({
  prayers,
  nextPrayerItem,
  timeRemainingSeconds,
  progressPercent,
  currentCity,
  settings,
  onUpdatePrayerAlert,
  onOpenQibla,
  onOpenTasbeeh,
  onOpenSettings,
}) => {
  const [isPlayingAdhan, setIsPlayingAdhan] = useState(false);
  const countdown = formatSecondsToCountdown(timeRemainingSeconds);

  const getPrayerIcon = (id: PrayerTimeItem['id'], isNext: boolean) => {
    const className = `w-5 h-5 ${isNext ? 'text-amber-300' : 'text-emerald-700 dark:text-emerald-400'}`;
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
      await soundManager.playAdhan('full');
      setIsPlayingAdhan(false);
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      {/* Hero Card: Next Prayer & Countdown */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 text-white shadow-xl border border-emerald-700/40 p-5">
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:18px_18px] opacity-10 pointer-events-none" />

        <div className="relative z-10">
          {/* Header Row: City & Quick Change */}
          <div className="flex items-center justify-between text-xs text-emerald-200/90 mb-3">
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-600/30 hover:bg-emerald-800/50 transition font-medium"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span>{currentCity.nameAr}، {currentCity.countryAr}</span>
              <ChevronLeft className="w-3 h-3 text-emerald-300" />
            </button>

            <button
              onClick={handleToggleAdhanAudio}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition border ${
                isPlayingAdhan
                  ? 'bg-amber-500 text-slate-900 border-amber-400 animate-pulse'
                  : 'bg-emerald-700/50 text-emerald-100 hover:bg-emerald-700 border-emerald-600/40'
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
          <div className="text-center my-2">
            <p className="text-xs uppercase tracking-wider text-emerald-300 font-semibold mb-1">
              الصلاة القادمة
            </p>
            <h2 className="text-3xl font-extrabold text-white font-tajawal drop-shadow-sm flex items-center justify-center gap-2">
              <span>{nextPrayerItem?.nameAr || 'الفجر'}</span>
              <span className="text-lg font-normal text-emerald-200">
                ({nextPrayerItem?.timeFormatted})
              </span>
            </h2>
          </div>

          {/* Countdown Clock Display */}
          <div className="my-4 flex items-center justify-center gap-2" dir="ltr">
            <div className="flex flex-col items-center bg-emerald-950/60 border border-emerald-700/50 rounded-2xl px-3.5 py-2 min-w-[66px]">
              <span className="text-2xl font-bold font-mono tracking-tight text-amber-300">
                {countdown.hours}
              </span>
              <span className="text-[10px] text-emerald-300 font-tajawal font-medium">ساعة</span>
            </div>
            <span className="text-2xl font-bold text-emerald-400/60 mb-3">:</span>
            <div className="flex flex-col items-center bg-emerald-950/60 border border-emerald-700/50 rounded-2xl px-3.5 py-2 min-w-[66px]">
              <span className="text-2xl font-bold font-mono tracking-tight text-amber-300">
                {countdown.minutes}
              </span>
              <span className="text-[10px] text-emerald-300 font-tajawal font-medium">دقيقة</span>
            </div>
            <span className="text-2xl font-bold text-emerald-400/60 mb-3">:</span>
            <div className="flex flex-col items-center bg-emerald-950/60 border border-emerald-700/50 rounded-2xl px-3.5 py-2 min-w-[66px]">
              <span className="text-2xl font-bold font-mono tracking-tight text-amber-300">
                {countdown.seconds}
              </span>
              <span className="text-[10px] text-emerald-300 font-tajawal font-medium">ثانية</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="w-full bg-emerald-950/70 h-2 rounded-full overflow-hidden border border-emerald-800/60">
              <div
                className="bg-gradient-to-r from-amber-400 to-emerald-300 h-full rounded-full transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-emerald-300/80 mt-1.5">
              <span>الوقت المنقضي</span>
              <span>المتبقي حتى الأذان</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Badges */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={onOpenQibla}
          className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:border-emerald-500/40 transition text-right group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-800 dark:text-slate-100">بوصلة القبلة</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">تحديد اتجاه الكعبة بدقة</div>
          </div>
        </button>

        <button
          onClick={onOpenTasbeeh}
          className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:border-emerald-500/40 transition text-right group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-800 dark:text-slate-100">السبحة الإلكترونية</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">تسبيح واستغفار ذكي</div>
          </div>
        </button>
      </div>

      {/* Prayer Times Schedule Card */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/40 mb-2">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            مواقيت الصلاة اليوم
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {settings.timeFormat24 ? 'نظام 24 ساعة' : 'صباحاً / مساءً'}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
          {prayers.map((prayer) => {
            const isAlertKey = prayer.id !== 'sunrise';
            const isAlertOn = isAlertKey ? settings.prayerAlerts[prayer.id as keyof UserSettings['prayerAlerts']] : false;

            return (
              <div
                key={prayer.id}
                className={`py-3 px-2 rounded-2xl transition flex items-center justify-between ${
                  prayer.isNext
                    ? 'bg-emerald-800 text-white shadow-md my-1'
                    : prayer.isPassed
                    ? 'text-slate-400 dark:text-slate-500'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                {/* Right: Icon and Prayer Name */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      prayer.isNext
                        ? 'bg-emerald-700 text-amber-300'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {getPrayerIcon(prayer.id, prayer.isNext)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-base ${prayer.isNext ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                        {prayer.nameAr}
                      </span>
                      {prayer.isNext && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900">
                          الآن
                        </span>
                      )}
                    </div>
                    <span className={`text-[11px] ${prayer.isNext ? 'text-emerald-200' : 'text-slate-400'}`}>
                      {prayer.nameEn}
                    </span>
                  </div>
                </div>

                {/* Left: Time and Notification Toggle */}
                <div className="flex items-center gap-3" dir="ltr">
                  {isAlertKey && (
                    <button
                      onClick={() => onUpdatePrayerAlert(prayer.id as keyof UserSettings['prayerAlerts'])}
                      className={`p-1.5 rounded-lg transition ${
                        prayer.isNext
                          ? isAlertOn
                            ? 'text-amber-300 hover:bg-emerald-700'
                            : 'text-emerald-400/50 hover:bg-emerald-700'
                          : isAlertOn
                          ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700'
                          : 'text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      title={isAlertOn ? 'التنبيه مفعل' : 'التنبيه معطل'}
                      aria-label="تنبيه الأذان"
                    >
                      {isAlertOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                    </button>
                  )}
                  <span
                    className={`font-bold text-lg tracking-tight font-mono ${
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

      {/* Spiritual Quran / Hadith Thought */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800/70 dark:to-emerald-950/30 p-4 border border-emerald-100 dark:border-emerald-900/30 text-right">
        <p className="text-sm font-amiri text-emerald-950 dark:text-emerald-200 leading-relaxed">
          ﴿إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا﴾
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          سورة النساء: الآية 103 • المحافظة على الصلاة في وقتها من أحب الأعمال إلى الله.
        </p>
      </div>
    </div>
  );
};
