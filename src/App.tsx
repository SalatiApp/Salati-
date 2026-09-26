/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';

import { CITIES } from './data/cities';
import { CityData, TabType, UserSettings } from './types';
import { calculateDailyPrayers } from './utils/prayerCalculations';
import { sendPrayerNotification, sendPrePrayerNotification, soundManager } from './utils/sound';
import { scheduleAutomaticAdhanAlarms } from './utils/prayerAlarmScheduler';
import { Capacitor } from '@capacitor/core';

import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { PrayerTimesView } from './components/PrayerTimesView';
import { QuranView } from './components/QuranView';
import { AzkarView } from './components/AzkarView';
import { DuasView } from './components/DuasView';
import { SettingsView } from './components/SettingsView';
import { QiblaModal } from './components/QiblaModal';
import { TasbeehModal } from './components/TasbeehModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { adMobService } from './services/adMobService';

const DEFAULT_SETTINGS: UserSettings = {
  locationMode: 'city',
  selectedCityId: 'casablanca',
  calculationMethod: 'Morocco',
  madhab: 'shafi',
  adhanType: 'full',

  prayerAlerts: {
    fajr: true,
    sunrise: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },

  quranFontSize: 24,
  quranReadingMode: 'day',
  timeFormat24: true,
  theme: 'emerald',

  morningAzkarAlerts: true,
  eveningAzkarAlerts: true,
};

