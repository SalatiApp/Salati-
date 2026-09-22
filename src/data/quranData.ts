import { SurahDetail, SurahMeta, AyahItem } from '../types';
import quranAllData from './quran_all.json';

export const ALL_SURAHS: SurahMeta[] = [
  { number: 1, nameAr: 'الفَاتِحَة', nameEn: 'Al-Fatihah', englishTranslation: 'The Opening', numberOfAyahs: 7, revelationType: 'Meccan', page: 1 },
  { number: 2, nameAr: 'البَقَرَة', nameEn: 'Al-Baqarah', englishTranslation: 'The Cow', numberOfAyahs: 286, revelationType: 'Medinan', page: 2 },
  { number: 3, nameAr: 'آل عِمْرَان', nameEn: 'Ali \'Imran', englishTranslation: 'Family of Imran', numberOfAyahs: 200, revelationType: 'Medinan', page: 50 },
  { number: 4, nameAr: 'النِّسَاء', nameEn: 'An-Nisa', englishTranslation: 'The Women', numberOfAyahs: 176, revelationType: 'Medinan', page: 77 },
  { number: 5, nameAr: 'المَائِدَة', nameEn: 'Al-Ma\'idah', englishTranslation: 'The Table Spread', numberOfAyahs: 120, revelationType: 'Medinan', page: 106 },
  { number: 6, nameAr: 'الأَنْعَام', nameEn: 'Al-An\'am', englishTranslation: 'The Cattle', numberOfAyahs: 165, revelationType: 'Meccan', page: 128 },
  { number: 7, nameAr: 'الأَعْرَاف', nameEn: 'Al-A\'raf', englishTranslation: 'The Heights', numberOfAyahs: 206, revelationType: 'Meccan', page: 151 },
  { number: 8, nameAr: 'الأَنْفَال', nameEn: 'Al-Anfal', englishTranslation: 'The Spoils of War', numberOfAyahs: 75, revelationType: 'Medinan', page: 177 },
  { number: 9, nameAr: 'التَّوْبَة', nameEn: 'At-Tawbah', englishTranslation: 'The Repentance', numberOfAyahs: 129, revelationType: 'Medinan', page: 187 },
  { number: 10, nameAr: 'يُونُس', nameEn: 'Yunus', englishTranslation: 'Jonah', numberOfAyahs: 109, revelationType: 'Meccan', page: 208 },
  { number: 11, nameAr: 'هُود', nameEn: 'Hud', englishTranslation: 'Hud', numberOfAyahs: 123, revelationType: 'Meccan', page: 221 },
  { number: 12, nameAr: 'يُوسُف', nameEn: 'Yusuf', englishTranslation: 'Joseph', numberOfAyahs: 111, revelationType: 'Meccan', page: 235 },
  { number: 13, nameAr: 'الرَّعْد', nameEn: 'Ar-Ra\'d', englishTranslation: 'The Thunder', numberOfAyahs: 43, revelationType: 'Medinan', page: 249 },
  { number: 14, nameAr: 'إِبْرَاهِيم', nameEn: 'Ibrahim', englishTranslation: 'Abraham', numberOfAyahs: 52, revelationType: 'Meccan', page: 255 },
  { number: 15, nameAr: 'الحِجْر', nameEn: 'Al-Hijr', englishTranslation: 'The Rocky Tract', numberOfAyahs: 99, revelationType: 'Meccan', page: 262 },
  { number: 16, nameAr: 'النَّحْل', nameEn: 'An-Nahl', englishTranslation: 'The Bee', numberOfAyahs: 128, revelationType: 'Meccan', page: 267 },
  { number: 17, nameAr: 'الإِسْرَاء', nameEn: 'Al-Isra', englishTranslation: 'The Night Journey', numberOfAyahs: 111, revelationType: 'Meccan', page: 282 },
  { number: 18, nameAr: 'الكَهْف', nameEn: 'Al-Kahf', englishTranslation: 'The Cave', numberOfAyahs: 110, revelationType: 'Meccan', page: 293 },
  { number: 19, nameAr: 'مَرْيَم', nameEn: 'Maryam', englishTranslation: 'Mary', numberOfAyahs: 98, revelationType: 'Meccan', page: 305 },
  { number: 20, nameAr: 'طه', nameEn: 'Ta-Ha', englishTranslation: 'Ta-Ha', numberOfAyahs: 135, revelationType: 'Meccan', page: 312 },
  { number: 21, nameAr: 'الأَنْبِيَاء', nameEn: 'Al-Anbiya', englishTranslation: 'The Prophets', numberOfAyahs: 112, revelationType: 'Meccan', page: 322 },
  { number: 22, nameAr: 'الحَجّ', nameEn: 'Al-Hajj', englishTranslation: 'The Pilgrimage', numberOfAyahs: 78, revelationType: 'Medinan', page: 332 },
  { number: 23, nameAr: 'المُؤْمِنُون', nameEn: 'Al-Mu\'minun', englishTranslation: 'The Believers', numberOfAyahs: 118, revelationType: 'Meccan', page: 342 },
  { number: 24, nameAr: 'النُّور', nameEn: 'An-Nur', englishTranslation: 'The Light', numberOfAyahs: 64, revelationType: 'Medinan', page: 350 },
  { number: 25, nameAr: 'الفُرْقَان', nameEn: 'Al-Furqan', englishTranslation: 'The Criterion', numberOfAyahs: 77, revelationType: 'Meccan', page: 359 },
  { number: 26, nameAr: 'الشُّعَرَاء', nameEn: 'Ash-Shu\'ara', englishTranslation: 'The Poets', numberOfAyahs: 227, revelationType: 'Meccan', page: 367 },
  { number: 27, nameAr: 'النَّمْل', nameEn: 'An-Naml', englishTranslation: 'The Ant', numberOfAyahs: 93, revelationType: 'Meccan', page: 377 },
  { number: 28, nameAr: 'القَصَص', nameEn: 'Al-Qasas', englishTranslation: 'The Stories', numberOfAyahs: 88, revelationType: 'Meccan', page: 385 },
  { number: 29, nameAr: 'العَنْكَبُوت', nameEn: 'Al-\'Ankabut', englishTranslation: 'The Spider', numberOfAyahs: 69, revelationType: 'Meccan', page: 396 },
  { number: 30, nameAr: 'الرُّوم', nameEn: 'Ar-Rum', englishTranslation: 'The Romans', numberOfAyahs: 60, revelationType: 'Meccan', page: 404 },
  { number: 31, nameAr: 'لُقْمَان', nameEn: 'Luqman', englishTranslation: 'Luqman', numberOfAyahs: 34, revelationType: 'Meccan', page: 411 },
  { number: 32, nameAr: 'السَّجْدَة', nameEn: 'As-Sajdah', englishTranslation: 'The Prostration', numberOfAyahs: 30, revelationType: 'Meccan', page: 415 },
  { number: 33, nameAr: 'الأَحْزَاب', nameEn: 'Al-Ahzab', englishTranslation: 'The Combined Forces', numberOfAyahs: 73, revelationType: 'Medinan', page: 418 },
  { number: 34, nameAr: 'سَبَأ', nameEn: 'Saba', englishTranslation: 'Sheba', numberOfAyahs: 54, revelationType: 'Meccan', page: 428 },
  { number: 35, nameAr: 'فَاطِر', nameEn: 'Fatir', englishTranslation: 'Originator', numberOfAyahs: 45, revelationType: 'Meccan', page: 434 },
  { number: 36, nameAr: 'يس', nameEn: 'Ya-Sin', englishTranslation: 'Ya Sin', numberOfAyahs: 83, revelationType: 'Meccan', page: 440 },
  { number: 37, nameAr: 'الصَّافَّات', nameEn: 'As-Saffat', englishTranslation: 'Those who set the Ranks', numberOfAyahs: 182, revelationType: 'Meccan', page: 446 },
  { number: 38, nameAr: 'ص', nameEn: 'Sad', englishTranslation: 'The Letter Sad', numberOfAyahs: 88, revelationType: 'Meccan', page: 453 },
  { number: 39, nameAr: 'الزُّمَر', nameEn: 'Az-Zumar', englishTranslation: 'The Troops', numberOfAyahs: 75, revelationType: 'Meccan', page: 458 },
  { number: 40, nameAr: 'غَافِر', nameEn: 'Ghafir', englishTranslation: 'The Forgiver', numberOfAyahs: 85, revelationType: 'Meccan', page: 467 },
  { number: 41, nameAr: 'فُصِّلَت', nameEn: 'Fussilat', englishTranslation: 'Explained in Detail', numberOfAyahs: 54, revelationType: 'Meccan', page: 477 },
  { number: 42, nameAr: 'الشُّورَى', nameEn: 'Ash-Shura', englishTranslation: 'The Consultation', numberOfAyahs: 53, revelationType: 'Meccan', page: 483 },
  { number: 43, nameAr: 'الزُّخْرُف', nameEn: 'Az-Zukhruf', englishTranslation: 'The Ornaments of Gold', numberOfAyahs: 89, revelationType: 'Meccan', page: 489 },
  { number: 44, nameAr: 'الدُّخَان', nameEn: 'Ad-Dukhan', englishTranslation: 'The Smoke', numberOfAyahs: 59, revelationType: 'Meccan', page: 496 },
  { number: 45, nameAr: 'الجَاثِيَة', nameEn: 'Al-Jathiyah', englishTranslation: 'The Crouching', numberOfAyahs: 37, revelationType: 'Meccan', page: 499 },
  { number: 46, nameAr: 'الأَحْقَاف', nameEn: 'Al-Ahqaf', englishTranslation: 'The Wind-Curved Sandhills', numberOfAyahs: 35, revelationType: 'Meccan', page: 502 },
  { number: 47, nameAr: 'مُحَمَّد', nameEn: 'Muhammad', englishTranslation: 'Muhammad', numberOfAyahs: 38, revelationType: 'Medinan', page: 507 },
  { number: 48, nameAr: 'الفَتْح', nameEn: 'Al-Fath', englishTranslation: 'The Victory', numberOfAyahs: 29, revelationType: 'Medinan', page: 511 },
  { number: 49, nameAr: 'الحُجُرَات', nameEn: 'Al-Hujurat', englishTranslation: 'The Rooms', numberOfAyahs: 18, revelationType: 'Medinan', page: 515 },
  { number: 50, nameAr: 'ق', nameEn: 'Qaf', englishTranslation: 'The Letter Qaf', numberOfAyahs: 45, revelationType: 'Meccan', page: 518 },
  { number: 51, nameAr: 'الذَّارِيَات', nameEn: 'Adh-Dhariyat', englishTranslation: 'The Winnowing Winds', numberOfAyahs: 60, revelationType: 'Meccan', page: 520 },
  { number: 52, nameAr: 'الطُّور', nameEn: 'At-Tur', englishTranslation: 'The Mount', numberOfAyahs: 49, revelationType: 'Meccan', page: 523 },
  { number: 53, nameAr: 'النَّجْم', nameEn: 'An-Najm', englishTranslation: 'The Star', numberOfAyahs: 62, revelationType: 'Meccan', page: 526 },
  { number: 54, nameAr: 'القَمَر', nameEn: 'Al-Qamar', englishTranslation: 'The Moon', numberOfAyahs: 55, revelationType: 'Meccan', page: 528 },
  { number: 55, nameAr: 'الرَّحْمَن', nameEn: 'Ar-Rahman', englishTranslation: 'The Beneficent', numberOfAyahs: 78, revelationType: 'Medinan', page: 531 },
  { number: 56, nameAr: 'الوَاقِعَة', nameEn: 'Al-Waqi\'ah', englishTranslation: 'The Inevitable', numberOfAyahs: 96, revelationType: 'Meccan', page: 534 },
  { number: 57, nameAr: 'الحَدِيد', nameEn: 'Al-Hadid', englishTranslation: 'The Iron', numberOfAyahs: 29, revelationType: 'Medinan', page: 537 },
  { number: 58, nameAr: 'المُجَادِلَة', nameEn: 'Al-Mujadila', englishTranslation: 'The Pleading Woman', numberOfAyahs: 22, revelationType: 'Medinan', page: 542 },
  { number: 59, nameAr: 'الحَشْر', nameEn: 'Al-Hashr', englishTranslation: 'The Exile', numberOfAyahs: 24, revelationType: 'Medinan', page: 545 },
  { number: 60, nameAr: 'المُمْتَحَنَة', nameEn: 'Al-Mumtahanah', englishTranslation: 'She that is to be examined', numberOfAyahs: 13, revelationType: 'Medinan', page: 549 },
  { number: 61, nameAr: 'الصَّفّ', nameEn: 'As-Saff', englishTranslation: 'The Ranks', numberOfAyahs: 14, revelationType: 'Medinan', page: 551 },
  { number: 62, nameAr: 'الجُمُعَة', nameEn: 'Al-Jumu\'ah', englishTranslation: 'The Congregation, Friday', numberOfAyahs: 11, revelationType: 'Medinan', page: 553 },
  { number: 63, nameAr: 'المُنَافِقُون', nameEn: 'Al-Munafiqun', englishTranslation: 'The Hypocrites', numberOfAyahs: 11, revelationType: 'Medinan', page: 554 },
  { number: 64, nameAr: 'التَّغَابُن', nameEn: 'At-Taghabun', englishTranslation: 'The Mutual Disillusion', numberOfAyahs: 18, revelationType: 'Medinan', page: 556 },
  { number: 65, nameAr: 'الطَّلَاق', nameEn: 'At-Talaq', englishTranslation: 'The Divorce', numberOfAyahs: 12, revelationType: 'Medinan', page: 558 },
  { number: 66, nameAr: 'التَّحْرِيم', nameEn: 'At-Tahrim', englishTranslation: 'The Prohibition', numberOfAyahs: 12, revelationType: 'Medinan', page: 560 },
  { number: 67, nameAr: 'المُلْك', nameEn: 'Al-Mulk', englishTranslation: 'The Sovereignty', numberOfAyahs: 30, revelationType: 'Meccan', page: 562 },
  { number: 68, nameAr: 'القَلَم', nameEn: 'Al-Qalam', englishTranslation: 'The Pen', numberOfAyahs: 52, revelationType: 'Meccan', page: 564 },
  { number: 69, nameAr: 'الحَاقَّة', nameEn: 'Al-Haqqah', englishTranslation: 'The Reality', numberOfAyahs: 52, revelationType: 'Meccan', page: 566 },
  { number: 70, nameAr: 'المَعَارِج', nameEn: 'Al-Ma\'arij', englishTranslation: 'The Ascending Stairways', numberOfAyahs: 44, revelationType: 'Meccan', page: 568 },
  { number: 71, nameAr: 'نُوح', nameEn: 'Nuh', englishTranslation: 'Noah', numberOfAyahs: 28, revelationType: 'Meccan', page: 570 },
  { number: 72, nameAr: 'الجِنّ', nameEn: 'Al-Jinn', englishTranslation: 'The Jinn', numberOfAyahs: 28, revelationType: 'Meccan', page: 572 },
  { number: 73, nameAr: 'المُزَّمِّل', nameEn: 'Al-Muzzammil', englishTranslation: 'The Enshrouded One', numberOfAyahs: 20, revelationType: 'Meccan', page: 574 },
  { number: 74, nameAr: 'المُدَّثِّر', nameEn: 'Al-Muddaththir', englishTranslation: 'The Cloaked One', numberOfAyahs: 56, revelationType: 'Meccan', page: 575 },
  { number: 75, nameAr: 'القِيَامَة', nameEn: 'Al-Qiyamah', englishTranslation: 'The Resurrection', numberOfAyahs: 40, revelationType: 'Meccan', page: 577 },
  { number: 76, nameAr: 'الإِنْسَان', nameEn: 'Al-Insan', englishTranslation: 'The Man', numberOfAyahs: 31, revelationType: 'Medinan', page: 578 },
  { number: 77, nameAr: 'المُرْسَلَات', nameEn: 'Al-Mursalat', englishTranslation: 'The Emissaries', numberOfAyahs: 50, revelationType: 'Meccan', page: 580 },
  { number: 78, nameAr: 'النَّبَأ', nameEn: 'An-Naba', englishTranslation: 'The Tidings', numberOfAyahs: 40, revelationType: 'Meccan', page: 582 },
  { number: 79, nameAr: 'النَّازِعَات', nameEn: 'An-Nazi\'at', englishTranslation: 'Those who drag forth', numberOfAyahs: 46, revelationType: 'Meccan', page: 583 },
  { number: 80, nameAr: 'عَبَسَ', nameEn: '\'Abasa', englishTranslation: 'He Frowned', numberOfAyahs: 42, revelationType: 'Meccan', page: 585 },
  { number: 81, nameAr: 'التَّكْوِير', nameEn: 'At-Takwir', englishTranslation: 'The Overthrowing', numberOfAyahs: 29, revelationType: 'Meccan', page: 586 },
  { number: 82, nameAr: 'الانْفِطَار', nameEn: 'Al-Infitar', englishTranslation: 'The Cleaving', numberOfAyahs: 19, revelationType: 'Meccan', page: 587 },
  { number: 83, nameAr: 'المُطَفِّفِين', nameEn: 'Al-Mutaffifin', englishTranslation: 'The Defrauding', numberOfAyahs: 36, revelationType: 'Meccan', page: 587 },
  { number: 84, nameAr: 'الانْشِقَاق', nameEn: 'Al-Inshiqaq', englishTranslation: 'The Splitting Open', numberOfAyahs: 25, revelationType: 'Meccan', page: 589 },
  { number: 85, nameAr: 'البُرُوج', nameEn: 'Al-Buruj', englishTranslation: 'The Mansions of the Stars', numberOfAyahs: 22, revelationType: 'Meccan', page: 590 },
  { number: 86, nameAr: 'الطَّارِق', nameEn: 'At-Tariq', englishTranslation: 'The Morning Star', numberOfAyahs: 17, revelationType: 'Meccan', page: 591 },
  { number: 87, nameAr: 'الأَعْلَى', nameEn: 'Al-A\'la', englishTranslation: 'The Most High', numberOfAyahs: 19, revelationType: 'Meccan', page: 591 },
  { number: 88, nameAr: 'الغَاشِيَة', nameEn: 'Al-Ghashiyah', englishTranslation: 'The Overwhelming', numberOfAyahs: 26, revelationType: 'Meccan', page: 592 },
  { number: 89, nameAr: 'الفَجْر', nameEn: 'Al-Fajr', englishTranslation: 'The Dawn', numberOfAyahs: 30, revelationType: 'Meccan', page: 593 },
  { number: 90, nameAr: 'البَلَد', nameEn: 'Al-Balad', englishTranslation: 'The City', numberOfAyahs: 20, revelationType: 'Meccan', page: 594 },
  { number: 91, nameAr: 'الشَّمْس', nameEn: 'Ash-Shams', englishTranslation: 'The Sun', numberOfAyahs: 15, revelationType: 'Meccan', page: 595 },
  { number: 92, nameAr: 'اللَّيْل', nameEn: 'Al-Layl', englishTranslation: 'The Night', numberOfAyahs: 21, revelationType: 'Meccan', page: 595 },
  { number: 93, nameAr: 'الضُّحَى', nameEn: 'Ad-Duha', englishTranslation: 'The Morning Hours', numberOfAyahs: 11, revelationType: 'Meccan', page: 596 },
  { number: 94, nameAr: 'الشَّرْح', nameEn: 'Ash-Sharh', englishTranslation: 'The Relief', numberOfAyahs: 8, revelationType: 'Meccan', page: 596 },
  { number: 95, nameAr: 'التِّين', nameEn: 'At-Tin', englishTranslation: 'The Fig', numberOfAyahs: 8, revelationType: 'Meccan', page: 597 },
  { number: 96, nameAr: 'العَلَق', nameEn: 'Al-\'Alaq', englishTranslation: 'The Clot', numberOfAyahs: 19, revelationType: 'Meccan', page: 597 },
  { number: 97, nameAr: 'القَدْر', nameEn: 'Al-Qadr', englishTranslation: 'The Power', numberOfAyahs: 5, revelationType: 'Meccan', page: 598 },
  { number: 98, nameAr: 'البَيِّنَة', nameEn: 'Al-Bayyinah', englishTranslation: 'The Clear Proof', numberOfAyahs: 8, revelationType: 'Medinan', page: 598 },
  { number: 99, nameAr: 'الزَّلْزَلَة', nameEn: 'Az-Zalzalah', englishTranslation: 'The Earthquake', numberOfAyahs: 8, revelationType: 'Medinan', page: 599 },
  { number: 100, nameAr: 'العَادِيَات', nameEn: 'Al-\'Adiyat', englishTranslation: 'The Courser', numberOfAyahs: 11, revelationType: 'Meccan', page: 599 },
  { number: 101, nameAr: 'القَارِعَة', nameEn: 'Al-Qari\'ah', englishTranslation: 'The Calamity', numberOfAyahs: 11, revelationType: 'Meccan', page: 600 },
  { number: 102, nameAr: 'التَّكَاثُر', nameEn: 'At-Takathur', englishTranslation: 'The Rivalry in World Increase', numberOfAyahs: 8, revelationType: 'Meccan', page: 600 },
  { number: 103, nameAr: 'العَصْر', nameEn: 'Al-\'Asr', englishTranslation: 'The Declining Day', numberOfAyahs: 3, revelationType: 'Meccan', page: 601 },
  { number: 104, nameAr: 'الهُمَزَة', nameEn: 'Al-Humazah', englishTranslation: 'The Traducer', numberOfAyahs: 9, revelationType: 'Meccan', page: 601 },
  { number: 105, nameAr: 'الفِيل', nameEn: 'Al-Fil', englishTranslation: 'The Elephant', numberOfAyahs: 5, revelationType: 'Meccan', page: 601 },
  { number: 106, nameAr: 'قُرَيْش', nameEn: 'Quraysh', englishTranslation: 'Quraysh', numberOfAyahs: 4, revelationType: 'Meccan', page: 602 },
  { number: 107, nameAr: 'المَاعُون', nameEn: 'Al-Ma\'un', englishTranslation: 'The Small Kindness', numberOfAyahs: 7, revelationType: 'Meccan', page: 602 },
  { number: 108, nameAr: 'الكَوْثَر', nameEn: 'Al-Kawthar', englishTranslation: 'The Abundance', numberOfAyahs: 3, revelationType: 'Meccan', page: 602 },
  { number: 109, nameAr: 'الكَافِرُون', nameEn: 'Al-Kafirun', englishTranslation: 'The Disbelievers', numberOfAyahs: 6, revelationType: 'Meccan', page: 603 },
  { number: 110, nameAr: 'النَّصْر', nameEn: 'An-Nasr', englishTranslation: 'The Divine Support', numberOfAyahs: 3, revelationType: 'Medinan', page: 603 },
  { number: 111, nameAr: 'المَسَد', nameEn: 'Al-Masad', englishTranslation: 'The Palm Fiber', numberOfAyahs: 5, revelationType: 'Meccan', page: 603 },
  { number: 112, nameAr: 'الإِخْلَاص', nameEn: 'Al-Ikhlas', englishTranslation: 'The Sincerity', numberOfAyahs: 4, revelationType: 'Meccan', page: 604 },
  { number: 113, nameAr: 'الفَلَق', nameEn: 'Al-Falaq', englishTranslation: 'The Daybreak', numberOfAyahs: 5, revelationType: 'Meccan', page: 604 },
  { number: 114, nameAr: 'النَّاس', nameEn: 'An-Nas', englishTranslation: 'Mankind', numberOfAyahs: 6, revelationType: 'Meccan', page: 604 },
];

