import React from 'react';
import { Clock, BookOpen, Sun, Heart, Settings } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const navItems: { id: TabType; labelAr: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'prayers', labelAr: 'المواقيت', icon: Clock },
    { id: 'quran', labelAr: 'القرآن', icon: BookOpen },
    { id: 'azkar', labelAr: 'الأذكار', icon: Sun },
    { id: 'duas', labelAr: 'الأدعية', icon: Heart },
    { id: 'settings', labelAr: 'الإعدادات', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 shadow-lg safe-area-inset-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-200 relative min-h-[50px] ${
                isActive
                  ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
              }`}
            >
              {isActive && (
                <div className="absolute -top-1.5 w-8 h-1 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
              )}
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 scale-110 text-emerald-700 dark:text-emerald-400'
                    : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight font-tajawal">{item.labelAr}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