export default function App() {
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('salati_settings');

      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure Moroccan cities default to the official Morocco calculation method
        if (
          (!parsed.calculationMethod || parsed.calculationMethod === 'MuslimWorldLeague') &&
          (!parsed.selectedCityId || parsed.selectedCityId === 'casablanca' || parsed.selectedCityId === 'fes' || parsed.selectedCityId === 'rabat')
        ) {
          parsed.calculationMethod = 'Morocco';
        }
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
        };
      }

      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [currentTab, setCurrentTab] = useState<TabType>('prayers');
  const [isQiblaOpen, setIsQiblaOpen] = useState(false);
  const [isTasbeehOpen, setIsTasbeehOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [now, setNow] = useState<Date>(new Date());

  const lastAlertMinuteRef = useRef<string>(
    (() => {
      try {
        return sessionStorage.getItem('salati_last_adhan_minute') || '';
      } catch {
        return '';
      }
    })()
  );
  const lastPreAlertMinuteRef = useRef<string>('');

  // ---------------------------------------------------------
  // Handle shortcut URLs
  // ---------------------------------------------------------

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');

      if (
        tabParam === 'quran' ||
        tabParam === 'azkar' ||
        tabParam === 'duas' ||
        tabParam === 'settings'
      ) {
        setCurrentTab(tabParam);
      } else if (tabParam === 'tasbeeh') {
        setIsTasbeehOpen(true);
      } else if (tabParam === 'qibla') {
        setIsQiblaOpen(true);
      }
    } catch {
      // Ignore URL parsing errors.
    }
  }, []);

  // ---------------------------------------------------------
  // Google AdMob Initialization & Tab Tracking (Native Android)
  // ---------------------------------------------------------

  const isModalOpen = isQiblaOpen || isTasbeehOpen;
  const showAdBanner = !isModalOpen && adMobService.isBannerAllowed(currentTab);

  useEffect(() => {
    adMobService.initialize();
  }, []);

  useEffect(() => {
    adMobService.handleTabChange(currentTab, isModalOpen);
  }, [currentTab, isModalOpen]);

  // ---------------------------------------------------------
  // Save settings
  // ---------------------------------------------------------

  const updateSettings = useCallback(
    (newSettings: Partial<UserSettings>) => {
      setSettings((prev) => {
        const updated = {
          ...prev,
          ...newSettings,
        };

        localStorage.setItem(
          'salati_settings',
          JSON.stringify(updated)
        );

        return updated;
      });
    },
    []
  );

  // ---------------------------------------------------------
  // Current city
  // ---------------------------------------------------------

  const currentCity: CityData = useMemo(() => {
    if (
      settings.locationMode === 'gps' &&
      settings.customCoordinates
    ) {
      return {
        id: 'gps_custom',
        nameAr: settings.customCoordinates.cityName,
        nameEn: 'My Location',
        countryAr: 'إحداثيات GPS',
        countryEn: 'GPS Location',
        latitude: settings.customCoordinates.latitude,
        longitude: settings.customCoordinates.longitude,
        timezone:
          (settings.customCoordinates.latitude >= 20.0 &&
           settings.customCoordinates.latitude <= 36.5 &&
           settings.customCoordinates.longitude >= -18.0 &&
           settings.customCoordinates.longitude <= -1.0)
            ? 'Africa/Casablanca'
            : (Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Casablanca'),
        defaultMethod: settings.calculationMethod,
      };
    }

    const found = CITIES.find(
      (city) => city.id === settings.selectedCityId
    );

    return found || CITIES.find((city) => city.id === 'casablanca') || CITIES[0];
  }, [
    settings.locationMode,
    settings.selectedCityId,
    settings.customCoordinates,
    settings.calculationMethod,
  ]);

  // ---------------------------------------------------------
  // Select city
  // ---------------------------------------------------------

  const handleSelectCity = useCallback((city: CityData) => {
    setSettings((prev) => {
      const updated: UserSettings = {
        ...prev,
        locationMode: 'city',
        selectedCityId: city.id,
        calculationMethod:
          (city.defaultMethod as UserSettings['calculationMethod']) ||
          prev.calculationMethod,
      };

      localStorage.setItem(
        'salati_settings',
        JSON.stringify(updated)
      );

      return updated;
    });
  }, []);

  // ---------------------------------------------------------
  // Prayer alert toggle
  // ---------------------------------------------------------

  const handleUpdatePrayerAlert = useCallback(
    (prayerId: keyof UserSettings['prayerAlerts']) => {
      updateSettings({
        prayerAlerts: {
          ...settings.prayerAlerts,
          [prayerId]: !settings.prayerAlerts[prayerId],
        },
      });
    },
    [settings.prayerAlerts, updateSettings]
  );

  // ---------------------------------------------------------
  // Clock & App Foreground/Resume Sync
  // ---------------------------------------------------------

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    const handleResume = () => {
      setNow(new Date());
    };

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleResume();
      }
    });

    window.addEventListener('focus', handleResume);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleResume);
    };
  }, []);

  // ---------------------------------------------------------
  // Calculate prayer times
  // ---------------------------------------------------------

  const prayerData = useMemo(() => {
    return calculateDailyPrayers(
      currentCity.latitude,
      currentCity.longitude,
      now,
      settings,
      currentCity.timezone || 'Africa/Casablanca'
    );
  }, [currentCity, now, settings]);

  // ---------------------------------------------------------
  // Automatic prayer + Azkar notifications
  // ---------------------------------------------------------

  const currentDateKey = `${currentCity.latitude}_${currentCity.longitude}_${now.getFullYear()}-${now.getMonth()}-${now.getDate()}_${now.getTimezoneOffset()}`;

  useEffect(() => {
    scheduleAutomaticAdhanAlarms(
      currentCity.latitude,
      currentCity.longitude,
      settings,
      currentCity.timezone || 'Africa/Casablanca'
    );
  }, [
    currentDateKey,
    currentCity.latitude,
    currentCity.longitude,
    currentCity.timezone,
    settings.calculationMethod,
    settings.madhab,
    settings.adhanType,
    settings.prayerAlerts,
    settings.timeFormat24,
    settings.morningAzkarAlerts,
    settings.eveningAzkarAlerts,
  ]);

  // ---------------------------------------------------------
  // Foreground prayer alert & 5-min pre-prayer notification
  // ---------------------------------------------------------

  useEffect(() => {
    const currentMinuteNum = Math.floor(now.getTime() / 60000);
    const currentMinuteKey = currentMinuteNum.toString();

    // 1. Check 5-minute pre-prayer notification
    if (lastPreAlertMinuteRef.current !== currentMinuteKey) {
      prayerData.prayers.forEach((prayer) => {
        if (prayer.id === 'sunrise') {
          return;
        }

        const prayerId = prayer.id as keyof UserSettings['prayerAlerts'];
        const isEnabled = settings.prayerAlerts[prayerId];
        if (!isEnabled) {
          return;
        }

        const prePrayerMs = prayer.time.getTime() - 5 * 60 * 1000;
        const isPreMinute = Math.floor(prePrayerMs / 60000) === currentMinuteNum;

        if (isPreMinute) {
          lastPreAlertMinuteRef.current = currentMinuteKey;
          try {
            sendPrePrayerNotification(prayer.nameAr);
          } catch {
            // Ignore notification errors.
          }
        }
      });
    }

    // 2. Check exact prayer Adhan alert
    if (lastAlertMinuteRef.current === currentMinuteKey) {
      return;
    }

    let prayerTriggered = false;

    prayerData.prayers.forEach((prayer) => {
      if (prayer.id === 'sunrise') {
        return;
      }

      const prayerId =
        prayer.id as keyof UserSettings['prayerAlerts'];

      const isEnabled = settings.prayerAlerts[prayerId];

      if (!isEnabled) {
        return;
      }

      const sameMinute = Math.floor(prayer.time.getTime() / 60000) === currentMinuteNum;

      if (!sameMinute) {
        return;
      }

      if (prayerTriggered) {
        return;
      }

      prayerTriggered = true;
      lastAlertMinuteRef.current = currentMinuteKey;
      try {
        sessionStorage.setItem('salati_last_adhan_minute', currentMinuteKey);
      } catch {}

      // On native Android, exact prayer Adhan is scheduled and handled authoritatively
      // by AlarmManager and AdhanAudioPlayer. Skipping React foreground sound trigger on native
      // prevents duplicate playback or restart from 0:00 when the phone is moved or screen wakes up.
      if (Capacitor.isNativePlatform()) {
        return;
      }

      if (settings.adhanType === 'silent') {
        return;
      }

      if (isMuted) {
        return;
      }

      soundManager.isAdhanPlayingAsync().then((isAlreadyPlaying) => {
        if (!isAlreadyPlaying && !soundManager.isPlaying()) {
          try {
            soundManager.playAdhan(settings.adhanType, prayer.id, prayer.nameAr);
          } catch {
            // Ignore sound errors.
          }
        }
      });

      try {
        sendPrayerNotification(
          prayer.nameAr,
          prayer.timeFormatted
        );
      } catch {
        // Ignore notification errors.
      }
    });
  }, [
    now,
    prayerData.prayers,
    settings.prayerAlerts,
    settings.adhanType,
    isMuted,
  ]);

  // ---------------------------------------------------------
  // Tab content
  // ---------------------------------------------------------

  const renderCurrentView = () => {
    switch (currentTab) {
      case 'quran':
        return <QuranView initialFontSize={settings.quranFontSize} />;

      case 'azkar':
        return <AzkarView />;

      case 'duas':
        return <DuasView />;

      case 'settings':
        return (
          <SettingsView
            settings={settings}
            onUpdateSettings={updateSettings}
            updateSettings={updateSettings}
            currentCity={currentCity}
            onSelectCity={handleSelectCity}
          />
        );

      case 'prayers':
      default:
        return (
          <PrayerTimesView
            prayers={prayerData.prayers}
            nextPrayerItem={prayerData.nextPrayerItem}
            timeRemainingSeconds={prayerData.timeRemainingSeconds}
            progressPercent={prayerData.progressPercent}
            prayerData={prayerData}
            currentCity={currentCity}
            settings={settings}
            onUpdatePrayerAlert={handleUpdatePrayerAlert}
            onOpenQibla={() => setIsQiblaOpen(true)}
            onOpenTasbeeh={() => setIsTasbeehOpen(true)}
            onOpenSettings={() => setCurrentTab('settings')}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
          />
        );
    }
  };

  // ---------------------------------------------------------
  // App UI
  // ---------------------------------------------------------

  return (
    <div
      className={`min-h-screen ${
        settings.theme === 'dark'
          ? 'bg-slate-950 text-white'
          : settings.theme === 'midnight'
          ? 'bg-[#07111f] text-white'
          : 'bg-[#f3f7f5] text-slate-900'
      }`}
    >
      <Navbar
        currentCity={currentCity}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenQibla={() => setIsQiblaOpen(true)}
        onOpenTasbeeh={() => setIsTasbeehOpen(true)}
        onOpenSettings={() => setCurrentTab('settings')}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        onUpdateSettings={updateSettings}
      />

      <main
        className={`w-full max-w-xl mx-auto px-2.5 sm:px-4 py-2 sm:py-2.5 transition-all duration-200 ${
          showAdBanner ? 'pb-[128px] sm:pb-[136px]' : 'pb-[68px] sm:pb-[76px]'
        }`}
      >
        {renderCurrentView()}
      </main>

      <BottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        setCurrentTab={setCurrentTab}
        onOpenTasbeeh={() => setIsTasbeehOpen(true)}
        showAdBanner={showAdBanner}
      />

      <QiblaModal
        isOpen={isQiblaOpen}
        onClose={() => setIsQiblaOpen(false)}
        currentCity={currentCity}
      />

      <TasbeehModal
        isOpen={isTasbeehOpen}
        onClose={() => setIsTasbeehOpen(false)}
      />

      <PWAInstallBanner />
    </div>
  );
}
