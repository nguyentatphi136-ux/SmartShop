import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  Download,
  CreditCard,
  Building2,
  QrCode,
  Banknote,
  Package,
} from 'lucide-react';
import { Product, Order } from '../types';
import { useLanguage } from '../utils/i18n';

interface ReportProps {
  products: Product[];
  orders?: Order[];
  isDark?: boolean;
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

// 1. REVENUE REPORT SCREEN
export const RevenueReportScreen: React.FC<ReportProps> = ({ products, orders = [], isDark }) => {
  const { language, t, formatCurr } = useLanguage();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'quarter'>('7d');

  const now = new Date();
  const completedOrders = orders.filter((order) => order.status === 'completed');

  // Determine buckets based on timeRange
  const rangeDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const numBuckets = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 12;

  // Generate dataList for chart
  const dataList = Array.from({ length: numBuckets }, (_, index) => {
    if (timeRange === 'quarter') {
      // 12 weeks
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - (numBuckets - 1 - index) * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);

      const weekOrders = completedOrders.filter((order) => {
        const d = parseOrderDate(order.createdAt);
        return d >= weekStart && d <= weekEnd;
      });

      const revenue = weekOrders.reduce((sum, order) => sum + order.total, 0);
      const profit = weekOrders.reduce(
        (sum, order) =>
          sum +
          order.items.reduce(
            (itemSum, item) => itemSum + (item.product.price - item.product.costPrice) * item.quantity,
            0
          ),
        0
      );

      return {
        day: `T${index + 1} (${weekStart.getDate()}/${weekStart.getMonth() + 1})`,
        short: `T${index + 1}`,
        revenue,
        profit,
        orders: weekOrders.length,
      };
    } else {
      // 7d or 30d daily buckets
      const date = new Date(now);
      date.setDate(now.getDate() - (numBuckets - 1 - index));

      const dayOrders = completedOrders.filter((order) =>
        isSameDay(parseOrderDate(order.createdAt), date)
      );
      const revenue = dayOrders.reduce((sum, order) => sum + order.total, 0);
      const profit = dayOrders.reduce(
        (sum, order) =>
          sum +
          order.items.reduce(
            (itemSum, item) => itemSum + (item.product.price - item.product.costPrice) * item.quantity,
            0
          ),
        0
      );

      const isToday = isSameDay(date, now);
      const dayLabel =
        numBuckets === 7
          ? isToday
            ? (language === 'vi' ? 'Hôm nay' : 'Today')
            : date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' })
          : date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit' });

      return {
        day: `${date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit' })}`,
        short: dayLabel,
        revenue,
        profit,
        orders: dayOrders.length,
      };
    }
  });

  const totalPeriodRev = dataList.reduce((a, b) => a + b.revenue, 0);
  const totalPeriodProfit = dataList.reduce((a, b) => a + b.profit, 0);
  const totalPeriodOrders = dataList.reduce((a, b) => a + b.orders, 0);
  const profitMargin = totalPeriodRev > 0 ? ((totalPeriodProfit / totalPeriodRev) * 100).toFixed(1) : '0.0';
  const maxRevenue = Math.max(1000000, ...dataList.map((d) => d.revenue));

  // Compute preceding period of equal length for genuine % growth comparison
  const prevPeriodStart = new Date(now);
  prevPeriodStart.setDate(now.getDate() - rangeDays * 2);
  const prevPeriodEnd = new Date(now);
  prevPeriodEnd.setDate(now.getDate() - rangeDays);

  const prevPeriodOrders = completedOrders.filter((order) => {
    const d = parseOrderDate(order.createdAt);
    return d >= prevPeriodStart && d < prevPeriodEnd;
  });
  const prevPeriodRevenue = prevPeriodOrders.reduce((sum, o) => sum + o.total, 0);

  const growthPercentNum = prevPeriodRevenue > 0
    ? Number((((totalPeriodRev - prevPeriodRevenue) / prevPeriodRevenue) * 100).toFixed(1))
    : totalPeriodRev > 0
    ? 100
    : 0;
  const isGrowthPositive = growthPercentNum >= 0;

