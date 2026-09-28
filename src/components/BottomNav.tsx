import React from 'react';
import { LayoutDashboard, Store, Package, Bot, Menu } from 'lucide-react';
import { MainTab } from '../types';
import { useLanguage } from '../utils/i18n';

interface BottomNavProps {
  currentTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onOpenMobileMenu: () => void;
  cartCount?: number;
  isDark?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenMobileMenu,
  cartCount = 0,
  isDark,
}) => {
  const { t, language } = useLanguage();

  const navItems = [
    {
      id: 'dashboard' as MainTab,
      label: t.navDashboard,
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'pos' as MainTab,
      label: t.navPos,
      icon: <Store className="w-5 h-5" />,
      badge: cartCount > 0 ? cartCount : undefined,
    },
    {
      id: 'products' as MainTab,
      label: t.navProducts,
      icon: <Package className="w-5 h-5" />,
    },
    {
      id: 'ai-assistant' as MainTab,
      label: t.navAiAssistant,
      icon: <Bot className="w-5 h-5" />,
    },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t px-2 py-1.5 flex items-center justify-around select-none transition-colors backdrop-blur-md ${
        isDark
          ? 'bg-slate-900/95 border-slate-800 text-slate-400'
          : 'bg-white/95 border-slate-200 text-slate-500 shadow-lg shadow-slate-900/5'
      }`}
    >
      {navItems.map((item) => {
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative ${
              isActive
                ? 'text-slate-900 dark:text-white font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  isActive
                    ? isDark
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'bg-slate-900 text-white shadow-xs'
                    : isDark
                    ? 'bg-slate-800/80 text-slate-400'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {item.icon}
              </div>
              {item.badge !== undefined && (
                <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-rose-600 text-white text-[9px] font-extrabold rounded-full animate-pulse shadow-xs">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight leading-none whitespace-nowrap font-medium">
              {item.label}
            </span>
          </button>
        );
      })}

      {/* Menu Drawer Toggle Button */}
      <button
        onClick={onOpenMobileMenu}
        className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
          ['customers', 'invoices', 'inventory', 'revenue-report', 'analytics-report', 'ai-analyst', 'users-permissions'].includes(currentTab)
            ? 'text-slate-900 dark:text-white font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
            ['customers', 'invoices', 'inventory', 'revenue-report', 'analytics-report', 'ai-analyst', 'users-permissions'].includes(currentTab)
              ? isDark
                ? 'bg-white text-slate-900 shadow-xs'
                : 'bg-slate-900 text-white shadow-xs'
              : isDark
              ? 'bg-slate-800/80 text-slate-400'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          <Menu className="w-4 h-4" />
        </div>
        <span className="text-[10px] mt-1 tracking-tight leading-none whitespace-nowrap font-medium">
          {language === 'vi' ? 'Danh mục' : 'Menu'}
        </span>
      </button>
    </nav>
  );
};
