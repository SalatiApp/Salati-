import React, { useState } from 'react';
import { 
  MapPin, 
  Compass, 
  Bell, 
  Volume2, 
  Square, 
  Play, 
  Check, 
  ShieldCheck, 
  Smartphone, 
  Clock, 
  Search, 
  ChevronLeft,
  X,
  Sparkles,
  Info
} from 'lucide-react';
import { CALCULATION_METHODS, CITIES } from '../data/cities';
import { CalculationMethodKey, CityData, MadhabKey, UserSettings } from '../types';
import { requestNotificationPermission, soundManager } from '../utils/sound';

interface SettingsViewProps {
  settings: UserSettings;
  currentCity: CityData;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onSelectCity: (city: CityData) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  currentCity,
  onUpdateSettings,
  onSelectCity,
}) => {
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [isPlayingTestAdhan, setIsPlayingTestAdhan] = useState(false);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState<boolean>(
    'Notification' in window ? Notification.permission === 'granted' : false
  );

  const filteredCities = CITIES.filter((c) =>
    c.nameAr.includes(citySearchQuery) ||
    c.nameEn.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
    c.countryAr.includes(citySearchQuery)
  );

  const handleUseGps = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('خاصية تحديد الموقع غير مدعومة في متصفحك.');
      return;
    }

    setGpsStatus('جاري تحديد موقعك الجغرافي...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Find closest city in our list or set custom coords
        onUpdateSettings({
          locationMode: 'gps',
          customCoordinates: {
            latitude,
            longitude,
            cityName: 'موقعي الحالي (GPS)',
          },
        });
        setGpsStatus('تم تحديد موقعك بدقة بنجاح!');
        setTimeout(() => setGpsStatus(null), 3000);
      },
      (error) => {
        setGpsStatus(`تعذر الوصول للموقع: ${error.message}`);
        setTimeout(() => setGpsStatus(null), 4000);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleTestAdhan = async () => {
    if (isPlayingTestAdhan) {
      soundManager.stopAudio();
      setIsPlayingTestAdhan(false);
    } else {
      setIsPlayingTestAdhan(true);
      await soundManager.playAdhan(settings.adhanType);
      setIsPlayingTestAdhan(false);
    }
  };

  const handleRequestNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermissionGranted(granted);
    if (granted) {
      alert('تم تفعيل إشعارات الأذان بنجاح!');
    } else {
      alert('تم رفض الإذن أو غير متاح في هذا المتصفح.');
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
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">الموقع الجغرافي</h3>
            <p className="text-xs text-slate-400">لحساب مواقيت الصلاة واتجاه القبلة بدقة</p>
          </div>
        </div>

        {/* Current City display */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between mb-3">
          <div>
            <span className="text-xs text-slate-400 block">المدينة المحددة حالياً:</span>
            <span className="font-bold text-base text-slate-900 dark:text-slate-100">
              {currentCity.nameAr} ({currentCity.countryAr})
            </span>
            <span className="text-[11px] text-slate-400 block font-mono mt-0.5">
              خط العرض: {currentCity.latitude.toFixed(2)}°, خط الطول: {currentCity.longitude.toFixed(2)}°
            </span>
          </div>

          <button
            onClick={() => setIsCityModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 text-white font-semibold text-xs hover:bg-emerald-800 transition shadow-sm"
          >
            تغيير المدينة
          </button>
        </div>

        {/* GPS Option */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleUseGps}
            className="w-full py-2.5 px-4 rounded-xl border border-emerald-600/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-emerald-100/60 transition"
          >
            <Compass className="w-4 h-4" />
            <span>تحديد الموقع تلقائياً عبر نظام GPS</span>
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
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">طريقة الحساب الفلكي</h3>
            <p className="text-xs text-slate-400">وفقاً للهيئات واللجان الفقهية الإسلامية المعتمدة</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
            الهيئة الفقهية:
          </label>
          <select
            value={settings.calculationMethod}
            onChange={(e) => onUpdateSettings({ calculationMethod: e.target.value as CalculationMethodKey })}
            className="w-full p-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500/20"
          >
            {CALCULATION_METHODS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.nameAr}
              </option>
            ))}
          </select>
        </div>

        {/* Madhab for Asr */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/40 space-y-2">
          <label className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
            المذهب الفقهي لحساب صلاة العصر:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onUpdateSettings({ madhab: 'shafi' })}
              className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                settings.madhab === 'shafi'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              الجمهور (شافعي، مالكي، حنبلي)
            </button>
            <button
              onClick={() => onUpdateSettings({ madhab: 'hanafi' })}
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
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">تنبيهات وصوت الأذان</h3>
            <p className="text-xs text-slate-400">تخصيص الإشعارات عند دخول وقت الصلاة</p>
          </div>
        </div>

        {/* Notification Permission status */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between mb-4">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
              إشعارات المتصفح والنظام:
            </span>
            <span className={`text-xs font-bold ${notificationPermissionGranted ? 'text-emerald-600' : 'text-amber-600'}`}>
              {notificationPermissionGranted ? 'مفعلة وجاهزة للتنبيه' : 'تحتاج للموافقة على الإذن'}
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

        {/* Adhan Sound Choice */}
        <div className="space-y-2 mb-4">
          <label className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
            صوت التنبيه عند الأذان:
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { id: 'full', label: 'الأذان كاملاً (أذان مكة)' },
              { id: 'takbeer', label: 'التكبيرات فقط' },
              { id: 'beep', label: 'نغمة هادئة' },
              { id: 'silent', label: 'صامت (إشعار فقط)' },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => onUpdateSettings({ adhanType: option.id as UserSettings['adhanType'] })}
                className={`p-2.5 rounded-xl border font-medium text-right transition flex items-center justify-between ${
                  settings.adhanType === option.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{option.label}</span>
                {settings.adhanType === option.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* Test Adhan Button */}
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

      {/* App Preferences & Display Card */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-700/40">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">تفضيلات التطبيق</h3>
            <p className="text-xs text-slate-400">تخصيص العرض والوقت</p>
          </div>
        </div>

        {/* Time format toggle */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/40">
          <div>
            <span className="font-medium text-sm text-slate-800 dark:text-slate-200 block">نظام 24 ساعة للوقت</span>
            <span className="text-xs text-slate-400">مثال: 18:30 بدلاً من 06:30 م</span>
          </div>
          <button
            onClick={() => onUpdateSettings({ timeFormat24: !settings.timeFormat24 })}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              settings.timeFormat24 ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                settings.timeFormat24 ? 'left-0.5' : 'right-0.5'
              }`}
            />
          </button>
        </div>

        {/* Quran font size preview */}
        <div className="pt-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>حجم خط قراءة القرآن الافتراضي:</span>
            <span className="font-mono font-bold text-emerald-600">{settings.quranFontSize}px</span>
          </div>
          <input
            type="range"
            min="18"
            max="36"
            value={settings.quranFontSize}
            onChange={(e) => onUpdateSettings({ quranFontSize: Number(e.target.value) })}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <p
            className="mt-2 text-center font-quran text-slate-800 dark:text-slate-200 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            style={{ fontSize: `${settings.quranFontSize}px` }}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
        </div>
      </div>

      {/* Zero Cost & Privacy Guarantee Badge */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-900 to-teal-950 text-white border border-emerald-700/50 shadow-sm text-right">
        <div className="flex items-center gap-2 mb-2 text-amber-300">
          <ShieldCheck className="w-5 h-5" />
          <h4 className="font-bold text-sm">تطبيق "صلاتي" - صدقة جارية ومجاني 100%</h4>
        </div>
        <p className="text-xs text-emerald-200/90 leading-relaxed font-tajawal">
          يعمل التطبيق بالكامل بمعادلات فلكية دقيقة بدون الحاجة لأي خدمات أو واجهات مدفوعة. خفيف، وسريع، ويعمل بدون إنترنت، وجاهز تماماً للنشر كـ Progressive Web App أو تطبيق أندرويد.
        </p>
      </div>

      {/* City Selection Modal */}
      {isCityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-5 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base font-tajawal">اختر مدينتك</h3>
              <button
                onClick={() => setIsCityModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="my-3 relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={citySearchQuery}
                onChange={(e) => setCitySearchQuery(e.target.value)}
                placeholder="ابحث عن مدينة أو دولة..."
                className="w-full pr-10 pl-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                autoFocus
              />
            </div>

            {/* Cities List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1">
              {filteredCities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => {
                    onSelectCity(city);
                    setIsCityModalOpen(false);
                  }}
                  className={`w-full py-3 px-3 flex items-center justify-between hover:bg-emerald-50/60 dark:hover:bg-slate-800 transition rounded-xl text-right ${
                    currentCity.id === city.id ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold' : ''
                  }`}
                >
                  <div>
                    <span className="font-bold text-sm block">{city.nameAr}</span>
                    <span className="text-xs text-slate-400">{city.countryAr} • {city.nameEn}</span>
                  </div>
                  {currentCity.id === city.id && (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
