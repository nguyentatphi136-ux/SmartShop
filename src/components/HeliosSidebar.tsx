import React from 'react';
import {
  LayoutGrid,
  ShoppingBag,
  BarChart2,
  TrendingUp,
  Users,
  Settings,
  Headphones,
  X,
} from 'lucide-react';
import { HeliosTab } from '../types';
import { HeliosLogo } from './BrandLogos';

interface HeliosSidebarProps {
  currentTab: HeliosTab;
  onTabChange: (tab: HeliosTab) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const HeliosSidebar: React.FC<HeliosSidebarProps> = ({
  currentTab,
  onTabChange,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navItems: { id: HeliosTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-pink-500/40 via-purple-500/30 to-indigo-500/20 flex items-center justify-center border border-pink-400/40 shadow-[0_0_12px_rgba(236,72,153,0.3)]">
          <div className="w-2 h-2 rounded-full bg-pink-300 animate-pulse" />
        </div>
      ),
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: <ShoppingBag className="w-4 h-4" />,
    },
    {
      id: 'analysis',
      label: 'Analysis',
      icon: <BarChart2 className="w-4 h-4" />,
    },
    {
      id: 'market',
      label: 'Market',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: 'community',
      label: 'Community',
      icon: <Users className="w-4 h-4" />,
    },
  ];

  const bottomItems: { id: HeliosTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
    },
    {
      id: 'support',
      label: 'Support',
      icon: (
        <div className="flex items-center gap-1">
          <div className="relative flex items-center justify-center">
            <Headphones className="w-4 h-4" />
            <span className="absolute -top-1.5 -right-2 text-[8px] font-black text-white bg-pink-600 rounded-full px-1 py-0.2 scale-75">
              24
            </span>
          </div>
        </div>
      ),
    },
  ];

  const handleSelect = (tab: HeliosTab) => {
    onTabChange(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const renderContent = () => (
    <div className="flex flex-col h-full justify-between p-4 sm:p-5 select-none">
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between pb-7 pt-1 px-1">
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => handleSelect('dashboard')}
          >
            <div className="text-white flex items-center justify-center drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-transform group-hover:scale-105">
              <HeliosLogo className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-[15px] tracking-tight text-white/95 group-hover:text-white">
              Helios Investments
            </span>
          </div>

          {isMobileOpen && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-all duration-200 text-left ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-[#38263e]/90 via-[#271d2c]/80 to-[#1e1723]/60 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)] font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                }`}
              >
                <div
                  className={`flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {item.icon}
                </div>
                <span className="tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom section (Settings & Support) */}
      <div className="pt-6 space-y-1.5">
        {bottomItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-bottom-${item.id}`}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-all duration-200 text-left ${
                isActive
                  ? 'text-white bg-slate-800/80 border border-slate-700 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex-shrink-0 text-slate-400">{item.icon}</div>
              <span className="tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (visible on lg+) */}
      <aside
        id="helios-main-sidebar"
        className="hidden lg:flex w-60 xl:w-64 flex-shrink-0 flex-col h-full border-r border-[#22242e] bg-[#121316] select-none z-10"
      >
        {renderContent()}
      </aside>

      {/* Mobile Drawer (visible on mobile/tablet when open) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#121316] border-r border-[#252834] shadow-2xl z-10">
            {renderContent()}
          </div>
        </div>
      )}
    </>
  );
};
