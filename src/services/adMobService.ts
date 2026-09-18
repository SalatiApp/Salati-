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

      // تجهيز إعلان Interstitial في الخلفية ليصبح جاهزاً إذا دعت الحاجة
      this.preloadInterstitial();
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
   * إظهار إعلان بانر (Banner Ad) في موضع مناسب دون تغطية المحتوى.
   */
  public async showBanner(position: BannerAdPosition = BannerAdPosition.BOTTOM_CENTER): Promise<void> {
    if (!Capacitor.isNativePlatform() || !this.isInitialized) return;

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
   * تحميل مسبق لإعلان Interstitial في الخلفية.
   */
  public async preloadInterstitial(): Promise<void> {
    if (!Capacitor.isNativePlatform() || !this.isInitialized || this.isInterstitialLoading) return;

    try {
      this.isInterstitialLoading = true;
      const options: AdOptions = {
        adId: this.getAdUnitId('interstitial'),
        isTesting: ADMOB_CONFIG.isTesting,
      };
      await AdMob.prepareInterstitial(options);
    } catch (error) {
      console.warn('[AdMob] prepareInterstitial error:', error);
    } finally {
      this.isInterstitialLoading = false;
    }
  }

  /**
   * عرض إعلان بيني (Interstitial) مع مراعاة الضوابط الدقيقة:
   * 1. منع العرض إذا لم يمر وقت كافٍ (Cooldown).
   * 2. منع العرض أثناء تشغيل الأذان أو التلاوة.
   * 3. منع العرض داخل صفحات القرآن أو الأذكار.
   */
  public async showInterstitialIfAllowed(options?: {
    currentTab?: string;
    isAudioPlaying?: boolean;
    force?: boolean;
  }): Promise<boolean> {
    if (!Capacitor.isNativePlatform() || !this.isInitialized) return false;

    // ضوابط احترام المستخدم والمحتوى القرآني:
    if (options?.isAudioPlaying) {
      // لا يظهر الإعلان إطلاقاً أثناء الأذان أو تشغيل تلاوة القرآن
      return false;
    }

    if (options?.currentTab === 'quran' || options?.currentTab === 'azkar' || options?.currentTab === 'duas') {
      // لا يظهر الإعلان إطلاقاً داخل شاشات التعبد والقراءة
      return false;
    }

    const now = Date.now();
    if (!options?.force && now - this.lastInterstitialTime < INTERSTITIAL_COOLDOWN_MS) {
      // لم يمر وقت كافٍ (10 دقائق) منذ آخر إعلان
      return false;
    }

    try {
      await AdMob.showInterstitial();
      this.lastInterstitialTime = Date.now();
      // تحميل مسبق للإعلان التالي بعد إغلاق الحالي
      setTimeout(() => this.preloadInterstitial(), 3000);
      return true;
    } catch (error) {
      console.warn('[AdMob] showInterstitial error:', error);
      // محاولة إعادة التحميل للمرة القادمة
      this.preloadInterstitial();
      return false;
    }
  }

  /**
   * إدارة تلقائية لظهور الإعلانات حسب التبويب النشط:
   * تضمن إخفاء البانر كلياً في شاشات القرآن والأذكار والأدعية وأثناء الصوت.
   */
  public handleTabChange(tab: string, isAudioPlaying: boolean): void {
    if (!Capacitor.isNativePlatform()) return;

    // إخفاء فوري ومطلق في أقسام القرآن، الأذكار، الأدعية، أو أثناء تشغيل الصوت
    if (tab === 'quran' || tab === 'azkar' || tab === 'duas' || isAudioPlaying) {
      this.hideBanner();
    }
  }
}

export const adMobService = new AdMobService();
