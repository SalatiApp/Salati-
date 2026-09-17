import React from 'react';
import { Clock, BookOpen, Sun, Heart, Settings } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange?: (tab: TabType) => void;
  setCurrentTab?: (tab: TabType) => void;
  onOpenTasbeeh?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, setCurrentTab }) => {
  const handleTabSelect = (tab: TabType) => {
    if (onTabChange) {
      onTabChange(tab);
    } else if (setCurrentTab) {
      setCurrentTab(tab);
    }
  };

  const navItems: { id: TabType; labelAr: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'prayers', labelAr: 'المواقيت', icon: Clock },
    { id: 'quran', labelAr: 'القرآن', icon: BookOpen },
    { id: 'azkar', labelAr: 'الأذكار', icon: Sun },
    { id: 'duas', labelAr: 'الأدعية', icon: Heart },
    { id: 'settings', labelAr: 'الإعدادات', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-emerald-100/90 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom,0.5rem)]">
      <div className="w-full max-w-xl mx-auto flex items-center justify-around px-1.5 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabSelect(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all duration-200 relative min-h-[54px] active:scale-95 ${
                isActive
                  ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
              }`}
            >
              {isActive && (
                <div className="absolute -top-1 w-8 h-1 bg-emerald-600 dark:bg-emerald-400 rounded-full shadow-xs" />
              )}
              <div
                className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 scale-105 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-5.5 h-5.5 sm:w-6 sm:h-6 stroke-[2.1]" />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight font-tajawal font-medium">{item.labelAr}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
