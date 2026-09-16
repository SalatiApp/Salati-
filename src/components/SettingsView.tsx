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
  Wifi
} from 'lucide-react';
import { CALCULATION_METHODS } from '../data/cities';
import { CalculationMethodKey, CityData, UserSettings } from '../types';
import {
  checkNotificationPermission,
  requestNotificationPermission,
  soundManager
} from '../utils/sound';
import { scheduleAutomaticAdhanAlarms } from '../utils/prayerAlarmScheduler';
import { Capacitor } from '@capacitor/core';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { CitySelectionModal } from './CitySelectionModal';

interface SettingsViewProps {
  settings: UserSettings;
  currentCity: CityData;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onSelectCity: (city: CityData) => void;
}

const SettingsViewComponent: React.FC<SettingsViewProps> = ({
  settings,
  currentCity,
  onUpdateSettings,
  onSelectCity,
}) => {
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [isPlayingTestAdhan, setIsPlayingTestAdhan] = useState(false);

  // Azkar notifications are enabled by default
  // This also keeps old installations enabled when the value is undefined.
  const morningAzkarEnabled =
    settings.morningAzkarAlerts !== false;

  const eveningAzkarEnabled =
    settings.eveningAzkarAlerts !== false;

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

  useEffect(() => {
    let isMounted = true;

    const verifyPermission = async () => {
      const granted = await checkNotificationPermission();

      if (isMounted) {
        setNotificationPermissionGranted(prev =>
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

  const { isInstallable, isInstalled, isIOS, install } =
    usePWAInstall();

  const [showIOSModal, setShowIOSModal] = useState(false);

  const handleUseGps = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus(
        'خاصية تحديد الموقع غير مدعومة في متصفحك.'
      );
      return;
    }

    setGpsStatus('جاري تحديد موقعك الجغرافي...');

    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;

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

        setTimeout(
          () => setGpsStatus(null),
          3000
        );
      },
      error => {
        setGpsStatus(
          `تعذر الوصول للموقع: ${error.message}`
        );

        setTimeout(
          () => setGpsStatus(null),
          4000
        );
      },
      {
        timeout: 10000,
        enableHighAccuracy: true,
      }
    );
  };

  const handleTestAdhan = async () => {
    if (isPlayingTestAdhan) {
      soundManager.stopAudio();
      setIsPlayingTestAdhan(false);
    } else {
      setIsPlayingTestAdhan(true);
      await soundManager.playAdhan(
        settings.adhanType
      );
      setIsPlayingTestAdhan(false);
    }
  };

  const handleRequestNotifications = async () => {
    const granted =
      await requestNotificationPermission();

    setNotificationPermissionGranted(granted);

    if (granted) {
      if (Capacitor.isNativePlatform()) {
        await scheduleAutomaticAdhanAlarms(
          currentCity.latitude,
          currentCity.longitude,
          settings
        );
      }

      alert(
        'تم تفعيل إشعارات الأذان بنجاح!'
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

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between mb-3">
          <div>
            <span className="text-xs text-slate-400 block">
              المدينة المحددة حالياً:
            </span>

            <span className="font-bold text-base text-slate-900 dark:text-slate-100">
              {currentCity.nameAr} ({currentCity.countryAr})
            </span>

            <span className="text-[11px] text-slate-400 block font-mono mt-0.5">
              خط العرض: {currentCity.latitude.toFixed(2)}°،
              خط الطول: {currentCity.longitude.toFixed(2)}°
            </span>
          </div>

          <button
            onClick={() =>
              setIsCityModalOpen(true)
            }
            className="px-3.5 py-2 rounded-xl bg-emerald-700 text-white font-semibold text-xs hover:bg-emerald-800 transition shadow-sm"
          >
            تغيير المدينة
          </button>
        </div>

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

      {/* Prayer Calculation Method Card */}
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
            onChange={e =>
              onUpdateSettings({
                calculationMethod:
                  e.target.value as CalculationMethodKey,
              })
            }
            className="w-full p-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500/20"
          >
            {CALCULATION_METHODS.map(m => (
              <option
                key={m.key}
                value={m.key}
              >
                {m.nameAr}
              </option>
            ))}
          </select>
        </div>

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

      {/* Adhan Notifications & Audio Card */}
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
            ].map(option => (
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
        </
