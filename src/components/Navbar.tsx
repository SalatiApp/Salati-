import React, { useState } from 'react';
import { Volume2, VolumeX, Download, MapPin, Navigation } from 'lucide-react';
import { getFormattedGregorianDate, getFormattedHijriDate } from '../utils/prayerCalculations';
import { CityData, UserSettings } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface NavbarProps {
  currentCity?: CityData;
  currentTab?: string;
  setCurrentTab?: (tab: any) => void;
  onOpenQibla?: () => void;
  onOpenTasbeeh?: () => void;
  onOpenSettings?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onInstallClick?: () => void;
  onUpdateSettings?: (newSettings: Partial<UserSettings>) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCity,
  currentTab,
  setCurrentTab,
  onOpenSettings,
  isMuted = false,
  onToggleMute,
  onInstallClick,
  onUpdateSettings,
}) => {
  const hijriDate = getFormattedHijriDate();
  const gregorianDate = getFormattedGregorianDate();
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [isLocating, setIsLocating] = useState(false);

  const cityName = currentCity?.nameAr || 'موقعي الحالي (GPS)';

  const handleOpenSettings = () => {
    if (onOpenSettings) {
      onOpenSettings();
    } else if (setCurrentTab) {
      setCurrentTab('settings');
    }
  };

  const handleInstall = async () => {
    if (onInstallClick) {
      onInstallClick();
    } else if (isInstallable) {
      await install();
    }
  };

  const handleGpsLocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!('geolocation' in navigator)) {
      handleOpenSettings();
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        if (onUpdateSettings) {
          onUpdateSettings({
            locationMode: 'gps',
            customCoordinates: {
              latitude,
              longitude,
              cityName: 'موقعي الحالي (GPS)',
            },
          });
        }
      },
      () => {
        setIsLocating(false);
        handleOpenSettings();
      },
      {
        timeout: 10000,
        enableHighAccuracy: true,
      }
    );
  };

  return (
    <header className="sticky top-0 z-30 bg-emerald-900/95 backdrop-blur-md text-white border-b border-emerald-800/60 shadow-sm">
      <div className="w-full max-w-xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
        {/* Brand & Location Info */}
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/pwa-192x192.png"
            alt="شعار صلاتي"
            className="w-12 h-12 rounded-2xl border border-amber-400/40 shadow-md shrink-0 object-cover"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-tajawal drop-shadow-xs">
                صلاتي
              </h1>
              <button
                onClick={handleGpsLocation}
                className="text-xs px-2.5 py-1 rounded-full bg-emerald-800/90 hover:bg-emerald-750 text-emerald-100 transition flex items-center gap-1.5 border border-emerald-700/60 shadow-xs active:scale-95"
                title="تحديد وتغيير الموقع الجغرافي"
              >
                <Navigation className={`w-3.5 h-3.5 text-amber-300 ${isLocating ? 'animate-spin' : ''}`} />
                <span className="font-medium truncate max-w-[140px] sm:max-w-[180px]">
                  {isLocating ? 'جاري التحديد...' : cityName.includes('GPS') ? 'موقعي الحالي (GPS)' : `موقعي: ${cityName}`}
                </span>
              </button>
            </div>
            <p className="text-[11px] text-emerald-300/90 font-medium mt-0.5 truncate">
              {hijriDate} • <span className="text-emerald-400/80">{gregorianDate}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick PWA Install button if installable */}
          {!isInstalled && isInstallable && (
            <button
              onClick={handleInstall}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 transition font-bold text-xs flex items-center gap-1 shadow-sm"
              title="تثبيت التطبيق على الشاشة الرئيسية"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">تثبيت</span>
            </button>
          )}

          {/* Audio toggle */}
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className={`p-2 rounded-xl transition border active:scale-95 ${
                isMuted
                  ? 'bg-red-900/40 text-red-300 border-red-800/40'
                  : 'bg-emerald-800/60 text-emerald-200 hover:bg-emerald-700/60 border-emerald-700/40'
              }`}
              title={isMuted ? 'الصوت مكتوم' : 'صوت الأذان مفعل'}
              aria-label="تبديل الصوت"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
