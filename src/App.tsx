/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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

  // Azkar notifications
  morningAzkarAlerts: true,
  eveningAzkarAlerts: true,
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
  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('salati_settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

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
  }, [
    settings.locationMode,
    settings.selectedCityId,
    settings.customCoordinates,
    settings.calculationMethod,
  ]);

  // Handle city selection
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

      localStorage.setItem('salati_settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

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
    return calculateDailyPrayers(
      currentCity.latitude,
      currentCity.longitude,
      now,
      settings
    );
  }, [currentCity, now, settings]);

  // Schedule automatic Adhan exact alarms on Android
  // and automatic Azkar notifications.
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

    // Re-schedule Azkar notifications when toggles change
    settings.morningAzkarAlerts,
    settings.eveningAzkarAlerts,
  ]);

  // Check if current time matches any prayer time to fire Adhan notification (foreground)
  useEffect(() => {
    const currentMinuteKey = `${now.getHours()}:${now.getMinutes()}`;

    if (lastAlertMinuteRef.current === currentMinuteKey) return;

    prayerData.prayers.forEach((prayer) => {
      if (prayer.id === 'sunrise') return;

      const isEnabled =
        settings.prayerAlerts[
          prayer.id as keyof UserSettings['prayerAlerts']
        ];

      if (!isEnabled) return;

      const pTime = prayer.time;

      // If prayer is in this exact minute
      if (
        p
