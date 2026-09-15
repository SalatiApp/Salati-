import React from 'react';
import { Compass, Moon, Bell, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { getFormattedGregorianDate, getFormattedHijriDate } from '../utils/prayerCalculations';
import { CityData } from '../types';

interface NavbarProps {
  currentCity: CityData;
  onOpenQibla: () => void;
  onOpenTasbeeh: () => void;
  onOpenSettings: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCity,
  onOpenQibla,
  onOpenTasbeeh,
  onOpenSettings,
  isMuted,
  onToggleMute,
}) => {
  const hijriDate = getFormattedHijriDate();
  const gregorianDate = getFormattedGregorianDate();

  return (
    <header className="sticky top-0 z-30 bg-emerald-900/95 backdrop-blur-md text-white border-b border-emerald-800/60 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand & Location Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 border border-emerald-400/30 flex items-center justify-center shadow-inner text-amber-300 font-amiri text-2xl font-bold">
            صلاتي
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white font-tajawal">صلاتي</h1>
              <button
                onClick={onOpenSettings}
                className="text-xs px-2 py-0.5 rounded-full bg-emerald-800/80 text-emerald-200 hover:bg-emerald-700 transition flex items-center gap-1 border border-emerald-700/50"
                title="تغيير المدينة"
              >
                <span>{currentCity.nameAr}</span>
              </button>
            </div>
            <p className="text-[11px] text-emerald-300/90 font-medium">
              {hijriDate} • <span className="text-emerald-400/80">{gregorianDate}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Audio toggle */}
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-xl transition border ${
              isMuted
                ? 'bg-red-900/40 text-red-300 border-red-800/40'
                : 'bg-emerald-800/60 text-emerald-200 hover:bg-emerald-700/60 border-emerald-700/40'
            }`}
            title={isMuted ? 'الصوت مكتوم' : 'صوت الأذان مفعل'}
            aria-label="تبديل الصوت"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Qibla Direction Button */}
          <button
            onClick={onOpenQibla}
            className="p-2 rounded-xl bg-emerald-800/60 text-emerald-200 hover:bg-emerald-700/60 transition border border-emerald-700/40 flex items-center justify-center"
            title="اتجاه القبلة"
            aria-label="اتجاه القبلة"
          >
            <Compass className="w-4 h-4 text-amber-300" />
          </button>

          {/* Digital Tasbeeh Button */}
          <button
            onClick={onOpenTasbeeh}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600/30 to-amber-500/20 text-amber-300 hover:bg-amber-600/40 transition border border-amber-500/30 flex items-center gap-1.5 text-xs font-semibold"
            title="السبحة الإلكترونية"
            aria-label="السبحة الإلكترونية"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>السبحة</span>
          </button>
        </div>
      </div>
    </header>
  );
};
