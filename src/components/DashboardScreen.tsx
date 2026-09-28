import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Download,
  CreditCard,
  FileText,
  Users,
  Store,
  Bot,
  AlertTriangle,
  Eye,
  ShoppingCart,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Product, MainTab, Order, RealtimeActivity, Customer } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useLanguage } from '../utils/i18n';
import { RealtimeLiveBar } from './RealtimeLiveBar';
import { RealtimeLiveActivityFeed } from './RealtimeLiveActivityFeed';

interface DashboardScreenProps {
  products: Product[];
  orders: Order[];
  customers?: Customer[];
  realtimeActivities: RealtimeActivity[];
  isAutoStreamActive: boolean;
  onToggleAutoStream: () => void;
  streamIntervalSeconds: number;
  onChangeInterval: (seconds: number) => void;
  onTriggerInstantOrder: () => void;
  latestActivity: RealtimeActivity | null;
  onTabChange: (tab: MainTab) => void;
  onOpenRestockModal: (productId?: string) => void;
  onOpenReportModal: () => void;
  onOpenRealDataManager?: () => void;
  isDark?: boolean;
  dataMode?: 'demo' | 'real';
  onToggleDataMode?: (mode: 'demo' | 'real') => void;
}

function parseOrderDate(dateStr?: string): Date {
  if (!dateStr) return new Date();
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? new Date() : d;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// Catmull-Rom spline to cubic Bézier curve for smooth SVG line & area
function generateSmoothChartPath(
  pts: { x: number; y: number }[],
  bottomY: number = 180
): { linePath: string; areaPath: string } {
  if (pts.length === 0) return { linePath: '', areaPath: '' };
  if (pts.length === 1) {
    const p = pts[0];
    return {
      linePath: `M ${p.x},${p.y} L ${p.x},${p.y}`,
      areaPath: `M ${p.x},${bottomY} L ${p.x},${p.y} L ${p.x},${bottomY} Z`,
    };
  }

  let linePath = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    linePath += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  const areaPath = `${linePath} L ${pts[pts.length - 1].x},${bottomY} L ${pts[0].x},${bottomY} Z`;
  return { linePath, areaPath };
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  products,
  orders,
  customers = [],
  realtimeActivities,
  isAutoStreamActive,
  onToggleAutoStream,
  streamIntervalSeconds,
  onChangeInterval,
  onTriggerInstantOrder,
  latestActivity,
  onTabChange,
  onOpenRestockModal,
  onOpenReportModal,
  onOpenRealDataManager,
  isDark,
  dataMode = 'demo',
  onToggleDataMode,
}) => {
  const { language, t, formatCurr } = useLanguage();
  const [timeRange, setTimeRange] = useState<'today' | '7days' | 'month' | 'year'>('today');
  const [chartPeriod, setChartPeriod] = useState<'7days' | '30days'>('7days');
  const [hoveredPoint, setHoveredPoint] = useState<{
    day: string;
    revenue: number;
    value: number;
    ordersCount: number;
    profit: number;
    fullDate: string;
    x: number;
    y: number;
  } | null>(null);

  const now = new Date();
  const completedOrders = orders.filter((o) => o.status === 'completed');

  // 1. Today metrics & real comparison against yesterday
  const todayOrders = completedOrders.filter((o) => isSameDay(parseOrderDate(o.createdAt), now));
  const todayRevenue = todayOrders.reduce((acc, o) => acc + o.total, 0);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayOrders = completedOrders.filter((o) => isSameDay(parseOrderDate(o.createdAt), yesterday));
  const yesterdayRevenue = yesterdayOrders.reduce((acc, o) => acc + o.total, 0);

  const todayDiffPercent = yesterdayRevenue > 0
    ? (((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(1)
    : todayRevenue > 0
    ? '+100'
    : '0.0';
  const isTodayGrowthPositive = Number(todayDiffPercent) >= 0;

  // 2. Month metrics & real comparison against previous calendar month
  const monthOrders = completedOrders.filter((o) => {
    const d = parseOrderDate(o.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const monthRevenue = monthOrders.reduce((acc, o) => acc + o.total, 0);

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthOrders = completedOrders.filter((o) => {
    const d = parseOrderDate(o.createdAt);
    return d.getFullYear() === lastMonth.getFullYear() && d.getMonth() === lastMonth.getMonth();
  });
  const prevMonthRevenue = prevMonthOrders.reduce((acc, o) => acc + o.total, 0);

  const monthDiffPercent = prevMonthRevenue > 0
    ? (((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100).toFixed(1)
    : monthRevenue > 0
    ? '+100'
    : '0.0';
  const isMonthGrowthPositive = Number(monthDiffPercent) >= 0;

  // 3. Filtered Orders according to TimeRange dropdown
  const rangeOrders = completedOrders.filter((o) => {
    const oDate = parseOrderDate(o.createdAt);
    if (timeRange === 'today') return isSameDay(oDate, now);
    if (timeRange === '7days') {
      const diff = now.getTime() - oDate.getTime();
      return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
    }
    if (timeRange === 'month') {
      return oDate.getFullYear() === now.getFullYear() && oDate.getMonth() === now.getMonth();
    }
    if (timeRange === 'year') {
      return oDate.getFullYear() === now.getFullYear();
    }
    return true;
  });
  const totalOrdersCount = rangeOrders.length;
  const rangeRevenue = rangeOrders.reduce((acc, o) => acc + o.total, 0);

  // 4. Inventory stats
  const totalInventoryValue = products.reduce((acc, p) => acc + p.stock * p.costPrice, 0);
  const lowStockItems = products.filter((p) => p.stock <= 5);
  const inStockCount = products.filter((p) => p.stock > 5).length;
  const inStockRatioPercent = products.length > 0 ? Math.round((inStockCount / products.length) * 100) : 100;
  const bestSellers = [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 5);

  // 5. Total Customers
  const totalCustomersCount = customers.length;
  const newCustomersThisWeek = customers.filter((c) => (c.totalSpent || 0) > 0).length || Math.min(18, totalCustomersCount);

  // 6. Dynamic Main Revenue Chart Data Points
  const periodDays = chartPeriod === '7days' ? 7 : 30;

  const periodDataList = Array.from({ length: periodDays }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (periodDays - 1 - i));
    const dayOrders = completedOrders.filter((o) => isSameDay(parseOrderDate(o.createdAt), d));
    const dayRevenue = dayOrders.reduce((sum, o) => sum + o.total, 0);
    const dayProfit = dayOrders.reduce(
      (sum, o) =>
        sum +
        o.items.reduce(
          (itemSum, item) => itemSum + (item.product.price - item.product.costPrice) * item.quantity,
          0
        ),
      0
    );

    const isToday = isSameDay(d, now);
    let dayLabel = '';
    if (periodDays === 7) {
      dayLabel = isToday
        ? (language === 'vi' ? 'Hôm nay' : 'Today')
        : d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' });
    } else {
      dayLabel = d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit' });
    }

    return {
      date: d,
      day: dayLabel,
      fullDate: d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      revenue: dayRevenue,
      profit: dayProfit,
      ordersCount: dayOrders.length,
      value: dayRevenue,
    };
  });

  const maxPeriodRevenue = Math.max(...periodDataList.map((d) => d.revenue), 1000000);

  // SVG viewBox="0 0 400 200" coordinates
  const padX = 25;
  const bottomY = 175;
  const topY = 25;
  const chartW = 400 - padX * 2;
  const chartH = bottomY - topY;

  const chartPoints = periodDataList.map((pt, idx) => {
    const x = padX + (idx / Math.max(1, periodDataList.length - 1)) * chartW;
    const ratio = Math.min(1, Math.max(0, pt.revenue / maxPeriodRevenue));
    const y = bottomY - ratio * chartH;
    return {
      ...pt,
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
    };
  });

  const { linePath, areaPath } = generateSmoothChartPath(chartPoints, bottomY);

  // 7-day sparkline for Card 1
  const spark7d = periodDataList.slice(-7);
  const maxSpark7d = Math.max(...spark7d.map((d) => d.revenue), 1000000);
  const sparkPts1 = spark7d.map((d, i) => ({
    x: Number(((i / Math.max(1, spark7d.length - 1)) * 100).toFixed(1)),
    y: Number((26 - (d.revenue / maxSpark7d) * 20).toFixed(1)),
  }));
  const sparkline1 = generateSmoothChartPath(sparkPts1, 30);

  // Month sparkline for Card 2
  const spark30d = periodDataList;
  const maxSpark30d = Math.max(...spark30d.map((d) => d.revenue), 1000000);
  const sparkPts2 = spark30d.map((d, i) => ({
    x: Number(((i / Math.max(1, spark30d.length - 1)) * 100).toFixed(1)),
    y: Number((26 - (d.revenue / maxSpark30d) * 20).toFixed(1)),
  }));
  const sparkline2 = generateSmoothChartPath(sparkPts2, 30);

  // Last 5 days order counts for Card 3 Mini Bar Chart
  const last5d = periodDataList.slice(-5);
  const maxOrders5d = Math.max(...last5d.map((d) => d.ordersCount), 1);

  return (
    <div id="dashboard-screen" className="space-y-6 pb-12">
      {/* Realtime Live Control & Ticker Bar */}
      <RealtimeLiveBar
        isAutoStreamActive={isAutoStreamActive}
        onToggleAutoStream={onToggleAutoStream}
        streamIntervalSeconds={streamIntervalSeconds}
        onChangeInterval={onChangeInterval}
        onTriggerInstantOrder={onTriggerInstantOrder}
        latestActivity={latestActivity}
        totalRealtimeOrdersToday={totalOrdersCount}
        totalRealtimeRevenueToday={todayRevenue}
        onOpenRealDataManager={onOpenRealDataManager}
        isDark={isDark}
        dataMode={dataMode}
        onToggleDataMode={onToggleDataMode}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t.dashboardTitle}
            </h1>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                dataMode === 'real'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dataMode === 'real' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{dataMode === 'real' ? 'Real Store Mode' : 'Demo Simulation'}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
            {t.dashboardSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Enable Real Data or Open Manager Button */}
          {dataMode === 'demo' ? (
            <button
              id="dashboard-real-data-btn"
              onClick={() => {
                if (onToggleDataMode) {
                  onToggleDataMode('real');
                } else if (onOpenRealDataManager) {
                  onOpenRealDataManager();
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-extrabold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              title={language === 'vi' ? 'Bấm để tắt dữ liệu mẫu và chuyển sang Dữ liệu thật' : 'Activate Real Store Data'}
            >
              <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
              <span>{language === 'vi' ? 'Bật Dữ liệu thật' : 'Turn on Real Data'}</span>
            </button>
          ) : (
            onOpenRealDataManager && (
              <button
                id="dashboard-real-data-btn"
                onClick={onOpenRealDataManager}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-400 hover:bg-emerald-900/50'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-xs'
                }`}
              >
                <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                <span>{language === 'vi' ? 'Quản lý Dữ liệu thật' : 'Manage Real Data'}</span>
              </button>
            )
          )}

          {/* Time Filter Dropdown */}
          <div className="relative">
            <select
              id="dashboard-time-filter"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className={`appearance-none text-xs sm:text-sm font-medium py-2 pl-3.5 pr-8 rounded-xl border cursor-pointer outline-none transition-all ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500'
                  : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:border-slate-300'
              }`}
            >
              <option value="today">{language === 'vi' ? 'Hôm nay (Thời gian thực)' : 'Today (Real-time)'}</option>
              <option value="7days">{language === 'vi' ? '7 ngày qua' : 'Last 7 Days'}</option>
              <option value="month">{language === 'vi' ? 'Tháng này' : 'This Month'}</option>
              <option value="year">{language === 'vi' ? 'Năm 2026' : 'Year 2026'}</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Export Report Button */}
          <button
            id="dashboard-export-report-btn"
            onClick={onOpenReportModal}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl border transition-all ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50'
            }`}
          >
            <Download className="w-4 h-4 text-slate-400 dark:text-slate-300" />
            <span>{t.exportReportAction}</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Doanh thu hôm nay (Real-time synced) */}
        <div
          id="metric-today-revenue"
          className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
              {t.todayRevenue}
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1.5 tracking-tight font-mono">
            {formatCurr(todayRevenue)}
          </p>
          <div className={`flex items-center gap-1 text-xs font-semibold mt-1 ${
            isTodayGrowthPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {isTodayGrowthPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{isTodayGrowthPositive && !todayDiffPercent.startsWith('+') ? `+${todayDiffPercent}%` : `${todayDiffPercent}%`}</span>
            <span className="text-slate-400 dark:text-slate-400 font-normal text-[11px]">{t.comparedToYesterday}</span>
          </div>

          {/* Dynamic 7-day Sparkline */}
          <div className="h-9 mt-2 overflow-hidden">
            <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="greenGradDynamic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={sparkline1.areaPath} fill="url(#greenGradDynamic)" />
              <path
                d={sparkline1.linePath}
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Doanh thu tháng */}
        <div
          id="metric-month-revenue"
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
              {language === 'vi' ? 'DOANH THU THÁNG' : 'MONTHLY REVENUE'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1.5 tracking-tight font-mono">
            {formatCurr(monthRevenue)}
          </p>
          <div className={`flex items-center gap-1 text-xs font-semibold mt-1 ${
            isMonthGrowthPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {isMonthGrowthPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{isMonthGrowthPositive && !monthDiffPercent.startsWith('+') ? `+${monthDiffPercent}%` : `${monthDiffPercent}%`}</span>
            <span className="text-slate-400 dark:text-slate-400 font-normal text-[11px]">
              {language === 'vi' ? 'vs tháng trước' : 'vs last month'}
            </span>
          </div>

          {/* Dynamic Month Sparkline */}
          <div className="h-9 mt-2 overflow-hidden">
            <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="monthGradDynamic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={sparkline2.areaPath} fill="url(#monthGradDynamic)" />
              <path
                d={sparkline2.linePath}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Tổng hóa đơn / Đơn hàng */}
        <div
          id="metric-total-orders"
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
              {timeRange === 'today' ? t.todayOrders : (language === 'vi' ? 'ĐƠN THEO BỘ LỌC' : 'FILTERED ORDERS')}
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1.5 tracking-tight font-mono">
            {totalOrdersCount}
          </p>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <Zap className="w-3 h-3 fill-emerald-500 text-emerald-500" />
            <span>{t.realtimeSync}</span>
          </div>

          {/* Real Mini Bar Chart of Last 5 Days */}
          <div className="h-9 mt-2 flex items-end gap-1.5 pt-2">
            {last5d.map((d, i) => {
              const hPercent = Math.max(15, Math.round((d.ordersCount / maxOrders5d) * 100));
              return (
                <div
                  key={i}
                  title={`${d.day}: ${d.ordersCount} đơn`}
                  className={`flex-1 rounded-sm transition-all ${
                    i === last5d.length - 1
                      ? 'bg-blue-600 dark:bg-blue-500 animate-pulse'
                      : 'bg-blue-300 dark:bg-slate-600'
                  }`}
                  style={{ height: `${hPercent}%` }}
                />
              );
            })}
          </div>
        </div>

        {/* Card 4: Tổng khách hàng */}
        <div
          id="metric-total-customers"
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
              {language === 'vi' ? 'TỔNG KHÁCH HÀNG' : 'TOTAL CUSTOMERS'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1.5 tracking-tight font-mono">
            {totalCustomersCount.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+{newCustomersThisWeek} {language === 'vi' ? 'tương tác' : 'active'}</span>
            <span className="text-slate-400 dark:text-slate-400 font-normal text-[11px]">
              {language === 'vi' ? 'gần đây' : 'recent'}
            </span>
          </div>

          {/* Blue Sparkline */}
          <div className="h-9 mt-2 overflow-hidden">
            <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
              <path
                d={sparkline1.linePath}
                fill="none"
                stroke="#2563EB"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 5: Giá trị tồn kho */}
        <div
          id="metric-inventory-value"
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
              {t.inventoryValuation}
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1.5 tracking-tight font-mono">
            {formatCurr(totalInventoryValue)}
          </p>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            {inStockCount}/{products.length} {language === 'vi' ? 'mặt hàng sẵn có' : 'items in stock'} ({inStockRatioPercent}%)
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, inStockRatioPercent))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Live Activity Feed + AI Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Real-time Live Activity Stream (2 cols) */}
        <div className="lg:col-span-2">
          <RealtimeLiveActivityFeed
            activities={realtimeActivities}
            onOpenRestockModal={onOpenRestockModal}
            isDark={isDark}
          />
        </div>

        {/* Right: AI nhận xét hôm nay (1 col) */}
        <div
          id="ai-insight-card"
          className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center border border-slate-700/50 shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-slate-900 dark:text-white">
                  {language === 'vi' ? 'AI Trợ lý Thời gian thực' : 'Real-time AI Copilot'}
                </h2>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  ● {language === 'vi' ? 'Giám sát tự động 24/7' : '24/7 Automated Monitoring'}
                </span>
              </div>
            </div>

            <div className="mt-4 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {language === 'vi' ? (
                <>
                  Hệ thống ghi nhận <span className="text-emerald-600 dark:text-emerald-400 font-bold">{totalOrdersCount} đơn hàng</span> hôm nay. Sản phẩm công nghệ và phụ kiện đang có sức mua mạnh nhất qua kênh trực tuyến.
                </>
              ) : (
                <>
                  System recorded <span className="text-emerald-600 dark:text-emerald-400 font-bold">{totalOrdersCount} orders</span> today. Tech products and accessories show strong velocity across channels.
                </>
              )}
            </div>

            {/* Warning Box */}
            {lowStockItems.length > 0 && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">
                    {lowStockItems.length} {language === 'vi' ? 'sản phẩm' : 'products'}
                  </span>{' '}
                  {language === 'vi'
                    ? 'đang chạm ngưỡng tồn kho tối thiểu. Đề xuất lập phiếu nhập kho để không đứt hàng.'
                    : 'reached safety stock threshold. Restocking purchase order recommended.'}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              id="ai-view-sales-details-btn"
              onClick={() => onTabChange('pos')}
              className={`w-full py-2.5 px-3.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                isDark
                  ? 'border-slate-700 hover:bg-slate-800 text-slate-200'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Eye className="w-4 h-4 text-slate-400 dark:text-slate-300" />
              <span>{t.createOrderAction}</span>
            </button>

            <button
              id="ai-order-restock-btn"
              onClick={() => onOpenRestockModal()}
              className="w-full py-2.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 active:scale-[0.99] transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{t.restockNow}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Middle Section: Interactive Revenue Chart + Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Revenue Chart (2 cols) */}
        <div
          id="revenue-chart-card"
          className={`lg:col-span-2 p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                {t.salesChartTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.salesChartSubtitle}
              </p>
            </div>
            <div className="relative">
              <select
                id="chart-period-select"
                value={chartPeriod}
                onChange={(e) => setChartPeriod(e.target.value as any)}
                className={`appearance-none text-xs font-medium py-1.5 pl-3 pr-7 rounded-lg border outline-none cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="7days">{t.chartPeriod7days}</option>
                <option value="30days">{t.chartPeriod30days}</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* SVG Smooth Curve Area Chart */}
          <div className="relative w-full h-64 mt-2">
            <svg
              viewBox="0 0 400 200"
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartBlueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Grid Horizontal Lines */}
              <line x1="0" y1="40" x2="400" y2="40" stroke={isDark ? '#334155' : '#F1F5F9'} strokeWidth="1" />
              <line x1="0" y1="90" x2="400" y2="90" stroke={isDark ? '#334155' : '#F1F5F9'} strokeWidth="1" />
              <line x1="0" y1="140" x2="400" y2="140" stroke={isDark ? '#334155' : '#F1F5F9'} strokeWidth="1" />
              <line x1="0" y1="180" x2="400" y2="180" stroke={isDark ? '#334155' : '#F1F5F9'} strokeWidth="1" />

              {/* Gradient Area */}
              <path d={areaPath} fill="url(#chartBlueGrad)" />

              {/* Dynamic Bézier Curve Line */}
              <path
                d={linePath}
                fill="none"
                stroke="#2563EB"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Node Circles */}
              {chartPoints.map((pt, idx) => (
                <g
                  key={idx}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint?.day === pt.day ? 6.5 : (periodDays === 7 ? 4.5 : 3)}
                    fill="white"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    className="transition-all"
                  />
                  {hoveredPoint?.day === pt.day && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="12"
                      fill="#2563EB"
                      fillOpacity="0.25"
                      className="animate-ping"
                    />
                  )}
                </g>
              ))}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && (
              <div
                className="absolute bg-slate-900/95 backdrop-blur-sm text-white text-xs py-2 px-3.5 rounded-xl shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full z-20 border border-slate-700 min-w-[140px]"
                style={{
                  left: `${(hoveredPoint.x / 400) * 100}%`,
                  top: `${(hoveredPoint.y / 200) * 100}%`,
                  marginTop: '-12px',
                }}
              >
                <div className="text-[10px] text-slate-400 font-medium">{hoveredPoint.fullDate}</div>
                <div className="text-sm text-emerald-400 font-bold font-mono mt-0.5">
                  {formatCurr(hoveredPoint.revenue)}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-300 mt-1 pt-1 border-t border-slate-800">
                  <span>{language === 'vi' ? 'Đơn hàng:' : 'Orders:'} <b className="text-white">{hoveredPoint.ordersCount}</b></span>
                  <span>{language === 'vi' ? 'Lợi nhuận:' : 'Profit:'} <b className="text-emerald-300">{formatCurr(hoveredPoint.profit)}</b></span>
                </div>
              </div>
            )}

            {/* Dynamic X-axis labels */}
            <div className="flex justify-between items-center px-4 text-xs font-semibold text-slate-500 dark:text-slate-300 mt-2">
              {chartPoints
                .filter((_, idx) => (periodDays === 30 ? idx % 5 === 0 || idx === chartPoints.length - 1 : true))
                .map((d, idx) => (
                  <span
                    key={idx}
                    className={`cursor-pointer transition-colors ${
                      hoveredPoint?.day === d.day ? 'text-blue-600 dark:text-blue-400 font-bold scale-105' : ''
                    }`}
                  >
                    {d.day}
                  </span>
                ))}
            </div>

            {/* Dynamic Peak Revenue Note */}
            <div className="flex justify-between items-center px-4 text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              <span>{language === 'vi' ? 'Đáy: 0đ' : 'Base: 0'}</span>
              <span>{language === 'vi' ? 'Đỉnh kỳ này' : 'Period Peak'}: <b className="text-slate-700 dark:text-slate-300">{formatCurr(maxPeriodRevenue)}</b></span>
            </div>
          </div>
        </div>

        {/* Right: Low Stock Alert List */}
        <div
          id="low-stock-card"
          className={`p-5 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                {t.lowStockAlert}
              </h2>
              <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300 text-xs font-bold flex items-center justify-center">
                {lowStockItems.length}
              </span>
            </div>
            <button
              onClick={() => onTabChange('inventory')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t.viewDetails}
            </button>
          </div>

          {/* List of low stock products */}
          <div className="space-y-3">
            {lowStockItems.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {t.productCode}: {item.sku || item.code}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.stock} {language === 'vi' ? 'cái' : 'units'}
                    </span>
                    <div className="mt-0.5">
                      <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300 border dark:border-red-800/40">
                        • {item.stock === 0 ? t.stockStatusOut : t.stockStatusLow}
                      </span>
                    </div>
                  </div>

                  <button
                    id={`btn-dash-restock-${item.id}`}
                    onClick={() => onOpenRestockModal(item.id)}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 border border-blue-200 dark:border-blue-800/60 transition-colors"
                    title={`Restock ${item.name}`}
                  >
                    {t.restockNow}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Selling Products Table */}
      <div
        id="top-selling-card"
        className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">
              {t.topSellingProducts}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.topSellingSubtitle}
            </p>
          </div>
          <button
            onClick={() => onTabChange('products')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            {language === 'vi' ? `Xem tất cả ${products.length} sản phẩm` : `View all ${products.length} products`}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase border-b border-slate-100 dark:border-slate-800">
                <th className="pb-3 font-semibold">{t.productName}</th>
                <th className="pb-3 font-semibold text-center">{t.stock}</th>
                <th className="pb-3 font-semibold text-center">{t.sold}</th>
                <th className="pb-3 font-semibold text-right">{t.todayRevenue}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {bestSellers.map((product) => (
                <tr key={product.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="py-3 flex items-center gap-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="font-semibold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {product.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{product.category}</p>
                    </div>
                  </td>
                  <td className="py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        product.stock <= 5
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="py-3 text-center text-xs font-bold text-slate-900 dark:text-white">
                    {product.soldCount || 10}
                  </td>
                  <td className="py-3 text-right text-xs font-bold text-slate-900 dark:text-white font-mono">
                    {formatCurr((product.soldCount || 10) * product.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
