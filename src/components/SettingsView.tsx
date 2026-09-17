import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Compass,
  Bell,
  Volume2,
  Square,
  Check,
  ShieldCheck,
  Smartphone,
  Clock,
  X,
  Sparkles,
  Download,
  CheckCircle2,
  Share,
  PlusSquare,
  Wifi,
} from 'lucide-react';

import { CALCULATION_METHODS } from '../data/cities';
import {
  CalculationMethodKey,
  CityData,
  UserSettings,
} from '../types';

import {
  checkNotificationPermission,
  requestNotificationPermission,
  soundManager,
} from '../utils/sound';

import { scheduleAutomaticAdhanAlarms } from '../utils/prayerAlarmScheduler';
import { Capacitor } from '@capacitor/core';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { CitySelectionModal } from './CitySelectionModal';

interface SettingsViewProps {
  settings: UserSettings;
  currentCity?: CityData;
  onUpdateSettings?: (newSettings: Partial<UserSettings>) => void;
  updateSettings?: (newSettings: Partial<UserSettings>) => void;
  onSelectCity?: (city: CityData) => void;
}

const SettingsViewComponent: React.FC<SettingsViewProps> = ({
  settings,
  currentCity,
  onUpdateSettings: propOnUpdateSettings,
  updateSettings: propUpdateSettings,
  onSelectCity = () => {},
}) => {
  const onUpdateSettings = propOnUpdateSettings || propUpdateSettings || (() => {});
  const cityName = currentCity?.nameAr || 'مكة المكرمة';
  const countryName = currentCity?.countryAr || 'المملكة العربية السعودية';
  const cityLat = currentCity?.latitude ?? 21.4225;
  const cityLng = currentCity?.longitude ?? 39.8262;
  const cityId = currentCity?.id || 'makkah';

  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [isPlayingTestAdhan, setIsPlayingTestAdhan] = useState(false);

  const [notificationPermissionGranted, setNotificationPermissionGranted] =
    useState<boolean>(() => {
      if (Capacitor.isNativePlatform()) {
        return false;
      }

      return typeof window !== 'undefined' &&
        'Notification' in window
        ? Notification.permission === 'granted'
        : false;
    });

  const [showIOSModal, setShowIOSModal] = useState(false);

  // Check notification permission
  useEffect(() => {
    let isMounted = true;

    const verifyPermission = async () => {
      const granted = await checkNotificationPermission();

      if (isMounted) {
        setNotificationPermissionGranted((prev) =>
          prev === granted ? prev : granted
        );
      }
    };

    verifyPermission();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        verifyPermission();
      }
    };

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    return () => {
      isMounted = false;
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );
    };
  }, []);

  const {
    isInstallable,
    isInstalled,
    isIOS,
    install,
  } = usePWAInstall();

  // GPS
  const handleUseGps = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus(
        'خاصية تحديد الموقع غير مدعومة في متصفحك.'
      );
      return;
    }

    setGpsStatus(
      'جاري تحديد موقعك الجغرافي...'
    );

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const {
          latitude,
          longitude,
        } = position.coords;

        onUpdateSettings({
          locationMode: 'gps',
          customCoordinates: {
            latitude,
            longitude,
            cityName: 'موقعي الحالي (GPS)',
          },
        });

        setGpsStatus(
          'تم تحديد موقعك بدقة بنجاح!'
        );

        setTimeout(() => {
          setGpsStatus(null);
        }, 3000);
      },

      (error) => {
        setGpsStatus(
          `تعذر الوصول للموقع: ${error.message}`
        );

        setTimeout(() => {
          setGpsStatus(null);
        }, 4000);
      },

      {
        timeout: 10000,
        enableHighAccuracy: true,
      }
    );
  };

  // Test Adhan
  const handleTestAdhan = async () => {
    if (isPlayingTestAdhan) {
      soundManager.stopAudio();
      setIsPlayingTestAdhan(false);
    } else {
      setIsPlayingTestAdhan(true);

      try {
        await soundManager.playAdhan(
          settings.adhanType
        );
      } finally {
        setIsPlayingTestAdhan(false);
      }
    }
  };

  // Request notification permission
  const handleRequestNotifications = async () => {
    const granted =
      await requestNotificationPermission();

    setNotificationPermissionGranted(granted);

    if (granted) {
      if (Capacitor.isNativePlatform()) {
        await scheduleAutomaticAdhanAlarms(
          cityLat,
          cityLng,
          settings
        );
      }

      alert(
        'تم تفعيل إشعارات الأذان والأذكار بنجاح!'
      );
    } else {
      if (Capacitor.isNativePlatform()) {
        alert(
          'لم يتم منح إذن الإشعارات. يمكنك تفعيل الإشعارات من إعدادات الهاتف لتطبيق صلاتي.'
        );
      } else {
        alert(
          'تم رفض الإذن أو غير متاح في هذا المتصفح.'
        );
      }
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">

      {/* Location Settings Card */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm">

        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700/40">

          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              الموقع الجغرافي
            </h3>

            <p className="text-xs text-slate-400">
              لحساب مواقيت الصلاة واتجاه القبلة بدقة
            </p>
          </div>

        </div>

        {/* Current City */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between mb-3">

          <div>
            <span className="text-xs text-slate-400 block">
              المدينة المحددة حالياً:
            </span>

            <span className="font-bold text-base text-slate-900 dark:text-slate-100">
              {cityName} ({countryName})
            </span>

            <span className="text-[11px] text-slate-400 block font-mono mt-0.5">
              خط العرض: {cityLat.toFixed(2)}°،
              خط الطول: {cityLng.toFixed(2)}°
            </span>
          </div>

          <button
            onClick={() => setIsCityModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 text-white font-semibold text-xs hover:bg-emerald-800 transition shadow-sm"
          >
            تغيير المدينة
          </button>

        </div>

        {/* GPS */}
        <div className="flex flex-col gap-2">

          <button
            onClick={handleUseGps}
            className="w-full py-2.5 px-4 rounded-xl border border-emerald-600/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-emerald-100/60 transition"
          >
            <Compass className="w-4 h-4" />
            <span>
              تحديد الموقع تلقائياً عبر نظام GPS
            </span>
          </button>

          {gpsStatus && (
            <p className="text-xs text-center text-emerald-600 dark:text-emerald-400 font-medium">
              {gpsStatus}
            </p>
          )}

        </div>
      </div>

      {/* Prayer Calculation Method */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm">

        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700/40">

          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              طريقة الحساب الفلكي
            </h3>

            <p className="text-xs text-slate-400">
              وفقاً للهيئات واللجان الفقهية الإسلامية المعتمدة
            </p>
          </div>

        </div>

        <div className="space-y-2">

          <label className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
            الهيئة الفقهية:
          </label>

          <select
            value={settings.calculationMethod}
            onChange={(e) =>
              onUpdateSettings({
                calculationMethod:
                  e.target.value as CalculationMethodKey,
              })
            }
            className="w-full p-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500/20"
          >
            {CALCULATION_METHODS.map((m) => (
              <option
                key={m.key}
                value={m.key}
              >
                {m.nameAr}
              </option>
            ))}
          </select>

        </div>

        {/* Madhab */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/40 space-y-2">

          <label className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
            المذهب الفقهي لحساب صلاة العصر:
          </label>

          <div className="grid grid-cols-2 gap-2">

            <button
              onClick={() =>
                onUpdateSettings({
                  madhab: 'shafi',
                })
              }
              className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                settings.madhab === 'shafi'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              الجمهور (شافعي، مالكي، حنبلي)
            </button>

            <button
              onClick={() =>
                onUpdateSettings({
                  madhab: 'hanafi',
                })
              }
              className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                settings.madhab === 'hanafi'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              المذهب الحنفي (ظل الشيء مثليه)
            </button>

          </div>
        </div>
      </div>

      {/* Adhan Notifications & Audio */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm">

        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700/40">

          <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              تنبيهات وصوت الأذان
            </h3>

            <p className="text-xs text-slate-400">
              تخصيص الإشعارات عند دخول وقت الصلاة
            </p>
          </div>

        </div>

        {/* Permission */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between mb-4">

          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
              {Capacitor.isNativePlatform()
                ? 'إشعارات وتنبيهات الأذان:'
                : 'إشعارات المتصفح والنظام:'}
            </span>

            <span
              className={`text-xs font-bold ${
                notificationPermissionGranted
                  ? 'text-emerald-600'
                  : 'text-amber-600'
              }`}
            >
              {notificationPermissionGranted
                ? 'مفعلة وجاهزة للتنبيه'
                : 'تحتاج للموافقة على الإذن'}
            </span>
          </div>

          {!notificationPermissionGranted && (
            <button
              onClick={handleRequestNotifications}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
            >
              تفعيل الإذن
            </button>
          )}

        </div>

        {/* Adhan Sound */}
        <div className="space-y-2 mb-4">

          <label className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
            صوت التنبيه عند الأذان:
          </label>

          <div className="grid grid-cols-2 gap-2 text-xs">

            {[
              {
                id: 'full',
                label: 'الأذان كاملاً (أذان مكة)',
              },
              {
                id: 'takbeer',
                label: 'التكبيرات فقط',
              },
              {
                id: 'beep',
                label: 'نغمة هادئة',
              },
              {
                id: 'silent',
                label: 'صامت (إشعار فقط)',
              },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() =>
                  onUpdateSettings({
                    adhanType:
                      option.id as UserSettings['adhanType'],
                  })
                }
                className={`p-2.5 rounded-xl border font-medium text-right transition flex items-center justify-between ${
                  settings.adhanType === option.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{option.label}</span>

                {settings.adhanType === option.id && (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                )}
              </button>
            ))}

          </div>
        </div>

        {/* Test Adhan */}
        <button
          onClick={handleTestAdhan}
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
            isPlayingTestAdhan
              ? 'bg-amber-500 text-slate-900 animate-pulse'
              : 'bg-emerald-700 text-white hover:bg-emerald-800'
          }`}
        >
          {isPlayingTestAdhan ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span>إيقاف التجربة</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span>تجربة صوت الأذان الآن</span>
            </>
          )}
        </button>

      </div>

      {/* Azkar Notifications Card */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm">

        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700/40">

          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              إشعارات الأذكار
            </h3>

            <p className="text-xs text-slate-400">
              تنبيهات أذكار الصباح والمساء
            </p>
          </div>

        </div>

        {/* Morning Azkar */}
        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/40">

          <div className="flex items-center gap-3">

            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>

            <div>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block">
                أذكار الصباح
              </span>

              <span className="text-xs text-slate-400">
                تنبيه يومياً الساعة 07:00
              </span>
            </div>

          </div>

          <button
            onClick={() =>
              onUpdateSettings({
                morningAzkarAlerts:
                  settings.morningAzkarAlerts !== false
                    ? false
                    : true,
              })
            }
            className={`w-12 h-6 rounded-full transition-colors relative ${
              settings.morningAzkarAlerts !== false
                ? 'bg-emerald-600'
                : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                settings.morningAzkarAlerts !== false
                  ? 'left-0.5'
                  : 'right-0.5'
              }`}
            />
          </button>

        </div>

        {/* Evening Azkar */}
        <div className="flex items-center justify-between py-3">

          <div className="flex items-center gap-3">

            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
              <Bell className="w-4 h-4 text-indigo-500" />
            </div>

            <div>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block">
                أذكار المساء
              </span>

              <span className="text-xs text-slate-400">
                تنبيه يومياً الساعة 18:00
              </span>
            </div>

          </div>

          <button
            onClick={() =>
              onUpdateSettings({
                eveningAzkarAlerts:
                  settings.eveningAzkarAlerts !== false
                    ? false
                    : true,
              })
            }
            className={`w-12 h-6 rounded-full transition-colors relative ${
              settings.eveningAzkarAlerts !== false
                ? 'bg-emerald-600'
                : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                settings.eveningAzkarAlerts !== false
                  ? 'left-0.5'
                  : 'right-0.5'
              }`}
            />
          </button>

        </div>

        <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-2">

          <Clock className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            سيتم إرسال التنبيهات تلقائياً حتى إذا كان التطبيق مغلقاً أو شاشة الهاتف مقفلة، ما دام الهاتف يعمل وتم السماح بالإشعارات.
          </p>

        </div>

      </div>

      {/* App Preferences */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm">

        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700/40">

          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              تفضيلات التطبيق
            </h3>

            <p className="text-xs text-slate-400">
              تخصيص العرض والوقت
            </p>
          </div>

        </div>

        {/* 24 Hour */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/40">

          <div>
            <span className="font-medium text-sm text-slate-800 dark:text-slate-200 block">
              نظام 24 ساعة للوقت
            </span>

            <span className="text-xs text-slate-400">
              مثال: 18:30 بدلاً من 06:30 م
            </span>
          </div>

          <button
            onClick={() =>
              onUpdateSettings({
                timeFormat24:
                  !settings.timeFormat24,
              })
            }
            className={`w-12 h-6 rounded-full transition-colors relative ${
              settings.timeFormat24
                ? 'bg-emerald-600'
                : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                settings.timeFormat24
                  ? 'left-0.5'
                  : 'right-0.5'
              }`}
            />
          </button>

        </div>

        {/* Quran Font Size */}
        <div className="pt-3">

          <div className="flex justify-between text-xs text-slate-500 mb-1">

            <span>
              حجم خط قراءة القرآن الافتراضي:
            </span>

            <span className="font-mono font-bold text-emerald-600">
              {settings.quranFontSize}px
            </span>

          </div>

          <input
            type="range"
            min="18"
            max="36"
            value={settings.quranFontSize}
            onChange={(e) =>
              onUpdateSettings({
                quranFontSize:
                  Number(e.target.value),
              })
            }
            className="w-full accent-emerald-600 cursor-pointer"
          />

          <p
            className="mt-2 text-center font-quran text-slate-800 dark:text-slate-200 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            style={{
              fontSize: `${settings.quranFontSize}px`,
            }}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>

        </div>
      </div>

      {/* PWA / Android Install Card */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm">

        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700/40">

          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              تثبيت التطبيق (PWA)
            </h3>

            <p className="text-xs text-slate-400">
              تثبيت على أندرويد وآيفون كبرنامج أصيل
            </p>
          </div>

        </div>

        {isInstalled ? (

          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/60 flex items-center gap-3">

            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />

            <div className="text-right">

              <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200 block">
                التطبيق مثبت بنجاح على هذا الجهاز!
              </span>

              <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                يعمل الآن في وضع الشاشة الكاملة المستقل (Standalone) مع دعم العمل بدون إنترنت وتنبيهات الأذان.
              </span>

            </div>

          </div>

        ) : (

          <div className="space-y-3">

            <div className="grid grid-cols-2 gap-2 text-xs">

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2">

                <Smartphone className="w-4 h-4 text-emerald-600" />

                <span className="text-slate-700 dark:text-slate-300">
                  شاشة كاملة بدون متصفح
                </span>

              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2">

                <Wifi className="w-4 h-4 text-emerald-600" />

                <span className="text-slate-700 dark:text-slate-300">
                  يعمل بدون اتصال بالإنترنت
                </span>

              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2">

                <Bell className="w-4 h-4 text-amber-500" />

                <span className="text-slate-700 dark:text-slate-300">
                  تنبيهات الأذان في وقتها
                </span>

              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2">

                <Sparkles className="w-4 h-4 text-amber-500" />

                <span className="text-slate-700 dark:text-slate-300">
                  أيقونة إسلامية أنيقة
                </span>

              </div>

            </div>

            {isInstallable && (
              <button
                onClick={install}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs hover:brightness-105 active:scale-98 transition flex items-center justify-center gap-2 shadow-md"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />

                <span>
                  إضافة التطبيق إلى الشاشة الرئيسية (تثبيت مجاني)
                </span>
              </button>
            )}

            {isIOS && (
              <button
                onClick={() => setShowIOSModal(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-emerald-600/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-emerald-100/60 transition"
              >
                <Share className="w-4 h-4" />

                <span>
                  طريقة التثبيت على أجهزة iPhone / iPad
                </span>
              </button>
            )}

            {!isInstallable && !isIOS && (
              <p className="text-[11px] text-slate-400 text-center">
                يمكنك أيضاً تثبيت التطبيق عبر قائمة متصفحك (ثلاث نقاط ⁝ في كروم ثم "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية").
              </p>
            )}

          </div>
        )}
      </div>

      {/* iOS Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">

          <div className="w-full max-w-sm bg-slate-900 text-white rounded-3xl border border-emerald-700/60 p-5 shadow-2xl text-right">

            <div className="flex items-center justify-between pb-3 border-b border-emerald-800/60 mb-4">

              <div className="flex items-center gap-2">

                <Smartphone className="w-5 h-5 text-amber-400" />

                <h3 className="font-bold text-base font-tajawal">
                  تثبيت على آيفون / آيباد
                </h3>

              </div>

              <button
                onClick={() =>
                  setShowIOSModal(false)
                }
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>

            </div>

            <div className="space-y-3 text-xs text-slate-200 leading-relaxed font-tajawal">

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">

                <div className="p-1.5 rounded-lg bg-emerald-900/60 text-amber-400 shrink-0">
                  <Share className="w-4 h-4" />
                </div>

                <div>
                  <strong className="text-white block">
                    1. اضغط على زر المشاركة:
                  </strong>

                  <span>
                    اضغط على أيقونة المشاركة (Share) في شريط متصفح Safari بالأسفل.
                  </span>
                </div>

              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">

                <div className="p-1.5 rounded-lg bg-emerald-900/60 text-amber-400 shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>

                <div>
                  <strong className="text-white block">
                    2. اختر "إضافة إلى الصفحة الرئيسية":
                  </strong>

                  <span>
                    مرر القائمة لأسفل ثم اختر (Add to Home Screen).
                  </span>
                </div>

              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">

                <div className="p-1.5 rounded-lg bg-emerald-900/60 text-amber-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>

                <div>
                  <strong className="text-white block">
                    3. تجربة التطبيق كاملة:
                  </strong>

                  <span>
                    سيعمل تطبيق صلاتي مباشرة كأي تطبيق أصيل وسريع.
                  </span>
                </div>

              </div>

            </div>

            <button
              onClick={() =>
                setShowIOSModal(false)
              }
              className="mt-5 w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition"
            >
              حسناً، فهمت
            </button>

          </div>
        </div>
      )}

      {/* Zero Cost & Privacy */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-900 to-teal-950 text-white border border-emerald-700/50 shadow-sm text-right">

        <div className="flex items-center gap-2 mb-2 text-amber-300">

          <ShieldCheck className="w-5 h-5" />

          <h4 className="font-bold text-sm">
            تطبيق "صلاتي" - صدقة جارية ومجاني 100%
          </h4>

        </div>

        <p className="text-xs text-emerald-200/90 leading-relaxed font-tajawal">
          يعمل التطبيق بالكامل بمعادلات فلكية دقيقة بدون الحاجة لأي خدمات أو واجهات مدفوعة. خفيف، وسريع، ويعمل بدون إنترنت، وجاهز تماماً للنشر كـ Progressive Web App أو تطبيق أندرويد.
        </p>

      </div>

      {/* City Selection Modal */}
      <CitySelectionModal
        isOpen={isCityModalOpen}
        onClose={() =>
          setIsCityModalOpen(false)
        }
        currentCityId={cityId}
        onSelectCity={onSelectCity}
      />

    </div>
  );
};

export const SettingsView =
  React.memo(SettingsViewComponent);
