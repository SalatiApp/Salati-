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
  private initPromise: Promise<void> | null = null;
  private isBannerCreated = false;
  private isBannerVisible = false;

  /**
   * تهيئة Google AdMob SDK على مستوى التطبيق.
   * يتم استدعاؤها عند إقلاع التطبيق على نظام Android.
   */
  public async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      // البيئة الحالية هي متصفح الويب أو PWA، لا يتم تشغيل إعلانات أندرويد الأصلية
      return;
    }

    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        await AdMob.initialize({
          initializeForTesting: ADMOB_CONFIG.isTesting,
        });

        this.isInitialized = true;
        console.log('[AdMob] Google AdMob SDK initialized successfully');
      } catch (error) {
        console.warn('[AdMob] Initialization failed or delayed:', error);
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
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
   * إظهار إعلان بانر (Banner Ad) في أسفل الشاشة مباشرة تحت شريط التنقل السفلي.
   */
  public async showBanner(position: BannerAdPosition = BannerAdPosition.BOTTOM_CENTER): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // إذا كان البانر قد تم إنشاؤه مسبقاً وكان مخفياً، نستعيده عبر resumeBanner
      if (this.isBannerCreated) {
        try {
          await AdMob.resumeBanner();
          this.isBannerVisible = true;
          console.log('[AdMob] Banner resumed successfully at BOTTOM_CENTER');
          return;
        } catch (resumeError) {
          console.log('[AdMob] resumeBanner fallback, re-creating banner:', resumeError);
        }
      }

      const options: BannerAdOptions = {
        adId: this.getAdUnitId('banner'),
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position,
        margin: 0,
        isTesting: ADMOB_CONFIG.isTesting,
      };

      await AdMob.showBanner(options);
      this.isBannerCreated = true;
      this.isBannerVisible = true;
      console.log('[AdMob] Google Test Banner shown at BOTTOM_CENTER');
    } catch (error) {
      console.warn('[AdMob] showBanner error:', error);
    }
  }

  /**
   * إخفاء إعلان البانر فوراً (مطلوب بدقة في شاشات القرآن، الأذكار، والأدعية).
   */
  public async hideBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    if (!this.isBannerVisible && !this.isBannerCreated) return;

    try {
      await AdMob.hideBanner();
      this.isBannerVisible = false;
      console.log('[AdMob] Banner hidden');
    } catch (error) {
      console.warn('[AdMob] hideBanner error:', error);
    }
  }

  /**
   * إزالة إعلان البانر بالكامل من الشاشة وتدميره.
   */
  public async removeBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await AdMob.removeBanner();
      this.isBannerCreated = false;
      this.isBannerVisible = false;
      console.log('[AdMob] Banner removed');
    } catch (error) {
      console.warn('[AdMob] removeBanner error:', error);
    }
  }

  /**
   * التحقق مما إذا كان مسموحاً بعرض البانر في التبويب الحالي:
   * - ممنوع منعاً باتاً ومخفي بالكامل في: القرآن الكريم، الأذكار، الأدعية.
   * - مسموح وظاهر في: المواقيت، الإعدادات.
   */
  public isBannerAllowed(tab: string): boolean {
    if (tab === 'quran' || tab === 'azkar' || tab === 'duas') {
      return false;
    }
    return tab === 'prayers' || tab === 'settings';
  }

  /**
   * إدارة تلقائية لظهور البانر حسب التبويب النشط وحالة النوافذ المنبثقة:
   * يعرض البانر في شاشات المواقيت والإعدادات، ويخفيه كلياً في القرآن والأذكار والأدعية.
   */
  public handleTabChange(tab: string, modalOpen = false): void {
    if (modalOpen) {
      this.hideBanner();
      return;
    }

    const isAllowed = this.isBannerAllowed(tab);
    if (isAllowed) {
      this.showBanner(BannerAdPosition.BOTTOM_CENTER);
    } else {
      this.hideBanner();
    }
  }

  /**
   * تم تعطيل Interstitial بالكامل في هذه المرحلة حسب التعليمات الصارمة.
   */
  public async showInterstitialIfAllowed(): Promise<boolean> {
    return false;
  }
}

export const adMobService = new AdMobService();
