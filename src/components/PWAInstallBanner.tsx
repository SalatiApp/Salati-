import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle, WifiOff, Share, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  // Check if dismissed previously in session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('salati_pwa_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('salati_pwa_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setIsDismissed(true);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {/* Offline Status Alert Pill */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 shadow-md animate-fadeIn z-40">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>أنت الآن في وضع عدم الاتصال (Offline) — مواقيت الصلاة، القرآن، والأذكار تعمل بكفاءة تامة.</span>
        </div>
      )}

      {/* Prominent Install Banner (Only if not installed and not dismissed) */}
      {!isInstalled && !isDismissed && (isInstallable || isIOS) && (
        <div className="max-w-md mx-auto px-4 pt-3 animate-fadeIn">
          <div className="bg-gradient-to-l from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-2xl border border-emerald-600/40 p-3.5 shadow-lg relative overflow-hidden flex items-center justify-between gap-3">
            {/* Ambient pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:12px_12px] opacity-10 pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
              <img
                src="/pwa-192x192.png"
                alt="صلاتي"
                className="w-12 h-12 rounded-xl border border-amber-400/40 shadow-sm shrink-0 object-cover"
              />
              <div className="text-right">
                <h4 className="font-bold text-sm text-amber-300 font-tajawal flex items-center gap-1">
                  <span>تثبيت تطبيق صلاتي</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-normal">
                    PWA
                  </span>
                </h4>
                <p className="text-[11px] text-emerald-100/90 leading-tight mt-0.5">
                  تطبيق سريع على شاشة هاتفك، يعمل بدون إنترنت مع الأذان
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 relative z-10 shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>تثبيت</span>
              </button>

              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg text-emerald-300/70 hover:text-white hover:bg-emerald-800/50 transition"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900 text-white rounded-3xl border border-emerald-700/60 p-5 shadow-2xl text-right">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-800/60 mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base font-tajawal">تثبيت على آيفون / آيباد</h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-200 leading-relaxed font-tajawal">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="p-1.5 rounded-lg bg-emerald-900/60 text-amber-400 shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-white block">1. اضغط على زر المشاركة:</strong>
                  <span>اضغط على أيقونة المشاركة (Share) في شريط متصفح Safari بالأسفل.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="p-1.5 rounded-lg bg-emerald-900/60 text-amber-400 shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-white block">2. اختر "إضافة إلى الصفحة الرئيسية":</strong>
                  <span>مرر القائمة لأسفل ثم اختر (Add to Home Screen).</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="p-1.5 rounded-lg bg-emerald-900/60 text-amber-400 shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-white block">3. تمتع بتجربة التطبيق المستقل:</strong>
                  <span>سيظهر تطبيق "صلاتي" مباشرة على شاشتك الرئيسية كأي تطبيق أصيل.</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
};
