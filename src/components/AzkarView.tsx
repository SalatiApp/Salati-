import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  RotateCcw, 
  Check, 
  Info, 
  Copy, 
  Volume2, 
  Sparkles 
} from 'lucide-react';
import { EVENING_AZKAR, MORNING_AZKAR } from '../data/azkar';
import { ZikrItem } from '../types';
import { soundManager } from '../utils/sound';

export const AzkarView: React.FC = () => {
  const [activeType, setActiveType] = useState<'morning' | 'evening'>('morning');

  // Track progress counts: key is zikr id, value is completed repeat
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('salati_azkar_counts');
    return saved ? JSON.parse(saved) : {};
  });

  const [expandedVirtue, setExpandedVirtue] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const azkarList = activeType === 'morning' ? MORNING_AZKAR : EVENING_AZKAR;

  const handleIncrement = (zikr: ZikrItem) => {
    const current = counts[zikr.id] || 0;
    if (current >= zikr.repeat) return;

    const nextVal = current + 1;
    const newCounts = { ...counts, [zikr.id]: nextVal };
    setCounts(newCounts);
    localStorage.setItem('salati_azkar_counts', JSON.stringify(newCounts));

    // Audio and haptic feedback
    soundManager.playTasbeehClick();
  };

  const handleResetAll = () => {
    if (window.confirm('هل تود إعادة تعيين عدّاد الأذكار لهذا القسم؟')) {
      const newCounts = { ...counts };
      azkarList.forEach((z) => {
        delete newCounts[z.id];
      });
      setCounts(newCounts);
      localStorage.setItem('salati_azkar_counts', JSON.stringify(newCounts));
    }
  };

  const handleCopyZikr = (zikr: ZikrItem) => {
    const text = `${zikr.text}\n(${zikr.hadith || ''})`;
    navigator.clipboard.writeText(text);
    setCopiedId(zikr.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Calculate completion percentage
  const totalAzkarCount = azkarList.length;
  const completedAzkarCount = azkarList.filter(
    (z) => (counts[z.id] || 0) >= z.repeat
  ).length;
  const progressPercent = Math.round((completedAzkarCount / totalAzkarCount) * 100);

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      {/* Top Toggle Switch */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/60 p-3 shadow-sm">
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
          <button
            onClick={() => setActiveType('morning')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeType === 'morning'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>أذكار الصباح</span>
          </button>

          <button
            onClick={() => setActiveType('evening')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeType === 'evening'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>أذكار المساء</span>
          </button>
        </div>

        {/* Progress Bar & Reset */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/40 flex items-center justify-between px-1">
          <div className="flex-1 ml-4">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>الإنجاز: {completedAzkarCount} من {totalAzkarCount}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  activeType === 'morning' ? 'bg-amber-500' : 'bg-emerald-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleResetAll}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
            title="إعادة التعيين"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Azkar List Cards */}
      <div className="space-y-3">
        {azkarList.map((zikr, index) => {
          const currentCount = counts[zikr.id] || 0;
          const isDone = currentCount >= zikr.repeat;
          const isVirtueOpen = expandedVirtue === zikr.id;

          return (
            <div
              key={zikr.id}
              className={`rounded-3xl border p-4 sm:p-5 transition-all shadow-sm ${
                isDone
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60'
                  : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/60'
              }`}
            >
              {/* Header: Number & Options */}
              <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                <span className="font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {index + 1}
                </span>

                <div className="flex items-center gap-1">
                  {zikr.virtue && (
                    <button
                      onClick={() => setExpandedVirtue(isVirtueOpen ? null : zikr.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 transition flex items-center gap-1"
                      title="فضل هذا الذكر"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">الفضل</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleCopyZikr(zikr)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    title="نسخ الذكر"
                  >
                    {copiedId === zikr.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Zikr Arabic Text */}
              <p className="font-amiri text-lg sm:text-xl text-slate-900 dark:text-slate-100 leading-relaxed select-text text-right mb-4">
                {zikr.text}
              </p>

              {/* Source/Hadith */}
              {zikr.hadith && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1">
                  <span>المصدر:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{zikr.hadith}</span>
                </div>
              )}

              {/* Virtue expansion box */}
              {isVirtueOpen && zikr.virtue && (
                <div className="mb-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 animate-fadeIn">
                  <span className="font-bold block mb-0.5">فضل الذكر:</span>
                  {zikr.virtue}
                </div>
              )}

              {/* Touch-Friendly Repetition Counter Button */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/40 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  التكرار المطلوب: <strong className="text-slate-800 dark:text-slate-200">{zikr.repeat}</strong>
                </span>

                <button
                  onClick={() => handleIncrement(zikr)}
                  disabled={isDone}
                  className={`min-w-[120px] py-2.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm ${
                    isDone
                      ? 'bg-emerald-600 text-white cursor-default'
                      : activeType === 'morning'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:brightness-105'
                      : 'bg-gradient-to-r from-emerald-700 to-teal-800 text-white hover:brightness-105'
                  }`}
                >
                  {isDone ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>تم بحمد الله</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs opacity-80">اضغط:</span>
                      <span className="text-base font-mono font-extrabold tracking-wider">
                        {currentCount} / {zikr.repeat}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
