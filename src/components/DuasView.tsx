import React, { useState } from 'react';
import { 
  Heart, 
  Search, 
  Copy, 
  Check, 
  BookOpen, 
  Bell, 
  Compass, 
  Share2 
} from 'lucide-react';
import { DUA_CATEGORIES } from '../data/duas';
import { DuaItem } from '../types';

export const DuasView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'quranic':
        return <BookOpen className="w-4 h-4" />;
      case 'prophetic':
        return <Heart className="w-4 h-4" />;
      case 'prayer_adhan':
        return <Bell className="w-4 h-4" />;
      case 'daily_life':
      default:
        return <Compass className="w-4 h-4" />;
    }
  };

  const handleCopyDua = (dua: DuaItem) => {
    const text = `${dua.textAr}\n[${dua.reference || dua.titleAr}]`;
    navigator.clipboard.writeText(text);
    setCopiedId(dua.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Flatten and filter duas
  const allDuasWithCategory = DUA_CATEGORIES.flatMap((cat) =>
    cat.duas.map((d) => ({ ...d, categoryId: cat.id, categoryTitle: cat.titleAr }))
  );

  const filteredDuas = allDuasWithCategory.filter((d) => {
    const matchesCategory = selectedCategory === 'all' || d.categoryId === selectedCategory;
    const matchesSearch =
      d.titleAr.includes(searchQuery) ||
      d.textAr.includes(searchQuery) ||
      (d.reference && d.reference.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      {/* Header & Search Card */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/60 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">الأدعية والمناجاة</h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            مأثورات من القرآن والسنة
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في الأدعية (مثال: الاستخارة، الوالدين، السفر)..."
            className="w-full pr-10 pl-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              مسح
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            جميع الأدعية
          </button>
          {DUA_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {getCategoryIcon(cat.id)}
              <span>{cat.titleAr}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Duas List */}
      <div className="space-y-3">
        {filteredDuas.length === 0 ? (
          <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/60 p-8 text-center text-slate-400 text-sm">
            لا توجد أدعية تطابق بحثك "{searchQuery}"
          </div>
        ) : (
          filteredDuas.map((dua) => (
            <div
              key={dua.id}
              className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/60 p-4 sm:p-5 shadow-sm transition-all hover:border-amber-400/40"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50">
                  {dua.titleAr}
                </span>

                <button
                  onClick={() => handleCopyDua(dua)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  title="نسخ الدعاء"
                >
                  {copiedId === dua.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-[11px] text-emerald-500 font-bold">تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">نسخ</span>
                    </>
                  )}
                </button>
              </div>

              {/* Dua Text */}
              <p className="font-amiri text-xl text-slate-900 dark:text-slate-100 leading-loose select-text text-right mb-3">
                {dua.textAr}
              </p>

              {/* Reference */}
              {dua.reference && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/40 text-xs text-slate-400 text-right">
                  <span>المصدر: </span>
                  <span className="font-medium text-slate-600 dark:text-slate-300">{dua.reference}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
