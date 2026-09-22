import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  BookOpen, 
  ChevronRight, 
  X, 
  Volume2, 
  Square, 
  Bookmark, 
  Copy, 
  Check, 
  Minus, 
  Plus, 
  Sparkles,
  Play
} from 'lucide-react';
import { ALL_SURAHS, EMBEDDED_SURAHS, fetchFullSurah, getFullSurahSync } from '../data/quranData';
import { SurahDetail, SurahMeta } from '../types';
import { matchSurah, getSurahMatchScore } from '../utils/arabicSearch';
import { quranAudioManager, QuranAudioState } from '../utils/quranAudio';

interface QuranViewProps {
  initialFontSize?: number;
}

export const QuranView: React.FC<QuranViewProps> = ({ initialFontSize = 24 }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'meccan' | 'medinan' | 'popular'>('all');
  const [activeSurah, setActiveSurah] = useState<SurahDetail | null>(null);
  const [isLoadingSurah, setIsLoadingSurah] = useState(false);
  
  // Reader settings
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [readingMode, setReadingMode] = useState<'day' | 'sepia' | 'night'>('day');
  const [showTranslation, setShowTranslation] = useState(false);
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const [bookmarkedAyah, setBookmarkedAyah] = useState<number | null>(() => {
    const saved = localStorage.getItem('salati_quran_bookmark');
    return saved ? JSON.parse(saved).ayah : null;
  });

  // Audio recitation state synchronized with quranAudioManager
  const [audioState, setAudioState] = useState<QuranAudioState>(() => quranAudioManager.getState());

  const POPULAR_NUMBERS = [1, 18, 36, 55, 56, 67, 112, 113, 114];

  // Subscribe to audio events and stop audio on QuranView unmount (e.g. switching tabs)
  useEffect(() => {
    const unsubscribe = quranAudioManager.subscribe(setAudioState);
    return () => {
      unsubscribe();
      quranAudioManager.stop();
    };
  }, []);

  // Stop and release audio automatically whenever the surah is closed or switched
  useEffect(() => {
    return () => {
      quranAudioManager.stop();
    };
  }, [activeSurah?.number]);

  const filteredSurahs = useMemo(() => {
    const list = ALL_SURAHS.filter((s) => {
      // 1. Filter pill check (revelation type or popular)
      if (selectedFilter === 'meccan' && s.revelationType !== 'Meccan') return false;
      if (selectedFilter === 'medinan' && s.revelationType !== 'Medinan') return false;
      if (selectedFilter === 'popular' && !POPULAR_NUMBERS.includes(s.number)) return false;

      // 2. Search query match
      return matchSurah(s, searchQuery);
    });

    // Sort by match relevance when user enters a search query
    if (searchQuery.trim()) {
      list.sort((a, b) => {
        const scoreA = getSurahMatchScore(a, searchQuery);
        const scoreB = getSurahMatchScore(b, searchQuery);
        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }
        return a.number - b.number;
      });
    }

    return list;
  }, [searchQuery, selectedFilter]);

  const handleOpenSurah = (meta: SurahMeta) => {
    quranAudioManager.stop();

    // 1. Instant 0ms synchronous retrieval from pre-bundled authentic Quran data
    const instantSurah = getFullSurahSync(meta.number);
    if (instantSurah && instantSurah.ayahs && instantSurah.ayahs.length > 0) {
      setActiveSurah(instantSurah);
      return;
    }

    // 2. Fallback async fetch if not already in memory
    setIsLoadingSurah(true);
    fetchFullSurah(meta.number)
      .then((surah) => {
        if (surah) {
          setActiveSurah(surah);
        }
      })
      .finally(() => {
        setIsLoadingSurah(false);
      });
  };

  const handleCopyAyah = (ayahNumber: number, text: string) => {
    const fullText = `${text} [سورة ${activeSurah?.nameAr}: ${ayahNumber}]`;
    navigator.clipboard.writeText(fullText);
    setCopiedAyah(ayahNumber);
    setTimeout(() => setCopiedAyah(null), 2000);
  };

  const handleBookmarkAyah = (ayahNumber: number) => {
    if (!activeSurah) return;
    const bookmarkData = {
      surahNumber: activeSurah.number,
      surahName: activeSurah.nameAr,
      ayah: ayahNumber,
      date: new Date().toISOString(),
    };
    localStorage.setItem('salati_quran_bookmark', JSON.stringify(bookmarkData));
    setBookmarkedAyah(ayahNumber);
  };

  const isCurrentSurahPlaying = audioState.isPlaying && audioState.surahNumber === activeSurah?.number;
  const isCurrentSurahLoading = audioState.isLoading && audioState.surahNumber === activeSurah?.number;

  const handleToggleRecitation = () => {
    if (!activeSurah) return;

    if (isCurrentSurahPlaying || isCurrentSurahLoading) {
      quranAudioManager.stop();
    } else {
      quranAudioManager.play(activeSurah.number);
    }
  };

  const getReadingBackground = () => {
    switch (readingMode) {
      case 'sepia':
        return 'bg-[#fbf7ee] text-[#433422] border-[#ebdcc4]';
      case 'night':
        return 'bg-slate-900 text-slate-100 border-slate-800';
      case 'day':
      default:
        return 'bg-white text-slate-900 border-slate-200';
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      {/* Header & Search */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/60 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">القرآن الكريم</h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            ١١٤ سورة مباركة
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم السورة أو رقمها (مثال: الكهف، 18)..."
            className="w-full pr-10 pl-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
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

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'جميع السور' },
            { id: 'popular', label: 'السور الشائعة' },
            { id: 'meccan', label: 'مكية' },
            { id: 'medinan', label: 'مدنية' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id as typeof selectedFilter)}
              className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition ${
                selectedFilter === f.id
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Surahs List */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/40">
        {filteredSurahs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            لا توجد سورة تطابق بحثك "{searchQuery}"
          </div>
        ) : (
          filteredSurahs.map((surah) => (
            <button
              key={surah.number}
              onClick={() => handleOpenSurah(surah)}
              className="w-full p-3.5 flex items-center justify-between hover:bg-emerald-50/50 dark:hover:bg-slate-700/40 transition text-right group"
            >
              <div className="flex items-center gap-3">
                {/* Surah Number Medallion */}
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center font-bold text-emerald-800 dark:text-emerald-300 text-sm font-mono group-hover:bg-emerald-600 group-hover:text-white transition">
                  {surah.number}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 font-amiri text-lg">
                      سُورَةُ {surah.nameAr}
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        surah.revelationType === 'Meccan'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50'
                          : 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/50'
                      }`}
                    >
                      {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {surah.nameEn} • {surah.numberOfAyahs} آيات • صفحة {surah.page}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-slate-400 group-hover:text-emerald-600 transition">
                <span className="text-xs text-slate-400 hidden sm:inline">قراءة</span>
                <ChevronRight className="w-4 h-4 rotate-180" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Fullscreen Surah Reader Modal */}
      {activeSurah && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          {/* Reader Top Bar */}
          <div className="bg-emerald-900 text-white px-4 py-3 flex items-center justify-between border-b border-emerald-800 shadow-md">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  quranAudioManager.stop();
                  setActiveSurah(null);
                }}
                className="p-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 transition"
                title="رجوع"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg font-bold font-amiri">سُورَةُ {activeSurah.nameAr}</h2>
                <p className="text-[11px] text-emerald-200">
                  {activeSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {activeSurah.numberOfAyahs} آيات
                </p>
              </div>
            </div>

            {/* Audio Recitation Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleRecitation}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition shadow-sm ${
                  isCurrentSurahPlaying
                    ? 'bg-amber-400 text-slate-900 animate-pulse'
                    : isCurrentSurahLoading
                    ? 'bg-emerald-700/90 text-white cursor-wait opacity-90'
                    : 'bg-emerald-700/80 hover:bg-emerald-600 text-white border border-emerald-600/50'
                }`}
                title="تلاوة الشيخ مشاري العفاسي"
              >
                {isCurrentSurahPlaying ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>إيقاف التلاوة</span>
                  </>
                ) : isCurrentSurahLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري التحميل...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>سماع القرآن</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Reader Controls Toolbar */}
          <div className="bg-emerald-950 text-emerald-100 px-4 py-2 flex items-center justify-between text-xs border-b border-emerald-900/60">
            {/* Font size zoom */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-emerald-300 ml-1">حجم الخط:</span>
              <button
                onClick={() => setFontSize((f) => Math.max(18, f - 2))}
                className="p-1 rounded bg-emerald-900 hover:bg-emerald-800 transition"
                title="تصغير"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center font-mono">{fontSize}</span>
              <button
                onClick={() => setFontSize((f) => Math.min(38, f + 2))}
                className="p-1 rounded bg-emerald-900 hover:bg-emerald-800 transition"
                title="تكبير"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Background Mode */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setReadingMode('day')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  readingMode === 'day' ? 'bg-white text-slate-900 font-bold' : 'text-emerald-300'
                }`}
              >
                نهاري
              </button>
              <button
                onClick={() => setReadingMode('sepia')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  readingMode === 'sepia' ? 'bg-[#fbf7ee] text-[#433422] font-bold' : 'text-emerald-300'
                }`}
              >
                مريح
              </button>
              <button
                onClick={() => setReadingMode('night')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  readingMode === 'night' ? 'bg-slate-800 text-white font-bold' : 'text-emerald-300'
                }`}
              >
                ليلي
              </button>

              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className={`mr-2 px-2 py-0.5 rounded text-[11px] border ${
                  showTranslation
                    ? 'bg-amber-400 text-slate-900 border-amber-300 font-bold'
                    : 'border-emerald-800 text-emerald-300'
                }`}
              >
                الترجمة
              </button>
            </div>
          </div>

          {/* Reader Main Content */}
          <div className={`flex-1 overflow-y-auto p-4 sm:p-8 transition-colors ${getReadingBackground()}`}>
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Surah Header Banner */}
              <div className="text-center py-4 border-b border-emerald-600/20">
                <h1 className="text-3xl font-amiri font-bold mb-2">
                  سُورَةُ {activeSurah.nameAr}
                </h1>
                <p className="text-xs opacity-75">
                  آياتها {activeSurah.numberOfAyahs} • نزلت في {activeSurah.revelationType === 'Meccan' ? 'مكة المكرمة' : 'المدينة المنورة'}
                </p>
              </div>

              {/* Bismillah (except Surah 9 At-Tawbah and Surah 1 Al-Fatihah where ayah 1 is bismillah) */}
              {activeSurah.number !== 9 && activeSurah.number !== 1 && (
                <div className="text-center py-3 text-2xl sm:text-3xl font-quran text-emerald-800 dark:text-emerald-300 select-none">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>
              )}

              {/* Ayahs Display */}
              <div className="space-y-4">
                {activeSurah.ayahs.map((ayah) => {
                  const isBookmarked = bookmarkedAyah === ayah.numberInSurah;
                  return (
                    <div
                      key={ayah.numberInSurah}
                      className={`p-4 rounded-2xl border transition-all ${
                        isBookmarked
                          ? 'border-amber-400 bg-amber-500/10'
                          : 'border-transparent hover:border-emerald-500/20 hover:bg-emerald-500/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        {/* Ayah Actions */}
                        <div className="flex items-center gap-1 opacity-70 hover:opacity-100 transition" dir="ltr">
                          <button
                            onClick={() => handleCopyAyah(ayah.numberInSurah, ayah.text)}
                            className="p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition"
                            title="نسخ الآية"
                          >
                            {copiedAyah === ayah.numberInSurah ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleBookmarkAyah(ayah.numberInSurah)}
                            className={`p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition ${
                              isBookmarked ? 'text-amber-500' : ''
                            }`}
                            title="حفظ علامة القراءة"
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        {/* Ayah text */}
                        <div className="flex-1 text-right">
                          <p
                            className="font-quran leading-loose tracking-wide select-text"
                            style={{ fontSize: `${fontSize}px` }}
                          >
                            {ayah.text}{' '}
                            <span className="inline-block text-emerald-700 dark:text-emerald-400 font-bold px-1.5 text-sm select-none">
                              ۝{ayah.numberInSurah}
                            </span>
                          </p>

                          {/* English Translation if enabled */}
                          {showTranslation && ayah.translation && (
                            <p className="text-xs opacity-75 mt-2 font-sans text-left" dir="ltr">
                              {ayah.numberInSurah}. {ayah.translation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* End of Surah notice */}
              <div className="text-center py-6 text-sm opacity-60 border-t border-emerald-600/20 font-amiri">
                صدق الله العظيم • نهاية سورة {activeSurah.nameAr}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
