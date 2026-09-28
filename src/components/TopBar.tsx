import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Bell,
  Moon,
  Sun,
  User,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  ChevronDown,
  Menu,
  Bot,
  Radio,
  Clock,
  Sparkles,
  Package,
  Globe,
  Database,
  LogOut,
} from 'lucide-react';
import { MainTab, RealtimeActivity, StaffUser } from '../types';
import { useLanguage } from '../utils/i18n';
import { getRoleDetails } from '../utils/permissions';

interface TopBarProps {
  currentTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isDark: boolean;
  onToggleDarkMode: () => void;
  onNewSaleClick: () => void;
  onOpenMobileMenu?: () => void;
  realtimeActivities?: RealtimeActivity[];
  onOpenRealDataManager?: () => void;
  currentUser?: StaffUser | null;
  onLogout?: () => void;
  dataMode?: 'demo' | 'real';
  onToggleDataMode?: (mode: 'demo' | 'real') => void;
  originalAdminUser?: StaffUser | null;
  onExitImpersonation?: () => void;
  onSwitchRole?: (role: import('../utils/permissions').RoleType) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  isDark,
  onToggleDarkMode,
  onNewSaleClick,
  onOpenMobileMenu,
  realtimeActivities = [],
  onOpenRealDataManager,
  currentUser,
  onLogout,
  dataMode = 'demo',
  onToggleDataMode,
  originalAdminUser,
  onExitImpersonation,
  onSwitchRole,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [language]);

  return (
    <header
      id="main-topbar"
      className={`h-16 border-b px-3 sm:px-6 flex items-center justify-between transition-colors z-20 sticky top-0 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      {/* Left side: Hamburger button (on mobile) & Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-xl">
        {/* Hamburger button for Mobile & Tablet */}
        <button
          id="btn-mobile-menu-toggle"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Mở menu điều hướng"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile App Title */}
        <div
          className="flex lg:hidden items-center gap-1.5 cursor-pointer mr-1"
          onClick={() => onTabChange('dashboard')}
        >
          <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white hidden xs:inline">
            SmartSale
          </span>
        </div>

        {/* Desktop Breadcrumb Navigation in POS */}
        {currentTab === 'pos' && (
          <div className="hidden xl:flex items-center gap-4 text-sm font-medium pr-4 border-r border-slate-200 dark:border-slate-700">
            <span className="font-bold text-blue-600 dark:text-blue-400">SmartSale POS</span>
          </div>
        )}

        {/* Search input (Responsive) */}
        <div className="relative w-full max-w-xs sm:max-w-md hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="topbar-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              currentTab === 'pos'
                ? t.searchPlaceholderPos
                : t.searchPlaceholderGeneral
            }
            className={`w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-full border outline-none transition-all ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-blue-500'
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right side: Actions, Realtime Clock, Language Switcher, Notifications, Dark Mode, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Realtime Live Clock Pill */}
        <div
          id="topbar-live-clock"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-300"
          title={`${t.realtimeSync}: ${currentTimeStr}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>{currentTimeStr}</span>
        </div>

        {/* Language Switcher (VI / EN) right next to the Realtime Clock */}
        <div
          id="topbar-language-switch"
          className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
          title={t.switchLang}
        >
          <button
            id="topbar-btn-lang-vi"
            onClick={() => setLanguage('vi')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
              language === 'vi'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Tiếng Việt"
          >
            <span className="text-xs">🇻🇳</span>
            <span className="text-[11px] font-bold">VI</span>
          </button>
          <button
            id="topbar-btn-lang-en"
            onClick={() => setLanguage('en')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
              language === 'en'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="English"
          >
            <span className="text-xs">🇬🇧</span>
            <span className="text-[11px] font-bold">EN</span>
          </button>
        </div>

        {/* Mobile Search Toggle */}
        <button
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          className="sm:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Tìm kiếm"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Data Mode Indicator / Switcher */}
        {onToggleDataMode && (
          <div className="hidden md:flex items-center">
            {dataMode === 'real' ? (
              <button
                type="button"
                onClick={() => onOpenRealDataManager?.()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shadow-xs"
                title={language === 'vi' ? 'Đang ở Chế độ Dữ liệu Thật. Bấm để quản lý' : 'Real Store Data Mode Active'}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{language === 'vi' ? 'Dữ liệu thật' : 'Real Data'}</span>
              </button>
            ) : (
              <button
                type="button"
                id="topbar-activate-real-btn"
                onClick={() => onToggleDataMode('real')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800/70 bg-amber-50 hover:bg-emerald-50 dark:bg-amber-950/40 dark:hover:bg-emerald-950/40 text-amber-800 hover:text-emerald-700 dark:text-amber-300 dark:hover:text-emerald-300 text-xs font-bold transition-all shadow-xs group cursor-pointer"
                title={language === 'vi' ? 'Bấm để tắt đơn demo và Bật Dữ liệu thật' : 'Click to turn on Real Data'}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 group-hover:bg-emerald-500" />
                <span className="group-hover:hidden">{language === 'vi' ? 'Bản Demo' : 'Demo'}</span>
                <span className="hidden group-hover:inline font-bold text-emerald-600 dark:text-emerald-400">
                  {language === 'vi' ? 'Bật Dữ liệu Thật' : 'Turn on Real Data'}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Impersonation Return Indicator */}
        {originalAdminUser && onExitImpersonation && (
          <button
            id="topbar-exit-impersonation-btn"
            onClick={onExitImpersonation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold shadow-sm active:scale-95 transition-all cursor-pointer"
            title="Nhấn để thoát vai trò thử nghiệm và trở lại tài khoản Admin"
          >
            <span>✕ Quay lại Admin</span>
          </button>
        )}

        {/* + New Sale Button */}
        <button
          id="topbar-new-sale-btn"
          onClick={onNewSaleClick}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline">{t.newSale}</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            id="topbar-notifications-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className={`p-2 rounded-xl border relative transition-colors ${
              isDark
                ? 'border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title={t.notifications}
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1.5 right-1.5 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          </button>

          {showNotifications && (
            <div
              id="notifications-popover"
              className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-xl border p-3 z-50 animate-in fade-in slide-in-from-top-2 ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-100'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm">{t.realtimeNotifications}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {t.live}
                  </span>
                </div>
                <span
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] text-blue-600 font-medium cursor-pointer hover:underline"
                >
                  {t.close}
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2 max-h-80 overflow-y-auto pr-1">
                {realtimeActivities.slice(0, 8).map((n) => (
                  <div
                    key={n.id}
                    className="py-2.5 px-2 flex items-start gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                  >
                    {n.type === 'stock_warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    ) : n.type === 'order' || n.type === 'payment' ? (
                      <ShoppingBag className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    ) : n.type === 'restock' ? (
                      <Package className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{n.title}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{n.timestamp}</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">{n.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          id="topbar-theme-btn"
          onClick={onToggleDarkMode}
          className={`p-2 rounded-xl border transition-colors ${
            isDark
              ? 'border-slate-800 text-slate-300 hover:bg-slate-800'
              : 'border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
          title={t.themeToggle}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            id="topbar-user-menu-btn"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-1.5 p-1 pl-1.5 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs ring-1 ring-blue-500 shadow-sm">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'P'}
            </div>
            <span className="hidden md:inline-block text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
              {currentUser?.name || 'Nguyễn Tất Phi'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
          </button>

          {showUserMenu && (
            <div
              id="user-popover"
              className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-xl border p-2 z-50 animate-in fade-in slide-in-from-top-2 ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-100'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate text-slate-900 dark:text-white">
                      {currentUser?.name || 'Nguyễn Tất Phi'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {currentUser?.email || 'nguyentatphi136@gmail.com'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${getRoleDetails(currentUser?.role || 'admin', language).badgeColor}`}>
                    {getRoleDetails(currentUser?.role || 'admin', language).label}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Đang hoạt động</span>
                  </div>
                </div>
              </div>

              <div className="py-1 text-xs space-y-0.5">
                {onOpenRealDataManager && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenRealDataManager();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold"
                  >
                    <Database className="w-3.5 h-3.5 text-blue-500" />
                    <span>{language === 'vi' ? 'Quản lý Dữ liệu Thực tế' : 'Manage Real Data'}</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    alert(language === 'vi' ? 'Hệ thống máy POS & Kho đang đồng bộ thời gian thực qua Web Socket!' : 'POS & Inventory systems are live synchronizing via WebSockets!');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t.checkLatency}</span>
                </button>

                {/* Role Switcher for RBAC Testing */}
                {onSwitchRole && (
                  <div className="pt-2 pb-1 border-t border-slate-100 dark:border-slate-800/80">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                      {language === 'vi' ? 'Thử nghiệm phân quyền:' : 'Test RBAC Roles:'}
                    </p>
                    <div className="grid grid-cols-2 gap-1 px-1">
                      {(['admin', 'manager', 'cashier', 'inventory_staff'] as const).map((r) => {
                        const rDetails = getRoleDetails(r, language);
                        const isCurrent = currentUser?.role === r;
                        return (
                          <button
                            key={r}
                            onClick={() => {
                              setShowUserMenu(false);
                              onSwitchRole(r);
                            }}
                            className={`px-2 py-1.5 rounded-lg text-left text-[11px] font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                              isCurrent
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <span>{rDetails.shortLabel}</span>
                            {isCurrent && <CheckCircle2 className="w-3 h-3 text-blue-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {onLogout && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold transition-colors mt-1 border-t border-slate-100 dark:border-slate-800/80 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Đăng xuất tài khoản' : 'Sign Out'}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Direct Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="hidden sm:flex p-2 rounded-xl text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40"
            title={language === 'vi' ? 'Đăng xuất tài khoản' : 'Sign Out'}
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expanded Mobile Search overlay */}
      {showMobileSearch && (
        <div
          className={`sm:hidden absolute inset-x-0 top-16 border-b px-4 py-3 z-30 flex items-center gap-2 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholderGeneral}
              className={`w-full pl-9 pr-8 py-2 text-xs rounded-xl border outline-none ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => setShowMobileSearch(false)}
            className="text-xs font-semibold text-blue-600 px-2 py-1"
          >
            {t.close}
          </button>
        </div>
      )}
    </header>
  );
};
