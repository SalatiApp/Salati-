/**
 * Copyright 2026 Google LLC
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdOptions,
  BannerAdSize,
  BannerAdPosition,
  AdOptions,
} from '@capacitor-community/admob';

/**
 * إعدادات Google AdMob الرسمية:
 * -------------------------------------------------------------
 * 1. المعرفات التجريبية (Official Google Sample Test Ad Unit IDs):
 *    هذه المعرفات رسمية من شركة جوجل للاختبار أثناء التطوير:
 *    - Banner: ca-app-pub-3940256099942544/6300978111
 *    - Interstitial: ca-app-pub-3940256099942544/1033173712
 *    - Rewarded: ca-app-pub-3940256099942544/5224354917
 *
 * 2. المعرفات الحقيقية للإنتاج (Production Ad Unit IDs):
 *    عند النشر على Google Play، ستحتاج لاستخراجها من حسابك في Google AdMob
 *    واستبدال السلاسل الفارغة أدناه، مع ضبط isTesting إلى false.
 * -------------------------------------------------------------
 */
export const ADMOB_CONFIG = {
  // تفعيل وضع الاختبار (Test Ads) افتراضياً للأمان أثناء التطوير
  isTesting: true,

  // المعرفات الرسمية للاختبار من وثائق جوجل الرسمية (Official Google Test IDs)
  testIds: {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },

  // ضع هنا المعرفات الحقيقية من حسابك في AdMob عند الجاهزية للنشر:
  productionIds: {
    banner: '',        // مثال: ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY
    interstitial: '',  // مثال: ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY
    rewarded: '',      // مثال: ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY
  },
};

// الحد الأدنى للوقت بين ظهور إعلانات Interstitial (10 دقائق لمنع الإزعاج)
const INTERSTITIAL_COOLDOWN_MS = 10 * 60 * 1000;

class AdMobService {
  private isInitialized = false;
  private isBannerVisible = false;
  private lastInterstitialTime = 0;
  private isInterstitialLoading = false;

  /**
   * تهيئة Google AdMob SDK على مستوى التطبيق.
   * يتم استدعاؤها مرة واحدة عند إقلاع التطبيق على نظام Android.
   */
  public async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      // البيئة الحالية هي متصفح الويب أو PWA، لا يتم تشغيل إعلانات أندرويد الأصلية
      return;
    }

    if (this.isInitialized) return;

    try {
      await AdMob.initialize({
        initializeForTesting: ADMOB_CONFIG.isTesting,
      });

      this.isInitialized = true;
      console.log('[AdMob] Google AdMob SDK initialized successfully');
    } catch (error) {
      console.warn('[AdMob] Initialization failed or delayed:', error);
    }
  }

  /**
   * إرجاع معرّف الوحدة الإعلانية المناسب (تجريبي أثناء التطوير أو حقيقي للإنتاج).
   */
  private getAdUnitId(type: 'banner' | 'interstitial' | 'rewarded'): string {
    if (ADMOB_CONFIG.isTesting) {
      return ADMOB_CONFIG.testIds[type];
    }
    const prodId = ADMOB_CONFIG.productionIds[type];
    return prodId && prodId.trim() !== '' ? prodId : ADMOB_CONFIG.testIds[type];
  }

  /**
   * إظهار إعلان بانر (Banner Ad) في أسفل الشاشة مباشرة أسفل شريط التنقل.
   */
  public async showBanner(position: BannerAdPosition = BannerAdPosition.BOTTOM_CENTER): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const options: BannerAdOptions = {
        adId: this.getAdUnitId('banner'),
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position,
        margin: 0,
        isTesting: ADMOB_CONFIG.isTesting,
      };

      await AdMob.showBanner(options);
      this.isBannerVisible = true;
      console.log('[AdMob] Google Test Banner shown at BOTTOM_CENTER');
    } catch (error) {
      console.warn('[AdMob] showBanner error:', error);
    }
  }

  /**
   * إخفاء إعلان البانر فوراً (ضروري جداً في شاشات القرآن، الأذكار، والأدعية).
   */
  public async hideBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform() || !this.isBannerVisible) return;

    try {
      await AdMob.hideBanner();
      this.isBannerVisible = false;
      console.log('[AdMob] Banner hidden');
    } catch (error) {
      console.warn('[AdMob] hideBanner error:', error);
    }
  }

  /**
   * إزالة إعلان البانر بالكامل.
   */
  public async removeBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await AdMob.removeBanner();
      this.isBannerVisible = false;
    } catch (error) {
      console.warn('[AdMob] removeBanner error:', error);
    }
  }

  /**
   * التحقق مما إذا كان مسموحاً بعرض البانر في التبويب الحالي:
   * ممنوع منعاً باتاً في القرآن الكريم، الأذكار، والأدعية، وأثناء تشغيل الصوت.
   */
  public isBannerAllowed(tab: string, isAudioPlaying = false): boolean {
    if (isAudioPlaying) return false;
    if (tab === 'quran' || tab === 'azkar' || tab === 'duas') {
      return false;
    }
    return tab === 'prayers' || tab === 'settings';
  }

  /**
   * إدارة تلقائية لظهور الإعلانات حسب التبويب النشط:
   * يعرض البانر في شاشات المواقيت والإعدادات، ويخفيه كلياً في شاشات القرآن والأذكار والأدعية.
   */
  public handleTabChange(tab: string, isAudioPlaying = false): void {
    const isAllowed = this.isBannerAllowed(tab, isAudioPlaying);

    if (isAllowed) {
      this.showBanner(BannerAdPosition.BOTTOM_CENTER);
    } else {
      this.hideBanner();
    }
  }

  /**
   * تم تعطيل Interstitial بالكامل حسب الطلب الحالي (استخدام Banner فقط).
   */
  public async showInterstitialIfAllowed(): Promise<boolean> {
    return false;
  }
}

export const adMobService = new AdMobService();
