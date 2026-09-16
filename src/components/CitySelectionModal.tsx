/**
 * Copyright 2026 Google LLC
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, X, Check } from 'lucide-react';
import { CITIES } from '../data/cities';
import { CityData } from '../types';

// Fast Arabic text normalizer
const normalizeSearchText = (text: string): string => {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '');
};

interface SearchableCity {
  city: CityData;
  normNameAr: string;
  normNameEn: string;
  normCountryAr: string;
  normCountryEn: string;
}

// Pre-compute normalized representations once at module load to avoid heavy regex in render loops
const PREPARED_CITIES: SearchableCity[] = CITIES.map((c) => ({
  city: c,
  normNameAr: normalizeSearchText(c.nameAr),
  normNameEn: (c.nameEn || '').toLowerCase(),
  normCountryAr: normalizeSearchText(c.countryAr || ''),
  normCountryEn: (c.countryEn || '').toLowerCase(),
}));

interface CityRowProps {
  city: CityData;
  isSelected: boolean;
  onSelect: (city: CityData) => void;
}

// Memoize individual city row to prevent re-rendering the entire list on every keystroke
const CityRow = React.memo<CityRowProps>(({ city, isSelected, onSelect }) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(city)}
      className={`w-full py-3 px-3 flex items-center justify-between hover:bg-emerald-50/60 dark:hover:bg-slate-800 transition rounded-xl text-right ${
        isSelected ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold' : ''
      }`}
    >
      <div>
        <span className="font-bold text-sm block">{city.nameAr}</span>
        <span className="text-xs text-slate-400">{city.countryAr} • {city.nameEn}</span>
      </div>
      {isSelected && (
        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      )}
    </button>
  );
});

CityRow.displayName = 'CityRow';

interface CitySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCityId: string;
  onSelectCity: (city: CityData) => void;
}

export const CitySelectionModal: React.FC<CitySelectionModalProps> = React.memo(({
  isOpen,
  onClose,
  currentCityId,
  onSelectCity,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(30);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus and reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setVisibleCount(30);
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset pagination on query change
  useEffect(() => {
    setVisibleCount(30);
  }, [searchQuery]);

  const normalizedQuery = useMemo(() => {
    return normalizeSearchText(searchQuery);
  }, [searchQuery]);

  // Ultra-fast linear filter & priority ranking using pre-computed fields
  const filteredCities = useMemo(() => {
    if (!normalizedQuery) {
      return CITIES;
    }
    const q = normalizedQuery;
    const exactMatches: CityData[] = [];
    const startsWithMatches: CityData[] = [];
    const containsCityMatches: CityData[] = [];
    const countryMatches: CityData[] = [];

    for (let i = 0; i < PREPARED_CITIES.length; i++) {
      const item = PREPARED_CITIES[i];
      const { city, normNameAr, normNameEn, normCountryAr, normCountryEn } = item;

      if (normNameAr === q || normNameEn === q) {
        exactMatches.push(city);
      } else if (normNameAr.startsWith(q) || normNameEn.startsWith(q)) {
        startsWithMatches.push(city);
      } else if (normNameAr.includes(q) || normNameEn.includes(q)) {
        containsCityMatches.push(city);
      } else if (q.length >= 2 && (normCountryAr.includes(q) || normCountryEn.includes(q))) {
        countryMatches.push(city);
      }
    }

    return [
      ...exactMatches,
      ...startsWithMatches,
      ...containsCityMatches,
      ...countryMatches,
    ];
  }, [normalizedQuery]);

  // Render a slice of cities to keep DOM rendering instant on mobile/low-end devices
  const displayedCities = useMemo(() => {
    return filteredCities.slice(0, visibleCount);
  }, [filteredCities, visibleCount]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 80) {
      setVisibleCount((prev) => Math.min(prev + 30, filteredCities.length));
    }
  };

  const handleCitySelect = useCallback((city: CityData) => {
    onSelectCity(city);
    onClose();
  }, [onSelectCity, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-5 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-base font-tajawal">اختر مدينتك</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="my-3 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
          <input
            id="city-search-input"
            name="citySearch"
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            onCompositionEnd={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            placeholder="ابحث عن مدينة أو دولة..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="w-full pr-10 pl-9 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition"
            style={{ color: 'inherit' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-lg transition"
              aria-label="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Cities List */}
        <div
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1"
        >
          {displayedCities.map((city) => (
            <CityRow
              key={city.id}
              city={city}
              isSelected={currentCityId === city.id}
              onSelect={handleCitySelect}
            />
          ))}

          {filteredCities.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs font-tajawal">
              لم يتم العثور على مدينة مطابقة لبحثك
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

CitySelectionModal.displayName = 'CitySelectionModal';