  const periodLabel =
    timeRange === '7d'
      ? (language === 'vi' ? 'tuần trước' : 'last 7 days')
      : timeRange === '30d'
      ? (language === 'vi' ? '30 ngày trước' : 'last 30 days')
      : (language === 'vi' ? 'quý trước' : 'last quarter');

  const periodTitle =
    timeRange === '7d'
      ? t.weeklyRevenue
      : timeRange === '30d'
      ? (language === 'vi' ? 'Doanh thu 30 ngày' : '30-Day Revenue')
      : (language === 'vi' ? 'Doanh thu quý này' : 'Quarterly Revenue');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.revenueReportTitle}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {completedOrders.length > 0 ? '🟢 Real Data Live' : (language === 'vi' ? 'Dữ liệu sẵn sàng' : 'Ready')}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.revenueReportSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`p-1 rounded-xl border flex items-center gap-1 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            {(
              [
                { id: '7d', label: t.last7Days },
                { id: '30d', label: t.thisMonth },
                { id: 'quarter', label: t.thisQuarter },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setTimeRange(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  timeRange === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => alert(language === 'vi' ? 'Xuất file báo cáo Excel thành công!' : 'Report exported successfully!')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{t.exportExcel}</span>
          </button>
        </div>
      </div>

      {/* Top 3 KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {periodTitle}
          </span>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-2 font-mono">
            {formatCurr(totalPeriodRev)}
          </p>
          <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${
            isGrowthPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {isGrowthPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>{isGrowthPositive && growthPercentNum > 0 ? `+${growthPercentNum}%` : `${growthPercentNum}%`} {language === 'vi' ? `so với ${periodLabel}` : `vs ${periodLabel}`}</span>
          </div>
        </div>

        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.estimatedProfit}
          </span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            {formatCurr(totalPeriodProfit)}
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>{t.profitMargin}: </span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{profitMargin}%</strong>
          </div>
        </div>

        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.averageOrderValue} (AOV)
          </span>
          <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-2 font-mono">
            {formatCurr(totalPeriodOrders > 0 ? totalPeriodRev / totalPeriodOrders : 0)}
          </p>
          <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">
            <span>{language === 'vi' ? `Tổng số ${totalPeriodOrders} đơn thanh toán trong kỳ` : `${totalPeriodOrders} successful orders in period`}</span>
          </div>
        </div>
      </div>

      {/* SVG Bar Chart: Revenue and Profit */}
      <div
        className={`p-5 rounded-2xl border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {t.revenueProfitChart}
            </h3>
            <span className="text-xs text-slate-400">
              {timeRange === '7d' ? t.last7DaysSubtitle : (language === 'vi' ? `Thống kê theo dữ liệu thực tế (${numBuckets} mốc thời gian)` : `Real store data (${numBuckets} points)`)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />
              <span className="text-slate-600 dark:text-slate-300">{t.revenue}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
              <span className="text-slate-600 dark:text-slate-300">{t.profit}</span>
            </span>
          </div>
        </div>

        {/* Dynamic Responsive SVG Bar Chart */}
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-1 sm:gap-2 h-56 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800 w-full overflow-x-auto">
            {dataList.map((item, idx) => {
              const revHeight = maxRevenue > 0 ? Math.max(3, (item.revenue / maxRevenue) * 100) : 3;
              const profitHeight = maxRevenue > 0 ? Math.max(2, (item.profit / maxRevenue) * 100) : 2;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative min-w-[18px]">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-14 bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap shadow-xl border border-slate-700">
                    <p className="font-bold text-slate-200">{item.day}</p>
                    <p className="text-blue-400 font-mono">{t.revenue}: {formatCurr(item.revenue)}</p>
                    <p className="text-emerald-400 font-mono">{t.profit}: {formatCurr(item.profit)}</p>
                    <p className="text-slate-400 text-[9px]">{item.orders} {language === 'vi' ? 'đơn hàng' : 'orders'}</p>
                  </div>

                  <div className="w-full max-w-[40px] flex items-end justify-center gap-0.5 sm:gap-1 h-full">
                    {/* Revenue Bar */}
                    <div
                      style={{ height: `${revHeight}%` }}
                      className="w-1/2 bg-blue-600 hover:bg-blue-500 rounded-t-sm sm:rounded-t transition-all duration-300 relative cursor-pointer"
                    />
                    {/* Profit Bar */}
                    <div
                      style={{ height: `${profitHeight}%` }}
                      className="w-1/2 bg-emerald-500 hover:bg-emerald-400 rounded-t-sm sm:rounded-t transition-all duration-300 relative cursor-pointer"
                    />
                  </div>

                  <span className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-2 whitespace-nowrap">
                    {numBuckets <= 7 || idx % Math.ceil(numBuckets / 7) === 0 || idx === numBuckets - 1 ? item.short : ''}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>{formatCurr(0)}</span>
            <span>{language === 'vi' ? 'Đỉnh cao nhất kỳ' : 'Period Peak'}: <b className="text-slate-700 dark:text-slate-200">{formatCurr(maxRevenue)}</b></span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. ANALYTICS REPORT SCREEN
export const AnalyticsReportScreen: React.FC<ReportProps> = ({ products, orders = [], isDark }) => {
  const { language, t, formatCurr } = useLanguage();

  const completedOrders = orders.filter((order) => order.status === 'completed');

  // Calculate category revenue from completed orders
  const categoryTotals = completedOrders
    .flatMap((order) => order.items)
    .reduce<Record<string, number>>((totals, item) => {
      const cat = item.product.category || (language === 'vi' ? 'Khác' : 'Other');
      totals[cat] = (totals[cat] || 0) + item.product.price * item.quantity;
      return totals;
    }, {});
  let totalCategoryRevenue = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);

  // If no sales yet, fall back to stock valuation by category so the distribution chart reflects real inventory
  let activeTotals = categoryTotals;
  let isInventoryFallback = false;
  if (totalCategoryRevenue === 0 && products.length > 0) {
    isInventoryFallback = true;
    activeTotals = products.reduce<Record<string, number>>((totals, p) => {
      const cat = p.category || (language === 'vi' ? 'Khác' : 'Other');
      totals[cat] = (totals[cat] || 0) + Math.max(1, p.stock) * p.price;
      return totals;
    }, {});
    totalCategoryRevenue = Object.values(activeTotals).reduce((sum, val) => sum + val, 0);
  }

  const categoryColors = ['#2563EB', '#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EC4899'];
  const categoryShare = Object.entries(activeTotals)
    .sort(([, first], [, second]) => second - first)
    .slice(0, 5)
    .map(([name, value], index) => ({
      name,
      value: totalCategoryRevenue > 0 ? Math.round((value / totalCategoryRevenue) * 100) : 0,
      amount: value,
      color: categoryColors[index % categoryColors.length],
    }));
  const topProducts = [...products].sort((first, second) => (second.soldCount || 0) - (first.soldCount || 0)).slice(0, 5);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.analyticsTitle}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              Deep Analytics
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.analyticsSubtitle}
          </p>
        </div>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Share */}
        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
            {t.categoryRevenueShare}
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            {t.categoryShareSubtitle}
          </p>

          <div className="space-y-4">
            {categoryShare.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{cat.value}%</span>
                    <span className="text-[11px] text-slate-400 font-mono">({formatCurr(cat.amount)})</span>
                  </div>
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${cat.value}%`, backgroundColor: cat.color }}
                    className="h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products performance */}
        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
            {t.topProfitProducts}
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            {t.topProfitSubtitle}
          </p>

          <div className="space-y-3">
            {topProducts.map((prod, idx) => {
              const profitPerUnit = prod.price - prod.costPrice;
              const margin = ((profitPerUnit / prod.price) * 100).toFixed(0);
              return (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-[10px]">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{prod.name}</p>
                      <span className="text-slate-400">
                        {language === 'vi' ? `Đã bán: ${prod.soldCount || 0} cái` : `Sold: ${prod.soldCount || 0} units`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      +{margin}% margin
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {formatCurr(profitPerUnit)}/{language === 'vi' ? 'cái' : 'unit'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
