import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public props: Props;
  public state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Salati App Uncaught Error:', error, errorInfo);
  }

  private handleReload = () => {
    try {
      window.location.reload();
    } catch {
      window.location.href = window.location.origin;
    }
  };

  private handleResetSettings = () => {
    try {
      localStorage.removeItem('salati_settings');
      window.location.reload();
    } catch {
      window.location.href = window.location.origin;
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 text-center font-tajawal" dir="rtl">
          <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-bold text-white mb-2">حدث خطأ أثناء تحميل التطبيق</h1>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              نعتذر عن هذا الخطأ غير المتوقع. يمكنك محاولة إعادة تشغيل التطبيق أو استعادة الإعدادات الافتراضية.
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition"
              >
                <RotateCw className="w-4 h-4" />
                <span>إعادة تشغيل التطبيق</span>
              </button>

              <button
                onClick={this.handleResetSettings}
                className="w-full py-2.5 px-4 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-2xl font-medium text-xs transition"
              >
                استعادة الإعدادات الافتراضية
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
