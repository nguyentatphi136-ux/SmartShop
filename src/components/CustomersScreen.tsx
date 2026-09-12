import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Crown,
  Award,
  User,
  Phone,
  Mail,
  DollarSign,
  Gift,
  MoreVertical,
  Filter,
  ArrowUpRight,
} from 'lucide-react';
import { Customer } from '../types';
import { formatNumber } from '../utils/formatters';
import { useLanguage } from '../utils/i18n';

interface CustomersScreenProps {
  customers: Customer[];
  onSelectCustomer?: (customer: Customer) => void;
  onAddCustomer?: () => void;
  isDark?: boolean;
}

export const CustomersScreen: React.FC<CustomersScreenProps> = ({
  customers,
  onSelectCustomer,
  onAddCustomer,
  isDark,
}) => {
  const { language, t, formatCurr } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'VVIP' | 'VIP' | 'Chuẩn'>('all');

  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch =
      cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.phone.includes(searchQuery) ||
      (cust.email && cust.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTier = tierFilter === 'all' || cust.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const totalSpentAll = customers.reduce((acc, c) => acc + c.totalSpent, 0);
  const vvipCount = customers.filter((c) => c.tier === 'VVIP').length;
  const vipCount = customers.filter((c) => c.tier === 'VIP').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.customersTitle}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
              {customers.length} {language === 'vi' ? 'thành viên' : 'members'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.customersSubtitle}
          </p>
        </div>

        <button
          id="btn-add-customer"
          onClick={() => {
            if (onAddCustomer) onAddCustomer();
            else alert(language === 'vi' ? 'Chức năng thêm khách hàng mới đang được đồng bộ!' : 'Add customer feature ready!');
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addCustomer}</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={`p-4 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t.totalCustomerSpent}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-2">
            {formatCurr(totalSpentAll)}
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            ↗ +18.5% {language === 'vi' ? 'so với tháng trước' : 'vs last month'}
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t.vvipVipTiers}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-2">
            {vvipCount + vipCount} {language === 'vi' ? 'Khách VIP' : 'VIP Guests'}
          </p>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
            {vvipCount} VVIP (-5%) • {vipCount} VIP (-3%)
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t.rewardPoints}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-2">
            {formatNumber(customers.reduce((acc, c) => acc + c.rewardPoints, 0))} pts
          </p>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            {language === 'vi' ? 'Tỷ lệ quy đổi: 1 điểm = 1.000đ' : '1 point = 1,000 VND'}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t.searchCustomerPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm border outline-none ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['all', 'VVIP', 'VIP', 'Chuẩn'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                tierFilter === tier
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tier === 'all'
                ? t.allTiers
                : `${t.tierLabel} ${tier === 'Chuẩn' ? (language === 'vi' ? 'Chuẩn' : 'Standard') : tier}`}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Table */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead
              className={`border-b text-[11px] uppercase font-bold tracking-wider ${
                isDark ? 'bg-slate-800/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <tr>
                <th className="py-3 px-4">{t.customer}</th>
                <th className="py-3 px-4">{t.contact}</th>
                <th className="py-3 px-4">{t.tierDiscount}</th>
                <th className="py-3 px-4 text-right">{t.rewardPoints}</th>
                <th className="py-3 px-4 text-right">{t.totalSpent}</th>
                <th className="py-3 px-4 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.map((cust) => (
                <tr
                  key={cust.id}
                  className={`group transition-colors ${
                    isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                        {cust.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white leading-tight">
                          {cust.name}
                        </p>
                        <span className="text-[11px] text-slate-400">ID: {cust.id}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cust.phone}</span>
                      </div>
                      {cust.email && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{cust.email}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        cust.tier === 'VVIP'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50'
                          : cust.tier === 'VIP'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {cust.tier === 'VVIP' && <Crown className="w-3 h-3" />}
                      {cust.tier === 'VIP' && <Award className="w-3 h-3" />}
                      {cust.tier === 'Chuẩn' && <User className="w-3 h-3" />}
                      <span>{t.tierLabel} {cust.tier === 'Chuẩn' ? (language === 'vi' ? 'Chuẩn' : 'Standard') : cust.tier}</span>
                      {cust.discountPercent > 0 && (
                        <span className="ml-1 opacity-80">(-{cust.discountPercent}%)</span>
                      )}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {formatNumber(cust.rewardPoints)} pts
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurr(cust.totalSpent)}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onSelectCustomer && onSelectCustomer(cust)}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 transition-colors"
                    >
                      {t.selectPosCustomer}
                    </button>
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
