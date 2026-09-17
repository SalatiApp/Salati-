import React from 'react';
import { Compass, Moon, Bell, Volume2, VolumeX, Sparkles, Download, MapPin } from 'lucide-react';
import { getFormattedGregorianDate, getFormattedHijriDate } from '../utils/prayerCalculations';
import { CityData } from '../types';
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
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCity,
  currentTab,
  setCurrentTab,
  onOpenQibla,
  onOpenTasbeeh,
  onOpenSettings,
  isMuted = false,
  onToggleMute,
  onInstallClick,
}) => {
  const hijriDate = getFormattedHijriDate();
  const gregorianDate = getFormattedGregorianDate();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const cityName = currentCity?.nameAr || 'مكة المكرمة';

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

  return (
    <header className="sticky top-0 z-30 bg-emerald-900/95 backdrop-blur-md text-white border-b border-emerald-800/60 shadow-sm">
      <div className="w-full max-w-xl mx-auto px-2.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
        {/* Brand & Location Info */}
        <div className="flex items-center gap-3">
          <img
            src="/pwa-192x192.png"
            alt="شعار صلاتي"
            className="w-10 h-10 rounded-2xl border border-amber-400/30 shadow-md shrink-0 object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white font-tajawal">صلاتي</h1>
              <button
                onClick={handleOpenSettings}
                className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-800/90 text-emerald-200 hover:bg-emerald-700 hover:text-white transition flex items-center gap-1 border border-emerald-700/60 shadow-xs"
                title="تغيير المدينة"
              >
                <MapPin className="w-3 h-3 text-amber-300" />
                <span>{cityName}</span>
              </button>
            </div>
            <p className="text-[11px] text-emerald-300/90 font-medium mt-0.5">
              {hijriDate} • <span className="text-emerald-400/80">{gregorianDate}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
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

          {/* Qibla Direction Button */}
          {onOpenQibla && (
            <button
              onClick={onOpenQibla}
              className="p-2 rounded-xl bg-emerald-800/60 text-emerald-200 hover:bg-emerald-700/60 transition border border-emerald-700/40 active:scale-95 flex items-center justify-center"
              title="اتجاه القبلة"
              aria-label="اتجاه القبلة"
            >
              <Compass className="w-4 h-4 text-amber-300" />
            </button>
          )}

          {/* Digital Tasbeeh Button */}
          {onOpenTasbeeh && (
            <button
              onClick={onOpenTasbeeh}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600/30 to-amber-500/20 text-amber-300 hover:bg-amber-600/40 active:scale-95 transition border border-amber-500/30 flex items-center gap-1.5 text-xs font-semibold"
              title="السبحة الإلكترونية"
              aria-label="السبحة الإلكترونية"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>السبحة</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
