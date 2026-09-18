/**
 * Copyright 2026 Google LLC
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { SurahMeta } from '../types';

/**
 * Normalizes Arabic text for diacritic-insensitive, hamza-insensitive,
 * and letter-variant-insensitive search matching.
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';

  return text
    // Convert Eastern Arabic/Hindi digits (٠-٩) to standard (0-9)
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    // Remove all Arabic diacritics / tashkeel / tanween / sukun / shaddah / dagger alif / tatweel / annotations
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    // Normalize all Alif forms (أ, إ, آ, ٱ) -> ا
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Ta Marbuta (ة) -> ه
    .replace(/ة/g, 'ه')
    // Normalize Alif Maqsura (ى) -> ي
    .replace(/ى/g, 'ي')
    // Normalize Hamza on Waw (ؤ) -> و
    .replace(/ؤ/g, 'و')
    // Normalize Hamza on Ya (ئ) -> ي
    .replace(/ئ/g, 'ي')
    // Normalize Persian/Urdu variants (ک -> ك, ی -> ي)
    .replace(/ک/g, 'ك')
    .replace(/ی/g, 'ي')
    // Lowercase for English queries, collapse whitespace, trim
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips common prefix/suffix forms of "سورة" / "سوره" from normalized search text
 * so that queries like "سورة الفاتحة", "سُورَةُ الْفَاتِحَةِ", or "سورة 18"
 * isolate the target surah identifier.
 */
export function stripSurahPrefix(normalizedText: string): string {
  if (!normalizedText) return '';

  return normalizedText
    // Remove "سوره" or "سورة" at the start (with or without following spaces)
    .replace(/^سوره\s*/, '')
    // Remove "سوره" or "سورة" at the end (e.g. "الفاتحه سوره")
    .replace(/\s*سوره$/, '')
    .trim();
}

/**
 * Checks whether a given surah matches a search query using normalized Arabic,
 * prefix stripping, English transliteration, and numeric IDs.
 */
export function matchSurah(
  surah: Pick<SurahMeta, 'number' | 'nameAr' | 'nameEn'>,
  query: string
): boolean {
  if (!query || !query.trim()) return true;

  const rawQuery = query.trim();
  const normQuery = normalizeArabicText(rawQuery);
  const cleanQuery = stripSurahPrefix(normQuery);

  // If user only typed "سورة" or "سوره", match all surahs
  if (normQuery === 'سوره') {
    return true;
  }

  const normNameAr = normalizeArabicText(surah.nameAr);
  const normNameArWithSurah = `سوره ${normNameAr}`;
  const normNameArWithoutAl = normNameAr.startsWith('ال') ? normNameAr.slice(2) : normNameAr;

  const normNameEn = surah.nameEn.toLowerCase();
  const surahNumStr = String(surah.number);

  // 1. Number match: exact number ("1", "18") or with leading zeros ("01", "018")
  const rawNumOnly = rawQuery.replace(/^0+/, '');
  const cleanNumOnly = cleanQuery.replace(/^0+/, '');
  if (
    surahNumStr === rawQuery ||
    surahNumStr === rawNumOnly ||
    surahNumStr === cleanQuery ||
    surahNumStr === cleanNumOnly
  ) {
    return true;
  }

  // 2. English transliteration match (e.g. "fatihah", "al-baqarah", "ali 'imran")
  if (normNameEn.includes(normQuery) || (cleanQuery && normNameEn.includes(cleanQuery))) {
    return true;
  }

  // 3. Direct normalized Arabic match (full or partial match in nameAr or "سوره [nameAr]")
  if (normNameAr.includes(normQuery) || normNameArWithSurah.includes(normQuery)) {
    return true;
  }

  // 4. Match with "سورة" stripped (e.g. "سورة الفاتحة" -> "الفاتحه")
  if (cleanQuery) {
    if (
      normNameAr.includes(cleanQuery) ||
      normNameArWithSurah.includes(cleanQuery) ||
      normNameArWithoutAl.includes(cleanQuery)
    ) {
      return true;
    }

    // 5. If clean query starts with "ال", check without "ال" (e.g. "الكهف" vs "كهف")
    if (cleanQuery.startsWith('ال')) {
      const cleanWithoutAl = cleanQuery.slice(2);
      if (cleanWithoutAl && (normNameAr.includes(cleanWithoutAl) || normNameArWithoutAl.includes(cleanWithoutAl))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculates a match score to rank exact/prefix matches ahead of partial substring matches.
 * Lower score = higher relevance.
 */
export function getSurahMatchScore(
  surah: Pick<SurahMeta, 'number' | 'nameAr' | 'nameEn'>,
  query: string
): number {
  if (!query || !query.trim()) return 0;

  const rawQuery = query.trim();
  const normQuery = normalizeArabicText(rawQuery);
  const cleanQuery = stripSurahPrefix(normQuery) || normQuery;
  const normNameAr = normalizeArabicText(surah.nameAr);
  const normNameArWithoutAl = normNameAr.startsWith('ال') ? normNameAr.slice(2) : normNameAr;

  // Exact match on surah name or name without "ال" (Highest priority: 0)
  if (normNameAr === cleanQuery || normNameArWithoutAl === cleanQuery) {
    return 0;
  }

  // Exact match on surah number (Priority: 0)
  if (String(surah.number) === cleanQuery) {
    return 0;
  }

  // Starts with clean query (Priority: 1)
  if (normNameAr.startsWith(cleanQuery) || normNameArWithoutAl.startsWith(cleanQuery)) {
    return 1;
  }

  // Contains clean query (Priority: 2)
  if (normNameAr.includes(cleanQuery)) {
    return 2;
  }

  // Other matches (English, partial with surah prefix, etc.) (Priority: 3)
  return 3;
}
