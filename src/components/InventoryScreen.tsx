import React, { useState } from 'react';
import {
  Boxes,
  Building2,
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  TrendingDown,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { Product } from '../types';
import { formatNumber } from '../utils/formatters';
import { useLanguage } from '../utils/i18n';

interface InventoryScreenProps {
  products: Product[];
  onOpenRestockModal: (productId?: string) => void;
  isDark?: boolean;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  products,
  onOpenRestockModal,
  isDark,
}) => {
  const { language, t, formatCurr } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const totalInventoryCount = products.reduce((sum, p) => sum + p.stock, 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);
  const lowStockCount = products.filter((p) => p.stock <= 10).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  const filteredProducts = products.filter(
    (p) =>
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="inventory-screen" className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.inventoryTitle}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-300 mt-0.5 font-normal">
            {t.inventorySubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-inventory-restock"
            onClick={() => onOpenRestockModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t.createRestockOrder}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
            {t.totalStockCount}
          </span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatNumber(totalInventoryCount)} {language === 'vi' ? 'chiếc' : 'units'}
          </p>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            {language === 'vi' ? 'Kho hàng tại quầy cửa hàng' : 'Store & Warehouse Stock'}
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
            {t.totalStockValue}
          </span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurr(totalInventoryValue)}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-300 font-medium">
            {language === 'vi' ? 'Theo giá vốn nhập' : 'Based on cost price'}
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
            {t.lowStockWarning}
          </span>
          <p className="text-2xl font-bold text-amber-500 dark:text-amber-400 mt-1">
            {lowStockCount} {language === 'vi' ? 'sản phẩm' : 'items'}
          </p>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
            {language === 'vi' ? 'Tồn kho ≤ 10 cái' : 'Stock ≤ 10 units'}
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <span className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
            {t.outOfStockCount}
          </span>
          <p className="text-2xl font-bold text-red-500 dark:text-red-400 mt-1">
            {outOfStockCount} {language === 'vi' ? 'sản phẩm' : 'items'}
          </p>
          <span className="text-xs text-red-600 dark:text-red-400 font-semibold">
            {language === 'vi' ? 'Cần nhập bổ sung khẩn cấp' : 'Urgent restock needed'}
          </span>
        </div>
      </div>

      {/* Single Store & Warehouse Overview Card */}
      <div
        className={`p-5 rounded-2xl border transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  {language === 'vi' ? 'Cửa hàng & Kho hàng chính' : 'Main Store & Warehouse'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  {language === 'vi' ? '1 Cửa hàng duy nhất' : 'Single Store'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                68 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM • {language === 'vi' ? 'Quản lý: Nguyễn Tất Phi' : 'Manager: Nguyen Tat Phi'} (0909 888 777)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
            <div className="text-left md:text-right">
              <span className="text-slate-400 text-[11px] block">{language === 'vi' ? 'Mặt hàng có sẵn' : 'Available Items'}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {products.filter((p) => p.stock > 10).length} {language === 'vi' ? 'mã hàng' : 'items'}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
            <div className="text-left md:text-right">
              <span className="text-slate-400 text-[11px] block">{language === 'vi' ? 'Cảnh báo tồn thấp' : 'Low Stock'}</span>
              <span className="text-amber-500 font-bold">
                {lowStockCount} {language === 'vi' ? 'mã hàng' : 'items'}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
            <div className="text-left md:text-right">
              <span className="text-slate-400 text-[11px] block">{language === 'vi' ? 'Hết hàng' : 'Out of Stock'}</span>
              <span className="text-red-500 font-bold">
                {outOfStockCount} {language === 'vi' ? 'mã hàng' : 'items'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Stock Table */}
      <div
        className={`p-5 rounded-2xl border transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <h2 className="font-bold text-base text-slate-900 dark:text-white">
            {t.detailedInventoryTable}
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchStockPlaceholder}
              className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border outline-none transition-all ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500'
              }`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase border-b border-slate-100 dark:border-slate-800">
                <th className="pb-3">{t.productName}</th>
                <th className="pb-3">{t.productCategory}</th>
                <th className="pb-3 text-right">{t.productCost}</th>
                <th className="pb-3 text-right">{t.productPrice}</th>
                <th className="pb-3 text-center">{t.productStock}</th>
                <th className="pb-3 text-center">{t.productStatus}</th>
                <th className="pb-3 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="py-3 flex items-center gap-2.5">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-8 h-8 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{prod.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{prod.code}</p>
                    </div>
                  </td>
                  <td className="py-3 text-slate-700 dark:text-slate-200 font-medium">{prod.category}</td>
                  <td className="py-3 text-right font-medium text-slate-600 dark:text-slate-300">
                    {formatCurr(prod.costPrice)}
                  </td>
                  <td className="py-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatCurr(prod.price)}
                  </td>
                  <td className="py-3 text-center font-bold text-slate-900 dark:text-white">{prod.stock}</td>
                  <td className="py-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        prod.stock === 0
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border dark:border-red-800/40'
                          : prod.stock <= 10
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border dark:border-amber-800/40'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border dark:border-emerald-800/40'
                      }`}
                    >
                      {prod.stock === 0 ? t.stockStatusOut : prod.stock <= 10 ? t.stockStatusLow : t.stockStatusIn}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <button
                      id={`btn-restock-${prod.id}`}
                      onClick={() => onOpenRestockModal(prod.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 border border-blue-200 dark:border-blue-800/60 transition-colors inline-flex items-center gap-1"
                      title={t.restockNow}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{t.restockNow}</span>
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
