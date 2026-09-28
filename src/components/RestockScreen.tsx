import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Package,
  Building2,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { RestockOrder, Product } from '../types';
import { useLanguage } from '../utils/i18n';

interface RestockScreenProps {
  restockOrders: RestockOrder[];
  products: Product[];
  onOpenRestockModal: (productId?: string) => void;
  onReceiveOrder?: (orderId: string) => void;
  isDark?: boolean;
}

export const RestockScreen: React.FC<RestockScreenProps> = ({
  restockOrders,
  products,
  onOpenRestockModal,
  onReceiveOrder,
  isDark,
}) => {
  const { language, t, formatCurr } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_transit' | 'pending'>('all');

  const filteredOrders = restockOrders.filter((ord) => {
    const matchesSearch =
      ord.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.branch.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ord.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRestockValue = restockOrders.reduce((acc, o) => acc + o.totalCost, 0);
  const inTransitCount = restockOrders.filter((o) => o.status === 'in_transit').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.restockTitle}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
              {restockOrders.length} {language === 'vi' ? 'phiếu nhập' : 'orders'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.restockSubtitle}
          </p>
        </div>

        <button
          id="btn-create-restock-order"
          onClick={() => onOpenRestockModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t.createRestockOrder}</span>
        </button>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={`p-4 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.totalRestockValue}
          </span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurr(totalRestockValue)}
          </p>
          <span className="text-[11px] text-slate-400">{t.paidToSuppliers}</span>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.inTransitOrders}
          </span>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {inTransitCount} {language === 'vi' ? 'kiện hàng' : 'shipments'}
          </p>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            {t.shippingToWarehouse}
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.productsNeedRestock}
          </span>
          <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
            {products.filter((p) => p.stock <= 10).length} {language === 'vi' ? 'mặt hàng' : 'items'}
          </p>
          <span className="text-[11px] text-red-600 dark:text-red-400 font-medium">
            {t.belowSafetyThreshold}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t.searchRestockPlaceholder}
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
          {(
            [
              { id: 'all', label: t.allStatuses },
              { id: 'in_transit', label: t.inTransit },
              { id: 'completed', label: t.completed },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === item.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Restock Orders Table */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead
              className={`border-b text-[11px] uppercase font-bold tracking-wider ${
                isDark
                  ? 'bg-slate-800/60 border-slate-800 text-slate-400'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <tr>
                <th className="py-3 px-4">{t.restockCode}</th>
                <th className="py-3 px-4">{t.timestamp}</th>
                <th className="py-3 px-4">{t.product}</th>
                <th className="py-3 px-4 text-center">{t.quantity}</th>
                <th className="py-3 px-4 text-right">{t.totalCost}</th>
                <th className="py-3 px-4">{t.receivingBranch}</th>
                <th className="py-3 px-4 text-center">{t.status}</th>
                <th className="py-3 px-4 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.map((ord) => (
                <tr
                  key={ord.id}
                  className={`group transition-colors ${
                    isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    {ord.code}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {ord.createdAt}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={ord.product.image}
                        alt={ord.product.name}
                        className="w-9 h-9 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 border"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white leading-tight">
                          {ord.product.name}
                        </p>
                        <span className="text-[11px] text-slate-400">
                          {ord.product.code} • {ord.product.category}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-slate-900 dark:text-white">
                      +{ord.quantity} {language === 'vi' ? 'cái' : 'pcs'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                    {formatCurr(ord.totalCost)}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                    {ord.branch}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {ord.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{t.receivedInWarehouse}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                        <Clock className="w-3 h-3 animate-pulse" />
                        <span>{t.shippingInTransit}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {ord.status === 'in_transit' ? (
                      <button
                        onClick={() => onReceiveOrder && onReceiveOrder(ord.id)}
                        className="px-3 py-1 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800/50 transition-colors"
                      >
                        {t.receiveGoods}
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenRestockModal(ord.product.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors"
                      >
                        {t.reorder}
                      </button>
                    )}
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
