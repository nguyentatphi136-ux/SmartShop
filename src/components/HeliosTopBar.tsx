import React, { useState } from 'react';
import { Bell, Settings, Sparkles, Menu, Search, Check, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface HeliosTopBarProps {
  user: UserProfile;
  onOpenMobileMenu: () => void;
  onOpenAiAssistant: (initialQuery?: string) => void;
  onOpenSettings: () => void;
}

export const HeliosTopBar: React.FC<HeliosTopBarProps> = ({
  user,
  onOpenMobileMenu,
  onOpenAiAssistant,
  onOpenSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifications = [
    {
      id: 1,
      title: 'SPOT breakout alert',
      desc: 'Spotify hit +16.31% breakthrough on quarterly subscriber surge.',
      time: '12m ago',
      unread: true,
    },
    {
      id: 2,
      title: 'Dividend re-invested',
      desc: 'Apple $42.80 dividend re-allocated to AAPL fractional units.',
      time: '2h ago',
      unread: false,
    },
    {
      id: 3,
      title: 'AI Portfolio Optimization',
      desc: 'Blackwell GPU cycle update generated for NVDA holdings.',
      time: '5h ago',
      unread: false,
    },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onOpenAiAssistant(searchQuery);
      setSearchQuery('');
    } else {
      onOpenAiAssistant();
    }
  };

  return (
    <header className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-3 flex flex-col xl:flex-row xl:items-center justify-between gap-4 select-none">
      {/* Left side: Welcome Nadia & subtitle + Mobile menu button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-[#1a1b22] border border-[#272935] text-slate-300 hover:text-white"
            title="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-white tracking-tight">
              Welcome, {user.name.split(' ')[0]}
            </h1>
            <p className="text-xs sm:text-[13px] text-[#8e92a4] mt-0.5">
              Here's your investment portfolio overview
            </p>
          </div>
        </div>

        {/* Mobile quick avatar */}
        <div className="flex xl:hidden items-center gap-2">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-full bg-[#181920] border border-[#252834] flex items-center justify-center text-slate-300 relative"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-pink-500 absolute top-2 right-2 ring-2 ring-[#121316]" />
          </button>
          <img
            src={user.avatar}
            alt={user.name}
            className="w-9 h-9 rounded-full object-cover border border-[#2f3242]"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Right side: Actions, Profile Capsule, and Ask helios.ai Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 flex-wrap">
        {/* Desktop notification, settings, user pill */}
        <div className="hidden xl:flex items-center gap-2.5">
          {/* Bell Icon Button */}
          <div className="relative">
            <button
              id="topbar-btn-bell"
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-10 h-10 rounded-full bg-[#181920] hover:bg-[#20222c] border border-[#262834] flex items-center justify-center text-slate-300 hover:text-white transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-pink-500 absolute top-2.5 right-2.5 ring-2 ring-[#181920]" />
            </button>

            {/* Notification Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[#191a22] border border-[#2b2e3c] rounded-2xl p-3.5 shadow-2xl z-50 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-[#262834]">
                  <span className="text-xs font-bold text-white">Investment Alerts</span>
                  <span className="text-[11px] text-pink-400 font-medium cursor-pointer hover:underline">
                    Mark all read
                  </span>
                </div>
                <div className="divide-y divide-[#242633] mt-1">
                  {notifications.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-pink-500 mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-white">{item.title}</p>
                        <p className="text-[11px] text-[#8e92a4] line-clamp-2 mt-0.5">{item.desc}</p>
                        <span className="text-[10px] text-slate-500 mt-1 block">{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings Gear Button */}
          <button
            id="topbar-btn-settings"
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-full bg-[#181920] hover:bg-[#20222c] border border-[#262834] flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile Pill Capsule */}
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#181920] border border-[#262834] hover:border-[#323646] cursor-pointer transition-all"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-pink-500/40"
              referrerPolicy="no-referrer"
            />
            <div className="text-left pr-1 leading-tight">
              <p className="text-xs font-bold text-white tracking-tight">{user.name}</p>
              <p className="text-[10px] text-[#8e92a4]">{user.email}</p>
            </div>
          </div>
        </div>

        {/* "Ask helios.ai anything" Search / Prompt Pill Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1 sm:w-64 lg:w-72 xl:w-72"
        >
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          </div>
          <input
            type="text"
            id="helios-ai-prompt-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ask helios.ai anything"
            className="w-full pl-9 pr-8 py-2.5 rounded-full bg-[#181920] border border-[#282a38] hover:border-[#353849] focus:border-pink-500/60 focus:ring-1 focus:ring-pink-500/40 text-xs text-white placeholder-[#787c8f] outline-none transition-all"
          />
          <button
            type="submit"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
            title="Ask AI"
          >
            ↵
          </button>
        </form>
      </div>
    </header>
  );
};
