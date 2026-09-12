import React, { useState } from 'react';
import {
  TrendingUp,
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

const REVENUE_BY_DAY_VI = [
  { day: 'T2 (10/08)', short: 'T2', revenue: 14200000, profit: 3400000, orders: 12 },
  { day: 'T3 (11/08)', short: 'T3', revenue: 18500000, profit: 4600000, orders: 16 },
  { day: 'T4 (12/08)', short: 'T4', revenue: 16800000, profit: 3900000, orders: 14 },
  { day: 'T5 (13/08)', short: 'T5', revenue: 22400000, profit: 5800000, orders: 21 },
  { day: 'T6 (14/08)', short: 'T6', revenue: 31200000, profit: 8200000, orders: 29 },
  { day: 'T7 (15/08)', revenue: 45600000, profit: 12400000, orders: 42 },
  { day: 'CN (16/08)', revenue: 38900000, profit: 10100000, orders: 36 },
];

const REVENUE_BY_DAY_EN = [
  { day: 'Mon (10/08)', short: 'Mon', revenue: 14200000, profit: 3400000, orders: 12 },
  { day: 'Tue (11/08)', short: 'Tue', revenue: 18500000, profit: 4600000, orders: 16 },
  { day: 'Wed (12/08)', short: 'Wed', revenue: 16800000, profit: 3900000, orders: 14 },
  { day: 'Thu (13/08)', short: 'Thu', revenue: 22400000, profit: 5800000, orders: 21 },
  { day: 'Fri (14/08)', short: 'Fri', revenue: 31200000, profit: 8200000, orders: 29 },
  { day: 'Sat (15/08)', short: 'Sat', revenue: 45600000, profit: 12400000, orders: 42 },
  { day: 'Sun (16/08)', short: 'Sun', revenue: 38900000, profit: 10100000, orders: 36 },
];

interface ReportProps {
  products: Product[];
  orders?: Order[];
  isDark?: boolean;
}

// 1. REVENUE REPORT SCREEN
export const RevenueReportScreen: React.FC<ReportProps> = ({ products, orders = [], isDark }) => {
  const { language, t, formatCurr } = useLanguage();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'quarter'>('7d');

  const dataList = language === 'vi' ? REVENUE_BY_DAY_VI : REVENUE_BY_DAY_EN;
  const totalWeeklyRev = dataList.reduce((a, b) => a + b.revenue, 0);
  const totalWeeklyProfit = dataList.reduce((a, b) => a + b.profit, 0);
  const profitMargin = ((totalWeeklyProfit / totalWeeklyRev) * 100).toFixed(1);
  const maxRevenue = Math.max(...dataList.map((d) => d.revenue));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.revenueReportTitle}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              Live Data
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
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.weeklyRevenue}
          </span>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">
            {formatCurr(totalWeeklyRev)}
          </p>
          <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+24.8% {language === 'vi' ? 'so với tuần trước' : 'vs last week'}</span>
          </div>
        </div>

        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.estimatedProfit}
          </span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurr(totalWeeklyProfit)}
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>{t.profitMargin}: </span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{profitMargin}%</strong>
          </div>
        </div>

        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.averageOrderValue} (AOV)
          </span>
          <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">
            {formatCurr(totalWeeklyRev / 170)}
          </p>
          <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">
            <span>{language === 'vi' ? 'Tổng số 170 đơn thanh toán thành công' : '170 successful orders in total'}</span>
          </div>
        </div>
      </div>

      {/* SVG Bar Chart: Revenue and Profit */}
      <div
        className={`p-5 rounded-2xl border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {t.revenueProfitChart}
            </h3>
            <span className="text-xs text-slate-400">{t.last7DaysSubtitle}</span>
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

        {/* Custom Responsive SVG Chart */}
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-56 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
            {dataList.map((item, idx) => {
              const revHeight = (item.revenue / maxRevenue) * 100;
              const profitHeight = (item.profit / maxRevenue) * 100;
              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-lg">
                    <p className="font-bold">{item.day}</p>
                    <p>{t.revenue}: {formatCurr(item.revenue)}</p>
                    <p className="text-emerald-400">{t.profit}: {formatCurr(item.profit)}</p>
                  </div>

                  <div className="w-full max-w-[48px] flex items-end justify-center gap-1 h-full">
                    {/* Revenue Bar */}
                    <div
                      style={{ height: `${revHeight}%` }}
                      className="w-1/2 bg-blue-600 hover:bg-blue-700 rounded-t-md transition-all duration-300 relative"
                    />
                    {/* Profit Bar */}
                    <div
                      style={{ height: `${profitHeight}%` }}
                      className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all duration-300 relative"
                    />
                  </div>

                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-2 whitespace-nowrap">
                    {item.day.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>{formatCurr(0)}</span>
            <span>{language === 'vi' ? 'Mốc đỉnh' : 'Peak'}: {formatCurr(maxRevenue)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. ANALYTICS REPORT SCREEN
export const AnalyticsReportScreen: React.FC<ReportProps> = ({ products, isDark }) => {
  const { language, t, formatCurr } = useLanguage();

  const categoryShare = [
    { name: t.catPhones, value: 55, color: '#2563eb' },
    { name: t.catLaptops, value: 25, color: '#4f46e5' },
    { name: t.catAccessories, value: 12, color: '#06b6d4' },
    { name: t.catFashion, value: 8, color: '#10b981' },
  ];

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
                  <span className="font-bold text-slate-900 dark:text-white">{cat.value}%</span>
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
            {products.slice(0, 5).map((prod, idx) => {
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
                        {language === 'vi' ? `Đã bán: ${prod.soldCount || 20} cái` : `Sold: ${prod.soldCount || 20} units`}
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
