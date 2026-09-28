import React, { useState, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Plus,
  Minus,
  Trash2,
  User,
  Sparkles,
  Tag,
  Banknote,
  Building2,
  QrCode,
  CreditCard,
  Receipt,
  Check,
  ChevronRight,
  Package,
  ShoppingBag,
  ArrowLeft,
  Camera,
  ScanLine,
  Smartphone,
  X,
} from 'lucide-react';
import { Product, CartItem, Customer } from '../types';
import { useLanguage } from '../utils/i18n';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface PosScreenProps {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  selectedCustomer: Customer | null;
  onSelectCustomerClick: () => void;
  onCheckout: (paymentMethod: string, voucherCode: string, total: number) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isDark?: boolean;
}

export const PosScreen: React.FC<PosScreenProps> = ({
  products,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  selectedCustomer,
  onSelectCustomerClick,
  onCheckout,
  searchQuery,
  onSearchChange,
  isDark,
}) => {
  const { language, t, formatCurr } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [voucherInput, setVoucherInput] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [voucherError, setVoucherError] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'qr' | 'card'>('transfer');
  const [mobileView, setMobileView] = useState<'products' | 'cart'>('products');
  const [isLiveScannerOpen, setIsLiveScannerOpen] = useState<boolean>(false);
  const [scannerInitialTab, setScannerInitialTab] = useState<'barcode' | 'visual' | 'mobile'>('barcode');

  // Keyboard shortcut F2 for barcode scanner
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setIsLiveScannerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const categories = React.useMemo(() => {
    const list = [{ id: 'all', nameVi: 'Tất cả', nameEn: 'All Categories' }];
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    set.forEach((cat) => {
      list.push({ id: cat, nameVi: cat, nameEn: cat });
    });
    return list;
  }, [products]);

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    const matchesCat = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Calculate Subtotal & VIP discount
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  let customerDiscount = 0;
  if (selectedCustomer) {
    cart.forEach((item) => {
      if (item.product.category === 'Phụ kiện' || selectedCustomer.tier === 'VVIP') {
        customerDiscount += Math.round(
          item.product.price * item.quantity * (selectedCustomer.discountPercent / 100)
        );
      }
    });
  }

  const totalDiscount = customerDiscount + appliedDiscount;
  const totalAmount = Math.max(0, subtotal - totalDiscount);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleApplyVoucher = () => {
    setVoucherError('');
    if (!voucherInput.trim()) return;

    const code = voucherInput.trim().toUpperCase();
    if (code === 'SMART10') {
      setAppliedDiscount(Math.round(subtotal * 0.1));
    } else if (code === 'GIAM500') {
      setAppliedDiscount(500000);
    } else if (code === 'CHAOBAN') {
      setAppliedDiscount(200000);
    } else {
      setVoucherError(language === 'vi' ? 'Mã không hợp lệ hoặc đã hết hạn' : 'Invalid or expired coupon code');
    }
  };

  const renderCartContent = () => (
    <div
      id="pos-cart-panel"
      className={`w-full flex flex-col rounded-2xl border p-4 sm:p-5 transition-all h-full ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {/* Back button on mobile */}
            <button
              onClick={() => setMobileView('products')}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 mr-1"
              title="Quay lại chọn sản phẩm"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="font-bold text-sm tracking-wide uppercase text-slate-900 dark:text-white">
              {t.posCartTitle}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {totalItemCount} {t.itemsUnit}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLiveScannerOpen(true)}
              className="px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Mở máy quét Camera & Barcode (F2)"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Quét SP</span>
            </button>

            {cart.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                {t.clearCart}
              </button>
            )}
          </div>
        </div>

        {/* Customer Select Bar */}
        <div className="mt-3 space-y-2">
          <button
            id="btn-select-customer"
            onClick={onSelectCustomerClick}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
              selectedCustomer
                ? 'bg-blue-50/70 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 font-semibold'
                : isDark
                ? 'border-slate-800 hover:bg-slate-800 text-slate-300'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400 dark:text-slate-300" />
              <span className="font-medium truncate">
                {selectedCustomer
                  ? `${selectedCustomer.name} (${selectedCustomer.tier})`
                  : t.selectCustomer}
              </span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300" />
          </button>

          {/* VVIP Perk Banner */}
          {selectedCustomer && (
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="truncate">
                {language === 'vi'
                  ? `Khách hàng ${selectedCustomer.tier} - Giảm ${selectedCustomer.discountPercent}% phụ kiện`
                  : `${selectedCustomer.tier} Member - ${selectedCustomer.discountPercent}% VIP Discount`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Cart Item List: chiếm phần còn trống, món mới nằm ngay dưới ô chọn khách và cuộn bên trong */}
      <div className="flex-1 overflow-y-auto my-3 divide-y divide-slate-100 dark:divide-slate-800 min-h-[160px] max-h-72 lg:max-h-none pr-1">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-300 py-8">
            <Package className="w-8 h-8 stroke-1 mb-2 opacity-50" />
            <p className="text-xs font-medium">{t.cartEmpty}</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.product.id} className="py-2.5 flex items-center gap-2.5">
              <img
                src={item.product.image}
                alt={item.product.name}
                className="w-11 h-11 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0"
                referrerPolicy="no-referrer"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {item.product.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formatCurr(item.product.price)} / {language === 'vi' ? 'cái' : 'pc'}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveFromCart(item.product.id)}
                    className="text-slate-400 hover:text-red-500 p-0.5 flex-shrink-0"
                    title={language === 'vi' ? 'Xóa khỏi giỏ' : 'Remove'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-1.5">
                  {/* Stepper */}
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, -1)}
                      className="px-2 py-1 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 text-xs font-bold text-slate-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, 1)}
                      className="px-2 py-1 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatCurr(item.product.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Voucher & Bill Summary */}
      <div className="flex-shrink-0 space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        {/* Coupon input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="pos-voucher-input"
              type="text"
              value={voucherInput}
              onChange={(e) => setVoucherInput(e.target.value)}
              placeholder={t.discountCode}
              className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border outline-none transition-all ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500'
              }`}
            />
          </div>
          <button
            id="btn-apply-voucher"
            onClick={handleApplyVoucher}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              isDark
                ? 'border-slate-700 hover:bg-slate-800 text-slate-200'
                : 'border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            {t.applyVoucher}
          </button>
        </div>
        {voucherError && <p className="text-[11px] text-red-500 dark:text-red-400 font-medium">{voucherError}</p>}

        {/* Pricing summary */}
        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex justify-between">
            <span>{t.subtotal}</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatCurr(subtotal)}
            </span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-blue-600 dark:text-blue-400 font-semibold">
              <span>{t.discount}</span>
              <span>- {formatCurr(totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-sm font-bold text-slate-900 dark:text-white">{t.totalAmount}</span>
            <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
              {formatCurr(totalAmount)}
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {[
            { id: 'cash', label: t.cashPayment, icon: <Banknote className="w-3.5 h-3.5" /> },
            { id: 'transfer', label: t.bankTransfer, icon: <Building2 className="w-3.5 h-3.5" /> },
            { id: 'qr', label: t.qrPayment, icon: <QrCode className="w-3.5 h-3.5" /> },
            { id: 'card', label: t.cardPayment, icon: <CreditCard className="w-3.5 h-3.5" /> },
          ].map((method) => {
            const isSelected = paymentMethod === method.id;
            return (
              <button
                key={method.id}
                id={`payment-method-${method.id}`}
                onClick={() => setPaymentMethod(method.id as any)}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-[10px] font-semibold relative transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                    : isDark
                    ? 'border-slate-800 hover:bg-slate-800 text-slate-300'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                {isSelected && (
                  <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
                {method.icon}
                <span className="truncate">{method.label}</span>
              </button>
            );
          })}
        </div>

        {/* Checkout Button */}
        <button
          id="btn-pos-checkout"
          disabled={cart.length === 0}
          onClick={() => onCheckout(paymentMethod, voucherInput, totalAmount)}
          className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] ${
            cart.length === 0
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>{t.checkout}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div id="pos-screen" className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8.5rem)] pb-16 lg:pb-2">
      {/* Mobile view switch bar (on < lg screens) */}
      <div className="flex lg:hidden items-center justify-between gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
        <button
          onClick={() => setMobileView('products')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            mobileView === 'products'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          📦 {language === 'vi' ? 'Danh sách sản phẩm' : 'Product Catalog'} ({filteredProducts.length})
        </button>
        <button
          onClick={() => setMobileView('cart')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all relative ${
            mobileView === 'cart'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          🛒 {t.posCartTitle} ({totalItemCount})
          {cart.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 text-[9px] bg-red-500 text-white rounded-full">
              {totalItemCount}
            </span>
          )}
        </button>
      </div>

      {/* Products Catalog View */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          mobileView === 'cart' ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* POS Fast Search & Live Scanner Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pb-3 flex-shrink-0">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="pos-product-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={language === 'vi' ? 'Tìm nhanh theo tên, mã SKU hoặc quét barcode...' : 'Search name, SKU or scan barcode...'}
              className={`w-full pl-9 pr-9 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:border-blue-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 shadow-xs'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Prominent Live Camera Barcode Scanner & Visual Checkout Button */}
          <button
            id="btn-pos-camera-scanner"
            onClick={() => {
              setScannerInitialTab('barcode');
              setIsLiveScannerOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all flex-shrink-0"
            title="Mở máy quét Camera & AI Visual Checkout (Phím tắt F2)"
          >
            <Camera className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span>{language === 'vi' ? 'Quét Camera' : 'Live Camera'}</span>
            <span className="hidden sm:inline-block px-1 py-0.2 rounded bg-white/20 text-[10px] font-mono tracking-wider font-semibold">
              F2
            </span>
          </button>

          {/* Connect Mobile Phone Camera Button */}
          <button
            id="btn-pos-phone-camera-scanner"
            onClick={() => {
              setScannerInitialTab('mobile');
              setIsLiveScannerOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all flex-shrink-0"
            title="Dùng camera điện thoại làm máy quét mã vạch không dây"
          >
            <Smartphone className="w-4 h-4 text-emerald-200" />
            <span>{language === 'vi' ? 'Kết nối ĐT' : 'Phone Scanner'}</span>
          </button>
        </div>

        {/* Category Pills & Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 flex-shrink-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`cat-pill-${cat.id}`}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {language === 'vi' ? cat.nameVi : cat.nameEn}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 my-auto">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
              {language === 'vi' ? 'Không tìm thấy sản phẩm' : 'No products found'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              {products.length === 0
                ? (language === 'vi'
                    ? 'Cửa hàng chưa có sản phẩm nào. Bạn có thể mở mục "Dữ liệu thực" để nhập hàng.'
                    : 'Your store has no products yet. Open "Real Data" to import items.')
                : (language === 'vi'
                    ? 'Không có sản phẩm nào khớp với tìm kiếm hoặc bộ lọc danh mục đã chọn.'
                    : 'No items match your active search query or category filter.')}
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 auto-rows-max pt-1">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock === 0;

            return (
              <div
                key={product.id}
                id={`pos-product-card-${product.id}`}
                className={`p-3 sm:p-3.5 rounded-2xl border flex flex-col justify-between group transition-all duration-200 relative ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200'
                }`}
              >
                {/* Stock badge top right */}
                <div className="absolute top-4 right-4 z-10">
                  {isOutOfStock ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white shadow-sm">
                      {t.stockStatusOut}
                    </span>
                  ) : (
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm ${
                        product.stock <= 5
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 backdrop-blur-sm'
                      }`}
                    >
                      {t.stock}: {product.stock}
                    </span>
                  )}
                </div>

                {/* Product Image */}
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2.5 relative flex items-center justify-center">
                  <img
                    src={product.image}
                    alt={product.name}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                      isOutOfStock ? 'opacity-40 grayscale' : ''
                    }`}
                    referrerPolicy="no-referrer"
                  />
                  {isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-red-600/90 text-white font-bold text-xs shadow-md">
                        {t.stockStatusOut}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div>
                  <h3 className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-2 h-8 leading-snug">
                    {product.name}
                  </h3>
                  <p className="font-bold text-xs sm:text-sm text-blue-600 dark:text-blue-400 mt-1">
                    {formatCurr(product.price)}
                  </p>
                </div>

                {/* Add to Cart Button */}
                <button
                  id={`btn-add-to-cart-${product.id}`}
                  disabled={isOutOfStock}
                  onClick={() => onAddToCart(product)}
                  className={`mt-2.5 w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    isOutOfStock
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : isDark
                      ? 'bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white active:scale-95'
                      : 'bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white shadow-xs active:scale-95'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isOutOfStock ? t.stockStatusOut : t.addToCart}</span>
                </button>
              </div>
            );
          })}
        </div>
        )}

        {/* Floating Mobile Cart Bar (when items in cart on < lg) */}
        {cart.length > 0 && mobileView === 'products' && (
          <div className="lg:hidden fixed bottom-14 left-4 right-4 z-30 animate-in fade-in slide-in-from-bottom-3">
            <button
              onClick={() => setMobileView('cart')}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 flex items-center justify-between active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xs">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold">
                    {totalItemCount} {t.itemsUnit} {language === 'vi' ? 'trong giỏ' : 'in cart'}
                  </p>
                  <p className="text-[11px] text-blue-100 font-semibold">{formatCurr(totalAmount)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold bg-white text-blue-600 px-3 py-1.5 rounded-xl">
                <span>{t.checkout}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Cart View on Desktop or Mobile switched view */}
      <div
        className={`w-full lg:w-96 flex-shrink-0 lg:sticky lg:top-0 lg:self-start lg:h-[calc(100vh-8.5rem)] ${
          mobileView === 'products' ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {renderCartContent()}
      </div>

      {/* Live Camera Barcode Scanner & AI Visual Checkout Modal */}
      <BarcodeScannerModal
        isOpen={isLiveScannerOpen}
        onClose={() => setIsLiveScannerOpen(false)}
        products={products}
        onAddToCart={onAddToCart}
        isDark={isDark}
        initialTab={scannerInitialTab}
      />
    </div>
  );
};
