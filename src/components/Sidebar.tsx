import React, { useState } from 'react';
import {
  LayoutDashboard,
  Store,
  Package,
  Users,
  Receipt,
  ClipboardList,
  TrendingUp,
  BarChart3,
  Bot,
  Brain,
  ShieldCheck,
  Settings,
  PanelLeftClose,
  ChevronDown,
  X,
  LogOut,
  Lock,
} from 'lucide-react';
import { MainTab, StaffUser } from '../types';
import { useLanguage } from '../utils/i18n';
import {
  canUserAccessTab,
  getRoleDetails,
  RolePermissionsMatrix,
} from '../utils/permissions';

interface SidebarProps {
  currentTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onOpenUpgradeModal?: () => void;
  onOpenSettingsModal?: () => void;
  isDark?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  currentUser?: StaffUser | null;
  onLogout?: () => void;
  rolePermissions?: RolePermissionsMatrix;
  onRestrictedClick?: (tabLabel: string, tabId: MainTab) => void;
}

interface NavItem {
  id: MainTab;
  label: string;
  emojiIcon?: string;
  icon: React.ReactNode;
  badge?: string;
  isAi?: boolean;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  onOpenUpgradeModal,
  onOpenSettingsModal,
  isDark,
  isMobileOpen = false,
  onCloseMobile,
  currentUser,
  onLogout,
  rolePermissions,
  onRestrictedClick,
}) => {
  const { t, language } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const currentRoleDetails = getRoleDetails(currentUser?.role || 'admin', language);

  const navGroups: NavGroup[] = [
    {
      items: [
        {
          id: 'dashboard',
          label: t.navDashboard,
          emojiIcon: '📊',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: 'pos',
          label: t.navPos,
          emojiIcon: '🛒',
          icon: <Store className="w-4 h-4" />,
        },
      ],
    },
    {
      title: language === 'vi' ? 'QUẢN LÝ' : 'OPERATIONS',
      items: [
        {
          id: 'products',
          label: t.navProducts,
          emojiIcon: '📦',
          icon: <Package className="w-4 h-4" />,
        },
        {
          id: 'customers',
          label: t.navCustomers,
          emojiIcon: '👥',
          icon: <Users className="w-4 h-4" />,
        },
        {
          id: 'invoices',
          label: t.navInvoices,
          emojiIcon: '📄',
          icon: <Receipt className="w-4 h-4" />,
        },
        {
          id: 'inventory',
          label: language === 'vi' ? 'Tồn kho & Chi nhánh' : 'Inventory & Branches',
          emojiIcon: '📋',
          icon: <ClipboardList className="w-4 h-4" />,
        },
      ],
    },
    {
      title: language === 'vi' ? 'BÁO CÁO' : 'REPORTS',
      items: [
        {
          id: 'revenue-report',
          label: t.navRevenueReport,
          emojiIcon: '📈',
          icon: <TrendingUp className="w-4 h-4" />,
        },
        {
          id: 'analytics-report',
          label: t.navAnalyticsReport,
          emojiIcon: '📊',
          icon: <BarChart3 className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'AI COPILOT',
      items: [
        {
          id: 'ai-assistant',
          label: t.navAiAssistant,
          emojiIcon: '🤖',
          icon: <Bot className="w-4 h-4" />,
          isAi: true,
        },
        {
          id: 'ai-analyst',
          label: t.navAiAnalyst,
          emojiIcon: '🧠',
          icon: <Brain className="w-4 h-4" />,
          isAi: true,
        },
      ],
    },
    {
      title: language === 'vi' ? 'HỆ THỐNG' : 'SYSTEM',
      items: [
        {
          id: 'users-permissions',
          label: t.navUsersPermissions,
          emojiIcon: '👤',
          icon: <ShieldCheck className="w-4 h-4" />,
        },
        {
          id: 'settings',
          label: t.navSettings,
          emojiIcon: '⚙️',
          icon: <Settings className="w-4 h-4" />,
        },
      ],
    },
  ];


  const handleItemClick = (id: MainTab, label?: string) => {
    const isAllowed = canUserAccessTab(currentUser, id, rolePermissions);
    if (!isAllowed) {
      if (onRestrictedClick && label) {
        onRestrictedClick(label, id);
      }
      return;
    }
    if (id === 'settings' && onOpenSettingsModal) {
      onOpenSettingsModal();
    } else {
      onTabChange(id);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderNavContent = (isMobileDrawer = false) => {
    const collapsed = isMobileDrawer ? false : isCollapsed;

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header with Title and Collapse Toggle */}
        <div
          id={isMobileDrawer ? 'brand-header-mobile' : 'brand-header'}
          className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80"
        >
          {!collapsed && (
            <div
              className="flex items-center gap-2.5 cursor-pointer min-w-0"
              onClick={() => handleItemClick('dashboard')}
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="truncate">
                <h1 className="font-bold text-base tracking-tight text-slate-900 dark:text-white leading-none">
                  SmartSale AI
                </h1>
                <span className="text-[10px] text-slate-400 font-medium">Enterprise OS</span>
              </div>
            </div>
          )}

          {collapsed && (
            <div
              className="mx-auto w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white cursor-pointer shadow-md shadow-blue-500/20"
              onClick={() => setIsCollapsed(false)}
              title="Mở rộng Sidebar"
            >
              <Bot className="w-5 h-5" />
            </div>
          )}

          {isMobileDrawer ? (
            <button
              onClick={onCloseMobile}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Đóng menu"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              id="btn-toggle-sidebar"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors ${
                isCollapsed ? 'hidden' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <div
          id={isMobileDrawer ? 'sidebar-nav-scroll-mobile' : 'sidebar-nav-scroll'}
          className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700"
        >
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {group.title && !collapsed && (
                <h3 className="px-3 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-1.5">
                  {group.title}
                </h3>
              )}

              {group.title && collapsed && (
                <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = currentTab === item.id;
                  const isAllowed = canUserAccessTab(currentUser, item.id, rolePermissions);

                  return (
                    <button
                      key={item.id}
                      id={`nav-item-${item.id}${isMobileDrawer ? '-mobile' : ''}`}
                      onClick={() => handleItemClick(item.id, item.label)}
                      title={
                        !isAllowed
                          ? `${item.label} (Không có quyền truy cập)`
                          : collapsed
                          ? item.label
                          : undefined
                      }
                      className={`w-full flex items-center rounded-xl text-xs sm:text-sm font-medium transition-all ${
                        collapsed
                          ? 'justify-center p-2.5'
                          : 'justify-between px-3 py-2.5 sm:py-2'
                      } ${
                        !isAllowed
                          ? 'opacity-40 hover:opacity-75 text-slate-400 dark:text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 cursor-pointer'
                          : isActive
                          ? isDark
                            ? 'bg-blue-950/70 text-blue-400 font-bold border-l-4 border-blue-500 shadow-xs'
                            : 'bg-blue-50/80 text-blue-700 font-bold border-l-4 border-blue-600 shadow-xs'
                          : isDark
                          ? 'hover:bg-slate-800 text-slate-300 hover:text-white'
                          : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.emojiIcon ? (
                          <span className={`text-lg sm:text-base leading-none flex-shrink-0 ${!isAllowed ? 'grayscale opacity-70' : ''}`}>
                            {item.emojiIcon}
                          </span>
                        ) : (
                          <span
                            className={
                              isActive
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-slate-400 dark:text-slate-400'
                            }
                          >
                            {item.icon}
                          </span>
                        )}
                        {!collapsed && (
                          <span className={`truncate text-sm sm:text-xs font-semibold ${!isAllowed ? 'line-through decoration-slate-300 dark:decoration-slate-600' : ''}`}>
                            {item.label}
                          </span>
                        )}
                      </div>

                      {!collapsed && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {!isAllowed ? (
                            <span className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-400" title="Chức năng bị khóa đối với vai trò này">
                              <Lock className="w-3 h-3" />
                            </span>
                          ) : item.isAi ? (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                              AI
                            </span>
                          ) : null}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Account & Logout Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
          {!collapsed ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'P'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate text-slate-900 dark:text-white">
                    {currentUser?.name || 'Nguyễn Tất Phi'}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${currentRoleDetails.badgeColor}`}>
                      {currentRoleDetails.shortLabel}
                    </span>
                  </div>
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex-shrink-0 cursor-pointer"
                  title="Đăng xuất tài khoản"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            onLogout && (
              <div className="flex justify-center">
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Đăng xuất tài khoản"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )
          )}

          {/* Bottom Expand / Collapse Action */}
          {!isMobileDrawer && (
            <div className="flex items-center justify-center pt-1">
              <button
                id="btn-sidebar-bottom-toggle"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`w-8 h-8 rounded-full border flex items-center justify-center shadow-xs transition-all ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 1. Desktop & Tablet Sidebar (>= 1024px) */}
      <aside
        id="main-sidebar"
        className={`hidden lg:flex flex-shrink-0 flex-col justify-between border-r select-none transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        } ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-200'
            : 'bg-white border-slate-200 text-slate-700'
        }`}
      >
        {renderNavContent(false)}
      </aside>

      {/* 2. Mobile & Tablet Slide-in Off-Canvas Drawer (< 1024px) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer Panel */}
          <div
            className={`relative flex-1 flex flex-col max-w-xs w-full shadow-2xl transition-transform duration-300 ${
              isDark
                ? 'bg-slate-900 border-r border-slate-800 text-slate-200'
                : 'bg-white border-r border-slate-200 text-slate-700'
            }`}
          >
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
