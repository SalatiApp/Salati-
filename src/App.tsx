/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
};

export default function App() {
  // Load settings from local storage
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('salati_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [currentTab, setCurrentTab] = useState<TabType>('prayers');
  const [isQiblaOpen, setIsQiblaOpen] = useState(false);
  const [isTasbeehOpen, setIsTasbeehOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [now, setNow] = useState<Date>(new Date());

  // Ref to track last triggered adhan minute to prevent duplicate alerts in the same minute
  const lastAlertMinuteRef = useRef<string>('');

  // Support shortcut URL query parameters (e.g., from PWA home screen shortcuts)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'quran' || tabParam === 'azkar' || tabParam === 'duas' || tabParam === 'settings') {
        setCurrentTab(tabParam);
      } else if (tabParam === 'tasbeeh') {
        setIsTasbeehOpen(true);
      } else if (tabParam === 'qibla') {
        setIsQiblaOpen(true);
      }
    } catch {
      // ignore URL parsing errors in sandboxed contexts
    }
  }, []);

  // Save settings when changed
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('salati_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Find current city data
  const currentCity: CityData = useMemo(() => {
    if (settings.locationMode === 'gps' && settings.customCoordinates) {
      return {
        id: 'gps_custom',
        nameAr: settings.customCoordinates.cityName,
        nameEn: 'My Location',
        countryAr: 'إحداثيات GPS',
        countryEn: 'GPS Location',
        latitude: settings.customCoordinates.latitude,
        longitude: settings.customCoordinates.longitude,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        defaultMethod: settings.calculationMethod,
      };
    }
    const found = CITIES.find((c) => c.id === settings.selectedCityId);
    return found || CITIES[0]; // Makkah default
  }, [settings.locationMode, settings.selectedCityId, settings.customCoordinates, settings.calculationMethod]);

  // Handle city selection
  const handleSelectCity = (city: CityData) => {
    updateSettings({
      locationMode: 'city',
      selectedCityId: city.id,
      calculationMethod: (city.defaultMethod as UserSettings['calculationMethod']) || settings.calculationMethod,
    });
  };

  // Handle per-prayer notification alert toggle
  const handleUpdatePrayerAlert = (prayerId: keyof UserSettings['prayerAlerts']) => {
    updateSettings({
      prayerAlerts: {
        ...settings.prayerAlerts,
        [prayerId]: !settings.prayerAlerts[prayerId],
      },
    });
  };

  // Second interval timer to keep prayer times & countdowns exact
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate prayer times
  const prayerData = useMemo(() => {
    return calculateDailyPrayers(currentCity.latitude, currentCity.longitude, now, settings);
  }, [currentCity, now, settings]);

  // Schedule automatic Adhan exact alarms on Android (plays local adhan.mp3 when closed/locked)
  useEffect(() => {
    scheduleAutomaticAdhanAlarms(currentCity.latitude, currentCity.longitude, settings);
  }, [
    currentCity.latitude,
    currentCity.longitude,
    settings.calculationMethod,
    settings.madhab,
    settings.adhanType,
    settings.prayerAlerts,
    settings.timeFormat24,
  ]);

  // Check if current time matches any prayer time to fire Adhan notification (foreground)
  useEffect(() => {
    const currentMinuteKey = `${now.getHours()}:${now.getMinutes()}`;
    if (lastAlertMinuteRef.current === currentMinuteKey) return;

    prayerData.prayers.forEach((prayer) => {
      if (prayer.id === 'sunrise') return;
      const isEnabled = settings.prayerAlerts[prayer.id as keyof UserSettings['prayerAlerts']];
      if (!isEnabled) return;

      const pTime = prayer.time;
      // If prayer is in this exact minute
      if (
        pTime.getFullYear() === now.getFullYear() &&
        pTime.getMonth() === now.getMonth() &&
        pTime.getDate() === now.getDate() &&
        pTime.getHours() === now.getHours() &&
        pTime.getMinutes() === now.getMinutes()
      ) {
        lastAlertMinuteRef.current = currentMinuteKey;
        // Fire adhan sound and browser notification
        if (!isMuted) {
          soundManager.playAdhan(settings.adhanType);
        }
        sendPrayerNotification(prayer.nameAr);
      }
    });
  }, [now, prayerData.prayers, settings.prayerAlerts, settings.adhanType, isMuted]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-tajawal antialiased">
      {/* Top Navbar */}
      <Navbar
        currentCity={currentCity}
        onOpenQibla={() => setIsQiblaOpen(true)}
        onOpenTasbeeh={() => setIsTasbeehOpen(true)}
        onOpenSettings={() => setCurrentTab('settings')}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
      />

      {/* PWA Install & Offline Awareness Banner */}
      <PWAInstallBanner />

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 safe-area-inset-top">
        {currentTab === 'prayers' && (
          <PrayerTimesView
            prayers={prayerData.prayers}
            nextPrayerItem={prayerData.nextPrayerItem}
            timeRemainingSeconds={prayerData.timeRemainingSeconds}
            progressPercent={prayerData.progressPercent}
            currentCity={currentCity}
            settings={settings}
            onUpdatePrayerAlert={handleUpdatePrayerAlert}
            onOpenQibla={() => setIsQiblaOpen(true)}
            onOpenTasbeeh={() => setIsTasbeehOpen(true)}
            onOpenSettings={() => setCurrentTab('settings')}
          />
        )}

        {currentTab === 'quran' && (
          <QuranView initialFontSize={settings.quranFontSize} />
        )}

        {currentTab === 'azkar' && (
          <AzkarView />
        )}

        {currentTab === 'duas' && (
          <DuasView />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            currentCity={currentCity}
            onUpdateSettings={updateSettings}
            onSelectCity={handleSelectCity}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Qibla Direction Compass Modal */}
      <QiblaModal
        isOpen={isQiblaOpen}
        onClose={() => setIsQiblaOpen(false)}
        currentCity={currentCity}
      />

      {/* Electronic Tasbeeh Modal */}
      <TasbeehModal
        isOpen={isTasbeehOpen}
        onClose={() => setIsTasbeehOpen(false)}
      />
    </div>
  );
}
