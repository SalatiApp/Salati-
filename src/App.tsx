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
import { sendPrayerNotification, soundManager } from './utils/sound';
import { scheduleAutomaticAdhanAlarms } from './utils/prayerAlarmScheduler';

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

const DEFAULT_SETTINGS: UserSettings = {
  locationMode: 'city',
  selectedCityId: 'makkah',
  calculationMethod: 'UmmAlQura',
  madhab: 'shafi',
  adhanType: 'full',

  prayerAlerts: {
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },

  quranFontSize: 24,
  quranReadingMode: 'day',
  timeFormat24: false,
  theme: 'emerald',

  morningAzkarAlerts: true,
  eveningAzkarAlerts: true,
};

export default function App() {
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('salati_settings');

      if (saved) {
        return {
          ...DEFAULT_SETTINGS,
          ...JSON.parse(saved),
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

  const lastAlertMinuteRef = useRef<string>('');

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
          Intl.DateTimeFormat().resolvedOptions().timeZone,
        defaultMethod: settings.calculationMethod,
      };
    }

    const found = CITIES.find(
      (city) => city.id === settings.selectedCityId
    );

    return found || CITIES[0];
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
  // Clock
  // ---------------------------------------------------------

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ---------------------------------------------------------
  // Calculate prayer times
  // ---------------------------------------------------------

  const prayerData = useMemo(() => {
    return calculateDailyPrayers(
      currentCity.latitude,
      currentCity.longitude,
      now,
      settings
    );
  }, [currentCity, now, settings]);

  // ---------------------------------------------------------
  // Automatic prayer + Azkar notifications
  // ---------------------------------------------------------

  useEffect(() => {
    scheduleAutomaticAdhanAlarms(
      currentCity.latitude,
      currentCity.longitude,
      settings
    );
  }, [
    currentCity.latitude,
    currentCity.longitude,
    settings.calculationMethod,
    settings.madhab,
    settings.adhanType,
    settings.prayerAlerts,
    settings.timeFormat24,
    settings.morningAzkarAlerts,
    settings.eveningAzkarAlerts,
  ]);

  // ---------------------------------------------------------
  // Foreground prayer alert
  // ---------------------------------------------------------

  useEffect(() => {
    const currentMinuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;

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

      const pTime = prayer.time;

      const sameMinute =
        pTime.getHours() === now.getHours() &&
        pTime.getMinutes() === now.getMinutes();

      if (!sameMinute) {
        return;
      }

      if (prayerTriggered) {
        return;
      }

      prayerTriggered = true;
      lastAlertMinuteRef.current = currentMinuteKey;

      if (settings.adhanType === 'silent') {
        return;
      }

      if (isMuted) {
        return;
      }

      try {
        soundManager.playAdhan(settings.adhanType);
      } catch {
        // Ignore sound errors.
      }

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

      <main className="w-full max-w-xl mx-auto px-2.5 sm:px-4 py-2.5 pb-20">
        {renderCurrentView()}
      </main>

      <BottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        setCurrentTab={setCurrentTab}
        onOpenTasbeeh={() => setIsTasbeehOpen(true)}
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
