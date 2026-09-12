import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Printer,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  QrCode,
  Banknote,
  Building2,
  Calendar,
  X,
} from 'lucide-react';
import { Order } from '../types';
import { useLanguage } from '../utils/i18n';

interface InvoicesScreenProps {
  orders: Order[];
  onReprintReceipt?: (order: Order) => void;
  isDark?: boolean;
}

export const InvoicesScreen: React.FC<InvoicesScreenProps> = ({
  orders,
  onReprintReceipt,
  isDark,
}) => {
  const { language, t, formatCurr } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'qr_code' | 'bank_transfer' | 'cash' | 'card'>('all');

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customer && order.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      order.cashier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPayment = paymentFilter === 'all' || order.paymentMethod === paymentFilter;
    return matchesSearch && matchesPayment;
  });

  const totalRevenue = orders
    .filter((o) => o.status === 'completed')
    .reduce((acc, o) => acc + o.total, 0);

  const getPaymentIcon = (method: Order['paymentMethod']) => {
    switch (method) {
      case 'qr_code':
        return <QrCode className="w-3.5 h-3.5" />;
      case 'bank_transfer':
        return <Building2 className="w-3.5 h-3.5" />;
      case 'card':
        return <CreditCard className="w-3.5 h-3.5" />;
      case 'cash':
      default:
        return <Banknote className="w-3.5 h-3.5" />;
    }
  };

  const getPaymentLabel = (method: Order['paymentMethod']) => {
    switch (method) {
      case 'qr_code':
        return 'VietQR Pro';
      case 'bank_transfer':
        return t.bankTransfer;
      case 'card':
        return t.cardPos;
      case 'cash':
      default:
        return t.cashPayment;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.invoicesTitle}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
              {orders.length} {language === 'vi' ? 'đơn hàng' : 'orders'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.invoicesSubtitle}
          </p>
        </div>

        <div
          className={`px-4 py-2.5 rounded-xl border flex items-center gap-3 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {language === 'vi' ? 'Tổng giá trị đơn:' : 'Total Orders Value:'}
          </span>
          <span className="text-base font-bold text-blue-600 dark:text-blue-400">
            {formatCurr(totalRevenue)}
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
            placeholder={t.searchInvoicePlaceholder}
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
              { id: 'all', label: language === 'vi' ? 'Tất cả PTTT' : 'All Payments' },
              { id: 'qr_code', label: 'VietQR' },
              { id: 'bank_transfer', label: t.bankTransfer },
              { id: 'cash', label: t.cashPayment },
              { id: 'card', label: t.cardPos },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setPaymentFilter(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                paymentFilter === item.id
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

      {/* Orders Table */}
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
                <th className="py-3 px-4">{t.invoiceCode}</th>
                <th className="py-3 px-4">{t.createdAt}</th>
                <th className="py-3 px-4">{t.customer}</th>
                <th className="py-3 px-4">{t.paymentMethod}</th>
                <th className="py-3 px-4">{t.cashier}</th>
                <th className="py-3 px-4 text-right">{t.totalAmount}</th>
                <th className="py-3 px-4 text-center">{t.status}</th>
                <th className="py-3 px-4 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className={`group transition-colors ${
                    isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                    {order.code}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {order.createdAt}
                  </td>
                  <td className="py-3 px-4">
                    {order.customer ? (
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {order.customer.name}
                        </span>
                        <span className="text-[11px] text-slate-400">{order.customer.phone}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">{t.guestCustomer}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {getPaymentIcon(order.paymentMethod)}
                      <span>{getPaymentLabel(order.paymentMethod)}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                    {order.cashier}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                    {formatCurr(order.total)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{t.completedOrder}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title={t.viewDetails}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onReprintReceipt && onReprintReceipt(order)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title={t.reprintInvoice}
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base">{t.invoiceDetail} {selectedOrder.code}</h3>
                <span className="text-xs text-slate-400">{selectedOrder.createdAt}</span>
              </div>
            </div>

            {/* Customer & Cashier */}
            <div
              className={`p-3 rounded-xl border text-xs space-y-1 mb-4 ${
                isDark ? 'bg-slate-800/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t.customer}:</span>
                <span className="font-semibold">{selectedOrder.customer?.name || t.guestCustomer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t.cashier}:</span>
                <span className="font-semibold">{selectedOrder.cashier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t.paymentMethod}:</span>
                <span className="font-semibold">{getPaymentLabel(selectedOrder.paymentMethod)}</span>
              </div>
            </div>

            {/* Items list */}
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {selectedOrder.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800"
                >
                  <div>
                    <p className="font-semibold">{item.product.name}</p>
                    <span className="text-slate-400">
                      {item.quantity} × {formatCurr(item.product.price)}
                    </span>
                  </div>
                  <span className="font-bold">{formatCurr(item.quantity * item.product.price)}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="space-y-1 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-slate-500">
                <span>{t.subtotal}:</span>
                <span>{formatCurr(selectedOrder.subtotal)}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>{t.discount}:</span>
                  <span>-{formatCurr(selectedOrder.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                <span>{t.totalPayment}:</span>
                <span className="text-blue-600 dark:text-blue-400">{formatCurr(selectedOrder.total)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setSelectedOrder(null)}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold ${
                  isDark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-700'
                }`}
              >
                {t.close}
              </button>
              <button
                onClick={() => {
                  if (onReprintReceipt) onReprintReceipt(selectedOrder);
                  setSelectedOrder(null);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t.printReceipt}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
