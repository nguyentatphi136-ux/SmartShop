import React, { useState } from 'react';
import {
  TrendingUp,
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
  Package,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Product, MainTab, Order, RealtimeActivity } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useLanguage } from '../utils/i18n';
import { RealtimeLiveBar } from './RealtimeLiveBar';
import { RealtimeLiveActivityFeed } from './RealtimeLiveActivityFeed';

interface DashboardScreenProps {
  products: Product[];
  orders: Order[];
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

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  products,
  orders,
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
  const [hoveredPoint, setHoveredPoint] = useState<{ day: string; value: number; x: number; y: number } | null>(null);

  // Dynamic real-time revenue & orders aggregation
  const todayRevenue = orders.reduce((acc, o) => acc + o.total, 0);
  const totalOrdersCount = orders.length;
  const totalInventoryValue = products.reduce((acc, p) => acc + p.stock * p.costPrice, 0);

  // Chart data for 7 days
  const baseChartRevenue = todayRevenue > 0 ? todayRevenue : 14500000;
  const chartData = [
    { day: language === 'vi' ? 'T2' : 'Mon', value: 8500000, x: 20, y: 160 },
    { day: language === 'vi' ? 'T3' : 'Tue', value: 12500000, x: 80, y: 140 },
    { day: language === 'vi' ? 'T4' : 'Wed', value: 10200000, x: 140, y: 150 },
    { day: language === 'vi' ? 'T5' : 'Thu', value: 16800000, x: 200, y: 110 },
    { day: language === 'vi' ? 'T6' : 'Fri', value: 9200000, x: 260, y: 165 },
    { day: language === 'vi' ? 'T7' : 'Sat', value: 28500000, x: 320, y: 50 },
    { day: language === 'vi' ? 'Hôm nay' : 'Today', value: baseChartRevenue, x: 380, y: Math.max(15, 170 - Math.min(150, (baseChartRevenue / 40000000) * 150)) },
  ];

  // Filter low stock and out of stock products
  const lowStockItems = products.filter((p) => p.stock <= 5);
  const bestSellers = [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 5);

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
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                dataMode === 'real'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              }`}
            >
              {dataMode === 'real' ? '🟢 Real Store Mode' : '🧪 Demo Simulation'}
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
              <span>{language === 'vi' ? '🟢 Bật Dữ liệu thật' : 'Turn on Real Data'}</span>
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
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1.5 tracking-tight font-mono">
            {formatCurr(todayRevenue)}
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14.8%</span>
            <span className="text-slate-400 dark:text-slate-400 font-normal text-[11px]">{t.comparedToYesterday}</span>
          </div>

          {/* Sparkline */}
          <div className="h-9 mt-2 overflow-hidden">
            <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0,25 Q 25,5 50,22 T 100,5 L 100,30 L 0,30 Z" fill="url(#greenGrad)" />
              <path
                d="M 0,25 Q 25,5 50,22 T 100,5"
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
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1.5 tracking-tight font-mono">
            {formatCurr(345000000 + todayRevenue)}
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+8.2%</span>
            <span className="text-slate-400 dark:text-slate-400 font-normal text-[11px]">
              {language === 'vi' ? 'vs tháng trước' : 'vs last month'}
            </span>
          </div>

          {/* Sparkline */}
          <div className="h-9 mt-2 overflow-hidden">
            <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
              <path d="M 0,28 C 30,26 60,18 100,10 L 100,30 L 0,30 Z" fill="#10B981" fillOpacity="0.15" />
              <path
                d="M 0,28 C 30,26 60,18 100,10"
                fill="none"
                stroke="#10B981"
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
              {t.todayOrders}
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

          {/* Mini Bar Chart */}
          <div className="h-9 mt-2 flex items-end gap-1.5 pt-2">
            <div className="flex-1 bg-blue-100 dark:bg-slate-800 rounded-sm h-3" />
            <div className="flex-1 bg-blue-200 dark:bg-slate-700 rounded-sm h-4" />
            <div className="flex-1 bg-blue-300 dark:bg-slate-600 rounded-sm h-3" />
            <div className="flex-1 bg-blue-400 dark:bg-slate-500 rounded-sm h-6" />
            <div className="flex-1 bg-blue-600 dark:bg-blue-500 rounded-sm h-8 animate-pulse" />
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
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1.5 tracking-tight font-mono">
            1,258
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? '+18 mới' : '+18 new'}</span>
            <span className="text-slate-400 dark:text-slate-400 font-normal text-[11px]">
              {language === 'vi' ? 'tuần này' : 'this week'}
            </span>
          </div>

          {/* Blue Sparkline */}
          <div className="h-9 mt-2 overflow-hidden">
            <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
              <path
                d="M 0,26 C 20,25 40,28 60,25 C 80,22 90,12 100,5"
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
            {language === 'vi' ? 'Kho hàng tại cửa hàng (Dữ liệu thật)' : 'Store & Warehouse (Real Data)'}
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
              <div className="bg-blue-600 dark:bg-blue-500 h-full rounded-full" style={{ width: '72%' }} />
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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
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
              <path
                d="M 20,160 C 50,150 60,140 80,140 C 110,140 120,150 140,150 C 170,150 180,110 200,110 C 230,110 240,165 260,165 C 290,165 300,50 320,50 C 350,50 360,20 380,20 L 380,185 L 20,185 Z"
                fill="url(#chartBlueGrad)"
              />

              {/* Thick Blue Line */}
              <path
                d="M 20,160 C 50,150 60,140 80,140 C 110,140 120,150 140,150 C 170,150 180,110 200,110 C 230,110 240,165 260,165 C 290,165 300,50 320,50 C 350,50 360,20 380,20"
                fill="none"
                stroke="#2563EB"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Interactive Node Circles */}
              {chartData.map((pt, idx) => (
                <g
                  key={idx}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint?.day === pt.day ? 7 : 5}
                    fill="white"
                    stroke="#2563EB"
                    strokeWidth="3"
                    className="transition-all"
                  />
                  {hoveredPoint?.day === pt.day && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="12"
                      fill="#2563EB"
                      fillOpacity="0.2"
                      className="animate-ping"
                    />
                  )}
                </g>
              ))}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && (
              <div
                className="absolute bg-slate-900 text-white text-xs py-1.5 px-3 rounded-xl shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full z-10"
                style={{
                  left: `${(hoveredPoint.x / 400) * 100}%`,
                  top: `${(hoveredPoint.y / 200) * 100}%`,
                  marginTop: '-10px',
                }}
              >
                <div className="font-bold">{hoveredPoint.day}</div>
                <div className="text-blue-300 font-semibold">{formatCurr(hoveredPoint.value)}</div>
              </div>
            )}

            {/* X-axis labels */}
            <div className="flex justify-between items-center px-4 text-xs font-semibold text-slate-500 dark:text-slate-300 mt-2">
              {chartData.map((d) => (
                <span
                  key={d.day}
                  className={`cursor-pointer ${
                    hoveredPoint?.day === d.day ? 'text-blue-600 dark:text-blue-400 font-bold' : ''
                  }`}
                >
                  {d.day}
                </span>
              ))}
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