// Embedded verified authentic Surahs for instant offline reading
export const EMBEDDED_SURAHS: Record<number, SurahDetail> = {
  // Surah Al-Fatihah
  1: {
    number: 1,
    nameAr: 'الفَاتِحَة',
    nameEn: 'Al-Fatihah',
    englishTranslation: 'The Opening',
    numberOfAyahs: 7,
    revelationType: 'Meccan',
    page: 1,
    ayahs: [
      { numberInSurah: 1, text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.' },
      { numberInSurah: 2, text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', translation: '[All] praise is [due] to Allah, Lord of the worlds.' },
      { numberInSurah: 3, text: 'الرَّحْمَٰنِ الرَّحِيمِ', translation: 'The Entirely Merciful, the Especially Merciful.' },
      { numberInSurah: 4, text: 'مَالِكِ يَوْمِ الدِّينِ', translation: 'Sovereign of the Day of Recompense.' },
      { numberInSurah: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', translation: 'It is You we worship and You we ask for help.' },
      { numberInSurah: 6, text: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', translation: 'Guide us to the straight path.' },
      { numberInSurah: 7, text: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', translation: 'The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.' },
    ],
  },
  // Surah Al-Ikhlas
  112: {
    number: 112,
    nameAr: 'الإِخْلَاص',
    nameEn: 'Al-Ikhlas',
    englishTranslation: 'The Sincerity',
    numberOfAyahs: 4,
    revelationType: 'Meccan',
    page: 604,
    ayahs: [
      { numberInSurah: 1, text: 'قُلْ هُوَ اللَّهُ أَحَدٌ', translation: 'Say, "He is Allah, [who is] One,' },
      { numberInSurah: 2, text: 'اللَّهُ الصَّمَدُ', translation: 'Allah, the Eternal Refuge.' },
      { numberInSurah: 3, text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', translation: 'He neither begets nor is born,' },
      { numberInSurah: 4, text: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ', translation: 'Nor is there to Him any equivalent."' },
    ],
  },
  // Surah Al-Falaq
  113: {
    number: 113,
    nameAr: 'الفَلَق',
    nameEn: 'Al-Falaq',
    englishTranslation: 'The Daybreak',
    numberOfAyahs: 5,
    revelationType: 'Meccan',
    page: 604,
    ayahs: [
      { numberInSurah: 1, text: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', translation: 'Say, "I seek refuge in the Lord of daybreak' },
      { numberInSurah: 2, text: 'مِن شَرِّ مَا خَلَقَ', translation: 'From the evil of that which He created' },
      { numberInSurah: 3, text: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', translation: 'And from the evil of darkness when it settles' },
      { numberInSurah: 4, text: 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ', translation: 'And from the evil of the blowers in knots' },
      { numberInSurah: 5, text: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ', translation: 'And from the evil of an envier when he envies."' },
    ],
  },
  // Surah An-Nas
  114: {
    number: 114,
    nameAr: 'النَّاس',
    nameEn: 'An-Nas',
    englishTranslation: 'Mankind',
    numberOfAyahs: 6,
    revelationType: 'Meccan',
    page: 604,
    ayahs: [
      { numberInSurah: 1, text: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', translation: 'Say, "I seek refuge in the Lord of mankind,' },
      { numberInSurah: 2, text: 'مَلِكِ النَّاسِ', translation: 'The Sovereign of mankind.' },
      { numberInSurah: 3, text: 'إِلَٰهِ النَّاسِ', translation: 'The God of mankind,' },
      { numberInSurah: 4, text: 'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ', translation: 'From the evil of the retreating whisperer -' },
      { numberInSurah: 5, text: 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ', translation: 'Who whispers [evil] into the breasts of mankind -' },
      { numberInSurah: 6, text: 'مِنَ الْجِنَّةِ وَالنَّاسِ', translation: 'From among the jinn and mankind."' },
    ],
  },
  // Surah Al-Kawthar
  108: {
    number: 108,
    nameAr: 'الكَوْثَر',
    nameEn: 'Al-Kawthar',
    englishTranslation: 'The Abundance',
    numberOfAyahs: 3,
    revelationType: 'Meccan',
    page: 602,
    ayahs: [
      { numberInSurah: 1, text: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ', translation: 'Indeed, We have granted you, [O Muhammad], al-Kawthar.' },
      { numberInSurah: 2, text: 'فَصَلِّ لِرَبِّكَ وَانْحَرْ', translation: 'So pray to your Lord and sacrifice [to Him alone].' },
      { numberInSurah: 3, text: 'إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ', translation: 'Indeed, your enemy is the one cut off.' },
    ],
  },
  // Surah Al-Asr
  103: {
    number: 103,
    nameAr: 'العَصْر',
    nameEn: 'Al-\'Asr',
    englishTranslation: 'The Declining Day',
    numberOfAyahs: 3,
    revelationType: 'Meccan',
    page: 601,
    ayahs: [
      { numberInSurah: 1, text: 'وَالْعَصْرِ', translation: 'By time,' },
      { numberInSurah: 2, text: 'إِنَّ الْإِنسَانَ لَفِي خُسْرٍ', translation: 'Indeed, mankind is in loss,' },
      { numberInSurah: 3, text: 'إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ', translation: 'Except for those who have believed and done righteous deeds and advised each other to truth and advised each other to patience.' },
    ],
  },
  // Surah Al-Qadr
  97: {
    number: 97,
    nameAr: 'القَدْر',
    nameEn: 'Al-Qadr',
    englishTranslation: 'The Power',
    numberOfAyahs: 5,
    revelationType: 'Meccan',
    page: 598,
    ayahs: [
      { numberInSurah: 1, text: 'إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ', translation: 'Indeed, We sent the Qur\'an down during the Night of Decree.' },
      { numberInSurah: 2, text: 'وَمَا أَدْرَاكَ مَا لَيْلَةُ الْقَدْرِ', translation: 'And what can make you know what is the Night of Decree?' },
      { numberInSurah: 3, text: 'لَيْلَةُ الْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ', translation: 'The Night of Decree is better than a thousand months.' },
      { numberInSurah: 4, text: 'تَنَزَّلُ الْمَلَائِكَةُ وَالرُّوحُ فِيهَا بِإِذْنِ رَبِّهِم مِّن كُلِّ أَمْرٍ', translation: 'The angels and the Spirit descend therein by permission of their Lord for every matter.' },
      { numberInSurah: 5, text: 'سَلَامٌ هِيَ حَتَّىٰ مَطْلَعِ الْفَجْرِ', translation: 'Peace it is until the emergence of dawn.' },
    ],
  },
  // Surah Al-Mulk (first 10 verses + link to complete)
  67: {
    number: 67,
    nameAr: 'المُلْك',
    nameEn: 'Al-Mulk',
    englishTranslation: 'The Sovereignty',
    numberOfAyahs: 30,
    revelationType: 'Meccan',
    page: 562,
    ayahs: [
      { numberInSurah: 1, text: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ', translation: 'Blessed is He in whose hand is dominion, and He is over all things competent.' },
      { numberInSurah: 2, text: 'الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ الْعَزِيزُ الْغَفُورُ', translation: '[He] who created death and life to test you [as to] which of you is best in deed - and He is the Exalted in Might, the Forgiving.' },
      { numberInSurah: 3, text: 'الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا ۖ مَّا تَرَىٰ فِي خَلْقِ الرَّحْمَٰنِ مِن تَفَاوُتٍ ۖ فَارْجِعِ الْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍ', translation: '[And] who created seven heavens in layers. You see not in the creation of the Most Merciful any inconsistency. So return your vision to the sky, do you see any breaks?' },
      { numberInSurah: 4, text: 'ثُمَّ ارْجِعِ الْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ الْبَصَرُ خَاسِئًا وَهُوَ حَسِيرٌ', translation: 'Then return your vision twice again. [Your] vision will return to you humbled while it is fatigued.' },
      { numberInSurah: 5, text: 'وَلَقَدْ زَيَّنَّا السَّمَاءَ الدُّنْيَا بِمَصَابِيحَ وَجَعَلْنَاهَا رُجُومًا لِّلشَّيَاطِينِ ۖ وَأَعْتَدْنَا لَهُمْ عَذَابَ السَّعِيرِ', translation: 'And We have certainly beautified the nearest heaven with stars and have made [from] them what is thrown at the devils and have prepared for them the punishment of the Blaze.' },
      { numberInSurah: 6, text: 'وَلِلَّذِينَ كَفَرُوا بِرَبِّهِمْ عَذَابُ جَهَنَّمَ ۖ وَبِئْسَ الْمَصِيرُ', translation: 'And for those who disbelieved in their Lord is the punishment of Hell, and wretched is the destination.' },
      { numberInSurah: 7, text: 'إِذَا أُلْقُوا فِيهَا سَمِعُوا لَهَا شَهِيقًا وَهِيَ تَفُورُ', translation: 'When they are thrown into it, they hear from it a dreadful inhaling while it boils up.' },
      { numberInSurah: 8, text: 'تَكَادُ تَمَيَّزُ مِنَ الْغَيْظِ ۖ كُلَّمَا أُلْقِيَ فِيهَا فَوْجٌ سَأَلَهُمْ خَزَنَتُهَا أَلَمْ يَأْتِكُمْ نَذِيرٌ', translation: 'It almost bursts with rage. Every time a company is thrown into it, its keepers ask them, "Did there not come to you a warner?"' },
      { numberInSurah: 9, text: 'قَالُوا بَلَىٰ قَدْ جَاءَنَا نَذِيرٌ فَكَذَّبْنَا وَقُلْنَا مَا نَزَّلَ اللَّهُ مِن شَيْءٍ إِنْ أَنتُمْ إِلَّا فِي ضَلَالٍ كَبِيرٍ', translation: 'They will say,"Yes, a warner had come to us, but we denied and said, \'Allah has not sent down anything. You are not except in great error.\'"' },
      { numberInSurah: 10, text: 'وَقَالُوا لَوْ كُنَّا نَسْمَعُ أَوْ نَعْقِلُ مَا كُنَّا فِي أَصْحَابِ السَّعِيرِ', translation: 'And they will say, "If only we had been listening or reasoning, we would not be among the companions of the Blaze."' },
    ],
  },
};

const ALL_SURAHS_MAP = new Map<number, SurahMeta>();
ALL_SURAHS.forEach((s) => ALL_SURAHS_MAP.set(s.number, s));

const SURAH_CACHE = new Map<number, SurahDetail>();

interface RawJsonVerse {
  id: number;
  text: string;
  translation?: string;
}

interface RawJsonSurah {
  id: number;
  name: string;
  transliteration: string;
  translation: string;
  type: string;
  total_verses: number;
  verses: RawJsonVerse[];
}

/**
 * Returns full SurahDetail synchronously and instantly (0ms) from bundled Quran data.
 */
export function getFullSurahSync(surahNumber: number): SurahDetail | null {
  if (SURAH_CACHE.has(surahNumber)) {
    return SURAH_CACHE.get(surahNumber)!;
  }

  const meta = ALL_SURAHS_MAP.get(surahNumber);
  if (!meta) return null;

  // 1. Check embedded surahs if complete
  const embedded = EMBEDDED_SURAHS[surahNumber];
  if (embedded && embedded.ayahs.length >= meta.numberOfAyahs) {
    SURAH_CACHE.set(surahNumber, embedded);
    return embedded;
  }

  // 2. Load from bundled quranAllData
  const rawData = (quranAllData as unknown as Record<string, RawJsonSurah>)[String(surahNumber)];
  if (rawData && rawData.verses && rawData.verses.length > 0) {
    const ayahs: AyahItem[] = rawData.verses.map((v) => ({
      numberInSurah: v.id,
      text: v.text,
      translation: v.translation || '',
    }));

    const detail: SurahDetail = {
      ...meta,
      ayahs,
    };
    SURAH_CACHE.set(surahNumber, detail);
    return detail;
  }

  return embedded || null;
}

/**
 * Loads full SurahDetail instantly with multi-layer fallback.
 */
export async function fetchFullSurah(surahNumber: number): Promise<SurahDetail | null> {
  // 1. Instant sync retrieval from bundled data
  const syncSurah = getFullSurahSync(surahNumber);
  if (syncSurah && syncSurah.ayahs.length > 0) {
    return syncSurah;
  }

  // 2. Try local static asset in public/data/surahs/{surahNumber}.json
  try {
    const baseUrl = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : './';
    const res = await fetch(`${baseUrl}data/surahs/${surahNumber}.json`);
    if (res.ok) {
      const rawData: RawJsonSurah = await res.json();
      const meta = ALL_SURAHS_MAP.get(surahNumber);
      if (meta && rawData.verses) {
        const detail: SurahDetail = {
          ...meta,
          ayahs: rawData.verses.map((v) => ({
            numberInSurah: v.id,
            text: v.text,
            translation: v.translation || '',
          })),
        };
        SURAH_CACHE.set(surahNumber, detail);
        return detail;
      }
    }
  } catch {}

  // 3. Fallback online AlQuran Cloud API
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih`);
    if (res.ok) {
      const json = await res.json();
      if (json.code === 200 && Array.isArray(json.data) && json.data.length >= 2) {
        const arabicData = json.data[0];
        const englishData = json.data[1];
        const meta = ALL_SURAHS_MAP.get(surahNumber) || {
          number: surahNumber,
          nameAr: arabicData.name,
          nameEn: arabicData.englishName,
          englishTranslation: arabicData.englishNameTranslation,
          numberOfAyahs: arabicData.numberOfAyahs,
          revelationType: arabicData.revelationType as 'Meccan' | 'Medinan',
          page: 1,
        };

        const ayahs: AyahItem[] = arabicData.ayahs.map((ayah: { numberInSurah: number; text: string; number: number }, idx: number) => ({
          numberInSurah: ayah.numberInSurah,
          text: ayah.text,
          translation: englishData.ayahs[idx]?.text || '',
          numberInQuran: ayah.number,
        }));

        const detail: SurahDetail = {
          ...meta,
          ayahs,
        };
        SURAH_CACHE.set(surahNumber, detail);
        return detail;
      }
    }
  } catch (err) {
    console.warn('Network fetch for Surah failed, falling back:', err);
  }

  return EMBEDDED_SURAHS[surahNumber] || null;
}
