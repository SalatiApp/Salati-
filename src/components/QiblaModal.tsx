import React, { useEffect, useState } from 'react';
import { X, Compass, MapPin, Navigation } from 'lucide-react';
import { CityData } from '../types';
import { getQiblaDirection } from '../utils/prayerCalculations';

interface QiblaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCity?: CityData;
}

export const QiblaModal: React.FC<QiblaModalProps> = ({ isOpen, onClose, currentCity }) => {
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [manualOffset, setManualOffset] = useState<number>(0);

  const cityLat = currentCity?.latitude ?? 21.4225;
  const cityLng = currentCity?.longitude ?? 39.8262;
  const cityName = currentCity?.nameAr || 'مكة المكرمة';

  const qiblaAngle = getQiblaDirection(cityLat, cityLng);

  // Calculate distance in km to Kaaba using Haversine formula
  const calculateDistanceToMakkah = (lat: number, lng: number): number => {
    const kaabaLat = 21.4225;
    const kaabaLng = 39.8262;
    const R = 6371; // km
    const dLat = ((kaabaLat - lat) * Math.PI) / 180;
    const dLng = ((kaabaLng - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((kaabaLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const distanceKm = calculateDistanceToMakkah(cityLat, cityLng);

  // Listen to device orientation if available on mobile
  useEffect(() => {
    if (!isOpen) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) {
        // e.alpha is degrees from North on mobile browsers
        setDeviceHeading(Math.round(e.alpha));
      }
    };

    if (window.DeviceOrientationEvent && 'addEventListener' in window) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // The angle the needle should point relative to top of the phone
  const compassHeading = deviceHeading !== null ? deviceHeading : manualOffset;
  const needleRotation = qiblaAngle - compassHeading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl border border-emerald-700/50 shadow-2xl p-5 flex flex-col relative overflow-hidden text-center">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-800/60 text-right">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base font-tajawal">بوصلة القبلة المشرفة</h2>
              <p className="text-[11px] text-emerald-300">
                من {cityName} نحو الكعبة المشرفة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 transition"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Stats */}
        <div className="grid grid-cols-2 gap-2 my-3">
          <div className="p-2.5 rounded-2xl bg-emerald-900/40 border border-emerald-700/40">
            <span className="text-[10px] text-emerald-300 block">زاوية القبلة</span>
            <span className="text-xl font-bold font-mono text-amber-300">
              {qiblaAngle}°
            </span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">من الشمال باتجاه عقارب الساعة</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-emerald-900/40 border border-emerald-700/40">
            <span className="text-[10px] text-emerald-300 block">المسافة إلى مكة</span>
            <span className="text-xl font-bold font-mono text-amber-300">
              {distanceKm.toLocaleString('ar-EG')}
            </span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">كيلومتر</span>
          </div>
        </div>

        {/* Visual Compass Graphic */}
        <div className="relative w-64 h-64 mx-auto my-3 flex items-center justify-center">
          {/* Compass Dial Outer Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-emerald-600/40 bg-emerald-950/80 shadow-[0_0_30px_rgba(16,185,129,0.2)] flex items-center justify-center">
            {/* Cardinal Marks */}
            <span className="absolute top-2 text-xs font-bold text-red-400 font-mono">N (شمال)</span>
            <span className="absolute bottom-2 text-xs font-bold text-emerald-400 font-mono">S (جنوب)</span>
            <span className="absolute right-2 text-xs font-bold text-emerald-400 font-mono">E (شرق)</span>
            <span className="absolute left-2 text-xs font-bold text-emerald-400 font-mono">W (غرب)</span>

            {/* Subtle Degree Ring Ticks */}
            <div className="w-48 h-48 rounded-full border border-emerald-700/40" />
            <div className="w-36 h-36 rounded-full border border-dashed border-emerald-600/30" />
          </div>

          {/* Rotating Qibla Arrow / Kaaba Indicator */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-500 ease-out"
            style={{ transform: `rotate(${needleRotation}deg)` }}
          >
            {/* Needle Line */}
            <div className="relative h-44 w-1 flex flex-col items-center justify-between">
              {/* Kaaba Emblem at Top of Needle */}
              <div className="flex flex-col items-center -mt-2">
                <div className="w-8 h-8 rounded-lg bg-black border-2 border-amber-400 shadow-md flex items-center justify-center text-[10px] font-bold text-amber-300">
                  🕋
                </div>
                <div className="w-0 h-0 border-x-4 border-x-transparent border-t-8 border-t-amber-400" />
              </div>

              {/* Center Pivot */}
              <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-slate-900 shadow-lg z-10" />

              {/* Bottom Counterweight */}
              <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
            </div>
          </div>
        </div>

        {/* Orientation Guidance */}
        <p className="text-xs text-emerald-300/80 px-2 mt-1">
          قم بتدوير الهاتف أو محاذاة الشمال؛ يشير رمز الكعبة المشرفة 🕋 مباشرة إلى اتجاه مكة المكرمة.
        </p>

        {/* Manual adjustment slider if no gyroscope/orientation permission is active */}
        {deviceHeading === null && (
          <div className="mt-3 pt-3 border-t border-emerald-800/60 text-xs">
            <div className="flex justify-between text-emerald-300 text-[11px] mb-1">
              <span>محاكاة اتجاه الهاتف:</span>
              <span className="font-mono">{manualOffset}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="359"
              value={manualOffset}
              onChange={(e) => setManualOffset(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
};
