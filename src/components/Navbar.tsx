import React from 'react';
import { Volume2, VolumeX, Download } from 'lucide-react';
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
  isMuted = false,
  onToggleMute,
  onInstallClick,
}) => {
  const hijriDate = getFormattedHijriDate();
  const gregorianDate = getFormattedGregorianDate();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const handleInstall = async () => {
    if (onInstallClick) {
      onInstallClick();
    } else if (isInstallable) {
      await install();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-emerald-900/95 backdrop-blur-md text-white border-b border-emerald-800/60 shadow-sm">
      <div className="w-full max-w-xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3.5">
        <div className="relative flex items-center justify-between min-h-[52px]">
          {/* الجانب الأيمن: شعار التطبيق */}
          <div className="flex items-center z-10">
            <img
              src="/pwa-192x192.png"
              alt="شعار صلاتي"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border border-amber-400/40 shadow-md object-cover"
            />
          </div>

          {/* المنتصف تماماً: كلمة «صلاتي» وتحتها التاريخان مع مسافة مناسبة وتكبير أنيق */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-14 sm:px-16 text-center">
            <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-white font-tajawal drop-shadow-sm leading-none mb-1.5">
              صلاتي
            </h1>
            <div className="flex items-center justify-center gap-2 sm:gap-2.5 text-xs sm:text-sm font-semibold font-tajawal pointer-events-auto flex-wrap">
              <span className="text-amber-300 drop-shadow-xs">
                {hijriDate}
              </span>
              <span className="text-emerald-400/60 text-xs select-none">•</span>
              <span className="text-emerald-100/90 font-medium">
                {gregorianDate}
              </span>
            </div>
          </div>

          {/* الجانب الأيسر: الأيقونات المتبقية (تثبيت التطبيق والصوت) بشكل متوازن */}
          <div className="flex items-center gap-1.5 z-10">
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
                className={`p-2 sm:p-2.5 rounded-xl transition border active:scale-95 shadow-xs ${
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
      </div>
    </header>
  );
};
