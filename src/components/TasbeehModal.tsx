import React, { useState } from 'react';
import { X, RotateCcw, Volume2, VolumeX, Sparkles, Check } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface TasbeehModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_ADHKAR = [
  { id: 'subhanallah', text: 'سُبْحَانَ اللَّهِ', target: 33 },
  { id: 'alhamdulillah', text: 'الْحَمْدُ لِلَّهِ', target: 33 },
  { id: 'allahuakbar', text: 'اللَّهُ أَكْبَرُ', target: 34 },
  { id: 'istighfar', text: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ', target: 100 },
  { id: 'tahlil', text: 'لَا إِلَهَ إِلَّا اللَّهُ', target: 100 },
  { id: 'hawqala', text: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', target: 100 },
  { id: 'salawat', text: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ', target: 100 },
];

export const TasbeehModal: React.FC<TasbeehModalProps> = ({ isOpen, onClose }) => {
  const [selectedZikrIndex, setSelectedZikrIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [totalSessionCount, setTotalSessionCount] = useState(() => {
    const saved = localStorage.getItem('salati_tasbeeh_total');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isSoundMuted, setIsSoundMuted] = useState(false);

  if (!isOpen) return null;

  const currentZikr = PRESET_ADHKAR[selectedZikrIndex];
  const target = currentZikr.target;
  const progressPercent = Math.min(100, Math.round((count / target) * 100));

  const handleTap = () => {
    const nextCount = count + 1;
    setCount(nextCount);
    const nextTotal = totalSessionCount + 1;
    setTotalSessionCount(nextTotal);
    localStorage.setItem('salati_tasbeeh_total', String(nextTotal));

    if (!isSoundMuted) {
      soundManager.playTasbeehClick();
    }
  };

  const handleResetCurrent = () => {
    setCount(0);
  };

  const handleResetTotal = () => {
    if (window.confirm('هل تود تصفير المجموع الكلي للتسبيح؟')) {
      setCount(0);
      setTotalSessionCount(0);
      localStorage.setItem('salati_tasbeeh_total', '0');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-gradient-to-b from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-3xl border border-emerald-700/50 shadow-2xl p-5 flex flex-col relative overflow-hidden">
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between pb-3 border-b border-emerald-800/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-base font-tajawal">السبحة الإلكترونية</h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsSoundMuted(!isSoundMuted)}
              className="p-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 transition"
              title={isSoundMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
            >
              {isSoundMuted ? <VolumeX className="w-4 h-4 text-red-300" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 transition"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="relative z-10 my-3">
          <label className="text-[11px] text-emerald-300 font-medium block mb-1.5 text-right">
            اختر الذكر المفضل:
          </label>
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
            {PRESET_ADHKAR.map((preset, idx) => (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedZikrIndex(idx);
                  setCount(0);
                }}
                className={`px-3 py-1.5 rounded-xl font-amiri text-sm whitespace-nowrap transition border ${
                  selectedZikrIndex === idx
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                    : 'bg-emerald-900/40 text-emerald-200 border-emerald-700/40 hover:bg-emerald-800/40'
                }`}
              >
                {preset.text}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Zikr Calligraphy Display */}
        <div className="relative z-10 text-center my-2 p-3 rounded-2xl bg-emerald-900/40 border border-emerald-700/40">
          <h3 className="font-amiri text-2xl font-bold text-amber-300 leading-relaxed drop-shadow-sm">
            {currentZikr.text}
          </h3>
          <p className="text-[11px] text-emerald-300 mt-1">
            الهدف المستحب: {target} مرة
          </p>
        </div>

        {/* Massive Touch Counter Button */}
        <div className="relative z-10 flex flex-col items-center justify-center my-4">
          <button
            onClick={handleTap}
            className="w-44 h-44 rounded-full bg-gradient-to-tr from-emerald-800 via-teal-700 to-emerald-600 border-4 border-amber-400/40 shadow-[0_0_40px_rgba(16,185,129,0.3)] active:scale-95 transition-all flex flex-col items-center justify-center text-center select-none cursor-pointer group hover:border-amber-400"
          >
            <span className="text-4xl font-extrabold font-mono tracking-tight text-white group-hover:scale-105 transition">
              {count}
            </span>
            <span className="text-xs text-amber-200 font-medium mt-1">
              اضغط للتسبيح
            </span>
            <span className="text-[10px] text-emerald-200/70 mt-0.5">
              ({progressPercent}%)
            </span>
          </button>
        </div>

        {/* Controls and Total session count */}
        <div className="relative z-10 pt-3 border-t border-emerald-800/60 flex items-center justify-between text-xs">
          <div>
            <span className="text-emerald-300 block text-[10px]">المجموع الكلي</span>
            <span className="font-mono font-bold text-amber-300 text-sm">
              {totalSessionCount} تسبيحة
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetCurrent}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 border border-emerald-700/50 text-emerald-200 flex items-center gap-1 transition"
              title="تصفير الدورة الحالية"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تصفير</span>
            </button>
            <button
              onClick={handleResetTotal}
              className="px-2.5 py-1.5 rounded-xl bg-red-900/30 hover:bg-red-900/50 border border-red-800/50 text-red-300 transition"
              title="تصفير الكل"
            >
              مسح الكل
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
