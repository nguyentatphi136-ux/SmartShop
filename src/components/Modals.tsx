import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  QrCode,
  Printer,
  ShoppingBag,
  Sparkles,
  Zap,
  Building,
  Building2,
  User,
  Plus,
  ArrowRight,
  TrendingUp,
  Package,
  Database,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  FileText,
  RefreshCw,
  HardDrive,
  CheckCircle2,
} from 'lucide-react';
import { Product, Customer, CartItem, Order } from '../types';
import { useLanguage } from '../utils/i18n';

// 1. ADD / EDIT PRODUCT MODAL
interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => void;
  initialProduct?: Product | null;
  existingCategories?: string[];
  isDark?: boolean;
}

const NEW_CATEGORY_OPTION = '__new_category__';

export const AddEditProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProduct,
  existingCategories = [],
  isDark,
}) => {
  const { language, t, formatCurr } = useLanguage();
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [name, setName] = useState(initialProduct?.name || '');
  const [code, setCode] = useState(initialProduct?.code || `SP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [category, setCategory] = useState(initialProduct?.category || (language === 'vi' ? 'Điện thoại' : 'Phones'));
  const [price, setPrice] = useState(initialProduct?.price ? String(initialProduct.price) : '');
  const [costPrice, setCostPrice] = useState(initialProduct?.costPrice ? String(initialProduct.costPrice) : '');
  const [stock, setStock] = useState(initialProduct?.stock !== undefined ? String(initialProduct.stock) : '10');
  const [image, setImage] = useState(
    initialProduct?.image ||
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80'
  );
  const [sku, setSku] = useState(initialProduct?.sku || '');

  if (!isOpen) return null;

  // Danh mục mặc định + danh mục đã có trong kho (kể cả danh mục do người dùng tự thêm)
  const categoryOptions = [
    { value: language === 'vi' ? 'Điện thoại' : 'Phones', label: t.catPhones },
    { value: language === 'vi' ? 'Laptop' : 'Laptops', label: t.catLaptops },
    { value: language === 'vi' ? 'Tablet' : 'Tablets', label: t.catTablets },
    { value: language === 'vi' ? 'Phụ kiện' : 'Accessories', label: t.catAccessories },
    { value: language === 'vi' ? 'Thời trang' : 'Fashion', label: t.catFashion },
  ];
  for (const cat of [...existingCategories, initialProduct?.category]) {
    const value = cat?.trim();
    if (value && !categoryOptions.some((o) => o.value === value)) categoryOptions.push({ value, label: value });
  }

  const priceValue = Number(price) || 0;
  const costValue = costPrice === '' ? null : Number(costPrice);
  const costPriceError =
    costValue === null
      ? null
      : costValue < 0
      ? language === 'vi' ? 'Giá vốn không được âm.' : 'Cost price cannot be negative.'
      : priceValue > 0 && costValue >= priceValue
      ? language === 'vi'
        ? `Giá vốn phải nhỏ hơn giá bán (${formatCurr(priceValue)}).`
        : `Cost price must be lower than the selling price (${formatCurr(priceValue)}).`
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category.trim() || costPriceError) return;

    onSave({
      name,
      code,
      category: category.trim(),
      price: Number(price) || 0,
      costPrice: Number(costPrice) || Math.round((Number(price) || 0) * 0.8),
      stock: Number(stock) || 0,
      image,
      sku: sku || code,
      status: Number(stock) === 0 ? 'out_of_stock' : Number(stock) <= 10 ? 'low_stock' : 'in_stock',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div
        className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold">
          {initialProduct ? t.editProduct : t.addProduct}
        </h2>
        <p className="text-xs text-slate-500 mb-4">{t.enterProductDetails}</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold block mb-1">{t.productName} *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: iPhone 15 Pro Max 256GB"
              className={`w-full p-2.5 rounded-xl border outline-none ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">{t.sku}</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`w-full p-2.5 rounded-xl border outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold">{t.category}</label>
                {isNewCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewCategory(false);
                      setCategory(categoryOptions[0].value);
                    }}
                    className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {language === 'vi' ? 'Chọn có sẵn' : 'Pick existing'}
                  </button>
                )}
              </div>
              {isNewCategory ? (
                <input
                  type="text"
                  required
                  autoFocus
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder={language === 'vi' ? 'VD: Đồng hồ thông minh' : 'e.g. Smartwatches'}
                  className={`w-full p-2.5 rounded-xl border outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === NEW_CATEGORY_OPTION) {
                      setIsNewCategory(true);
                      setCategory('');
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className={`w-full p-2.5 rounded-xl border outline-none cursor-pointer ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                  <option value={NEW_CATEGORY_OPTION}>
                    {language === 'vi' ? '+ Thêm danh mục mới...' : '+ Add new category...'}
                  </option>
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">{t.price} *</label>
              <input
                type="number"
                required
                min={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="29590000"
                className={`w-full p-2.5 rounded-xl border outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">{t.costPrice}</label>
              <input
                type="number"
                min={0}
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="25000000"
                aria-invalid={!!costPriceError}
                className={`w-full p-2.5 rounded-xl border outline-none ${
                  costPriceError
                    ? 'border-rose-500 focus:ring-1 focus:ring-rose-500 ' + (isDark ? 'bg-slate-800 text-white' : 'bg-rose-50/40')
                    : isDark
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-200'
                }`}
              />
              {costPriceError && <p className="mt-1 text-[11px] text-rose-500">{costPriceError}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">{t.initialStock}</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className={`w-full p-2.5 rounded-xl border outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">SKU / Barcode</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="IP15PM-256"
                className={`w-full p-2.5 rounded-xl border outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">{t.imageLink}</label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className={`w-full p-2.5 rounded-xl border outline-none ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl border font-medium ${
                isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
              }`}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={!!costPriceError}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {initialProduct ? t.saveChanges : t.addProduct}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 2. CUSTOMER SELECT MODAL
interface CustomerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (c: Customer | null) => void;
  onAddNewCustomer: (c: Customer) => void;
  isDark?: boolean;
}

export const CustomerSelectModal: React.FC<CustomerSelectModalProps> = ({
  isOpen,
  onClose,
  customers,
  selectedCustomer,
  onSelectCustomer,
  onAddNewCustomer,
  isDark,
}) => {
  const { language, t } = useLanguage();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTier, setNewTier] = useState<'Chuẩn' | 'VIP' | 'VVIP'>('VIP');

  if (!isOpen) return null;

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const discountPercent = newTier === 'VVIP' ? 5 : newTier === 'VIP' ? 3 : 0;
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newName,
      phone: newPhone,
      tier: newTier,
      discountPercent,
      rewardPoints: 100,
      totalSpent: 0,
    };
    onAddNewCustomer(newCust);
    onSelectCustomer(newCust);
    setIsAddingNew(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl relative ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold">{t.loyaltyCustomer}</h2>
        <p className="text-xs text-slate-500 mb-4">
          {t.selectCustomerForDiscount}
        </p>

        {!isAddingNew ? (
          <div className="space-y-3">
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <button
                onClick={() => {
                  onSelectCustomer(null);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-colors ${
                  !selectedCustomer
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 font-bold text-blue-600'
                    : isDark
                    ? 'border-slate-800 hover:bg-slate-800'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{t.walkInNoPoints}</span>
                {!selectedCustomer && <Check className="w-4 h-4 text-blue-600" />}
              </button>

              {customers.map((c) => {
                const isSelected = selectedCustomer?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectCustomer(c);
                      onClose();
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-colors ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 font-bold text-blue-600'
                        : isDark
                        ? 'border-slate-800 hover:bg-slate-800'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {c.name}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            c.tier === 'VVIP'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : c.tier === 'VIP'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {c.tier} (-{c.discountPercent}%)
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">{t.phone}: {c.phone}</p>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIsAddingNew(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-blue-400 text-blue-600 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/50"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addNewCustomer}</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold block mb-1">{t.customerName} *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="VD: Lê Thị Mai"
                className={`w-full p-2.5 rounded-xl border outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">{t.phone} *</label>
              <input
                type="tel"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="0988 123 456"
                className={`w-full p-2.5 rounded-xl border outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">{t.tier}</label>
              <select
                value={newTier}
                onChange={(e) => setNewTier(e.target.value as any)}
                className={`w-full p-2.5 rounded-xl border outline-none cursor-pointer ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <option value="Chuẩn">{language === 'vi' ? 'Chuẩn (0% chiết khấu)' : 'Standard (0% discount)'}</option>
                <option value="VIP">{language === 'vi' ? 'VIP (-3% chiết khấu)' : 'VIP (-3% discount)'}</option>
                <option value="VVIP">{language === 'vi' ? 'VVIP (-5% chiết khấu phụ kiện)' : 'VVIP (-5% discount)'}</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className={`px-3 py-2 rounded-xl border ${
                  isDark ? 'border-slate-700' : 'border-slate-200'
                }`}
              >
                {t.back}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
              >
                {t.createAndSelect}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// 3. CHECKOUT RECEIPT MODAL
interface CheckoutReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  customer: Customer | null;
  paymentMethod: string;
  total: number;
  isDark?: boolean;
}

export const CheckoutReceiptModal: React.FC<CheckoutReceiptModalProps> = ({
  isOpen,
  onClose,
  cart,
  customer,
  paymentMethod,
  total,
  isDark,
}) => {
  const { language, t, formatCurr } = useLanguage();
  if (!isOpen) return null;

  const orderCode = `DH-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr = new Date().toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl relative ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon */}
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-2">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
          <h2 className="text-lg font-bold">{t.paymentSuccess}</h2>
          <p className="text-xs text-slate-400">{t.orderCode}: {orderCode}</p>
        </div>

        {/* Receipt Content */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-xs space-y-3 font-mono">
          <div className="text-center border-b border-dashed border-slate-200 dark:border-slate-700 pb-2">
            <p className="font-bold text-sm">SMARTSALE AI RETAIL</p>
            <p className="text-[10px] text-slate-400">68 Nguyễn Huệ, Quận 1, TP.HCM</p>
            <p className="text-[10px] text-slate-400">{dateStr}</p>
          </div>

          <div className="space-y-1 text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span>{t.customer}:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {customer ? customer.name : t.walkInCustomer}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t.method}:</span>
              <span className="font-bold uppercase">{paymentMethod}</span>
            </div>
          </div>

          {/* Items */}
          <div className="border-t border-b border-dashed border-slate-200 dark:border-slate-700 py-2 space-y-1.5">
            {cart.map((item) => (
              <div key={item.product.id} className="flex justify-between">
                <span className="truncate pr-2">
                  {item.quantity}x {item.product.name}
                </span>
                <span className="font-semibold">{formatCurr(item.product.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-baseline pt-1">
            <span className="font-bold text-sm">{t.totalUpper}:</span>
            <span className="font-extrabold text-base text-blue-600 dark:text-blue-400">
              {formatCurr(total)}
            </span>
          </div>

          {paymentMethod === 'transfer' && (
            <div className="pt-2 text-center flex flex-col items-center">
              <p className="text-[11px] text-slate-500 mb-1">{t.scanVietQr}</p>
              <div className="w-28 h-28 bg-white p-2 rounded-lg shadow-sm border flex items-center justify-center">
                <QrCode className="w-24 h-24 text-slate-800" />
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2.5 mt-5">
          <button
            onClick={() => {
              window.print();
            }}
            className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
              isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>{t.printReceipt}</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20"
          >
            {t.doneNewOrder}
          </button>
        </div>
      </div>
    </div>
  );
};

// 4. RESTOCK MODAL
interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialProductId?: string | null;
  onConfirmRestock: (productId: string, amount: number, receiveNow: boolean) => void;
  isDark?: boolean;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  products,
  initialProductId,
  onConfirmRestock,
  isDark,
}) => {
  const { language, t, formatCurr } = useLanguage();
  const [selectedProdId, setSelectedProdId] = useState<string>('');
  const [amount, setAmount] = useState('20');
  const [receiveNow, setReceiveNow] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState(language === 'vi' ? 'Chi nhánh Quận 1 - Hồ Chí Minh (Kho chính)' : 'District 1 Branch - Ho Chi Minh (Main Warehouse)');

  useEffect(() => {
    if (isOpen) {
      if (initialProductId && products.some((p) => p.id === initialProductId)) {
        setSelectedProdId(initialProductId);
      } else if (products.length > 0) {
        const firstLow = products.find((p) => p.stock <= 10);
        setSelectedProdId(firstLow ? firstLow.id : products[0].id);
      }
    }
  }, [isOpen, initialProductId, products]);

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p.id === selectedProdId) || products[0];
  const lowStockProds = products.filter((p) => p.stock <= 10);
  const normalStockProds = products.filter((p) => p.stock > 10);
  const parsedAmount = Math.max(1, parseInt(amount) || 1);
  const estimatedCost = selectedProduct ? parsedAmount * selectedProduct.costPrice : 0;

  const handleRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    onConfirmRestock(selectedProduct.id, parsedAmount, receiveNow);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div
        className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">{t.restockOrderModalTitle}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.restockOrderModalSubtitle}
            </p>
          </div>
        </div>

        {/* Highlighted Selected Product Card */}
        {selectedProduct && (
          <div
            className={`mt-4 p-3.5 rounded-xl border flex items-center gap-3.5 transition-all ${
              isDark
                ? 'bg-slate-800/80 border-slate-700'
                : 'bg-blue-50/50 border-blue-100'
            }`}
          >
            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              className="w-14 h-14 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  {selectedProduct.category}
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {t.sku}: {selectedProduct.code}
                </span>
              </div>
              <p className="font-bold text-sm text-slate-900 dark:text-white truncate mt-0.5">
                {selectedProduct.name}
              </p>
              <div className="flex items-center gap-3 mt-1 text-xs">
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {t.currentStock}:{' '}
                  <strong
                    className={
                      selectedProduct.stock === 0
                        ? 'text-red-600 dark:text-red-400 font-bold'
                        : selectedProduct.stock <= 10
                        ? 'text-amber-600 dark:text-amber-400 font-bold'
                        : 'text-emerald-600 dark:text-emerald-400 font-bold'
                    }
                  >
                    {selectedProduct.stock} {language === 'vi' ? 'cái' : 'pcs'}
                  </strong>
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 dark:text-slate-300">
                  {t.costPrice}: <strong className="font-semibold">{formatCurr(selectedProduct.costPrice)}</strong>
                </span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleRestock} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="font-semibold block mb-1.5 text-slate-700 dark:text-slate-200">
              {t.productToRestock}
            </label>
            <select
              value={selectedProdId}
              onChange={(e) => setSelectedProdId(e.target.value)}
              className={`w-full p-2.5 rounded-xl border outline-none font-medium cursor-pointer ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              {lowStockProds.length > 0 && (
                <optgroup label={language === 'vi' ? '⚠️ Sản phẩm sắp hết & hết hàng' : '⚠️ Low Stock & Out of Stock'}>
                  {lowStockProds.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ({language === 'vi' ? `Tồn: ${p.stock} cái` : `Stock: ${p.stock}`} | {p.code})
                    </option>
                  ))}
                </optgroup>
              )}
              {normalStockProds.length > 0 && (
                <optgroup label={language === 'vi' ? '📦 Các sản phẩm khác' : '📦 Other Products'}>
                  {normalStockProds.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ({language === 'vi' ? `Tồn: ${p.stock} cái` : `Stock: ${p.stock}`} | {p.code})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Quantity Input & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-200">
                {t.restockQuantity}
              </label>
              <div className="flex items-center gap-1.5">
                {[10, 20, 50, 100].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setAmount(qty.toString())}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                      amount === qty.toString()
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : isDark
                        ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    +{qty}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full p-2.5 rounded-xl border outline-none font-semibold text-sm ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          {/* Receive mode: add stock now, or create a supplier order that is received later */}
          <div>
            <label className="font-semibold block mb-1.5 text-slate-700 dark:text-slate-200">
              {language === 'vi' ? 'Hình thức nhập' : 'Restock type'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  value: true,
                  title: language === 'vi' ? 'Hàng đã về kho' : 'Goods received',
                  desc: selectedProduct
                    ? language === 'vi'
                      ? `Cộng tồn ngay: ${selectedProduct.stock} → ${selectedProduct.stock + parsedAmount}`
                      : `Stock now: ${selectedProduct.stock} → ${selectedProduct.stock + parsedAmount}`
                    : '',
                },
                {
                  value: false,
                  title: language === 'vi' ? 'Đặt nhà cung cấp' : 'Order from supplier',
                  desc: language === 'vi' ? 'Tạo phiếu, cộng tồn khi bấm "Nhận hàng"' : 'Stock added when received',
                },
              ].map((option) => {
                const active = receiveNow === option.value;
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => setReceiveNow(option.value)}
                    className={`p-2.5 rounded-xl border text-left transition-colors ${
                      active
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 ring-1 ring-blue-600'
                        : isDark
                        ? 'border-slate-700 bg-slate-800 hover:bg-slate-700'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`block font-bold ${active ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                      {option.title}
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{option.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Destination Warehouse (Single Store) */}
          <div>
            <label className="font-semibold block mb-1.5 text-slate-700 dark:text-slate-200">
              {language === 'vi' ? 'Địa điểm nhập kho' : 'Receiving Warehouse'}
            </label>
            <div
              className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>{language === 'vi' ? 'Kho hàng tại cửa hàng (Kho chính)' : 'Store Warehouse (Main)'}</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                {language === 'vi' ? 'Cửa hàng đơn lẻ' : 'Single Store'}
              </span>
            </div>
          </div>

          {/* Financial summary for restock */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{t.estimatedCost}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {parsedAmount} × {formatCurr(selectedProduct?.costPrice || 0)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{t.totalOrderValue}</span>
              <span className="font-bold text-sm text-blue-600 dark:text-blue-400">
                {formatCurr(estimatedCost)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl border font-semibold ${
                isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm shadow-blue-500/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>
                {receiveNow ? t.confirmRestock : language === 'vi' ? 'Tạo phiếu đặt hàng' : 'Create purchase order'} (+{parsedAmount})
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 5. REPORT MODAL
interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, isDark }) => {
  const { language, t, formatCurr } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div
        className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold">{t.revenueReportTitle}</h2>
        <p className="text-xs text-slate-500 mb-4">
          {t.revenueReportSubtitle}
        </p>

        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex justify-between">
            <span className="text-slate-500">{t.netRevenueToday}:</span>
            <span className="font-bold text-slate-900 dark:text-white">{formatCurr(12500000)}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex justify-between">
            <span className="text-slate-500">{t.estimatedProfit}:</span>
            <span className="font-bold text-emerald-600">{formatCurr(3850000)} (30.8%)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex justify-between">
            <span className="text-slate-500">{t.averageOrderValue}:</span>
            <span className="font-bold text-slate-900 dark:text-white">{formatCurr(2450000)}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex justify-between">
            <span className="text-slate-500">{t.topBranch}:</span>
            <span className="font-bold text-blue-600">Quận 1, TP.HCM (62%)</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => {
              alert(language === 'vi' ? 'Đã tải xuống file báo cáo chi tiết PDF!' : 'PDF Report downloaded successfully!');
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs"
          >
            {t.downloadPdf}
          </button>
        </div>
      </div>
    </div>
  );
};

// 6. UPGRADE TO PRO MODAL
interface UpgradeProModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const UpgradeProModal: React.FC<UpgradeProModalProps> = ({ isOpen, onClose, isDark }) => {
  const { language, t, formatCurr } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl relative ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-blue-500/25 mb-2">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <h2 className="text-xl font-bold">SmartSale AI Enterprise</h2>
          <p className="text-xs text-slate-500 mt-1">
            {t.upgradeSubtitle}
          </p>
        </div>

        <div className="space-y-2.5 text-xs my-4">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>{t.upgradePerk1}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>{t.upgradePerk2}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>{t.upgradePerk3}</span>
          </div>
        </div>

        <div className="pt-2 text-center">
          <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{formatCurr(499000)}</span>
          <span className="text-xs text-slate-400">{t.perMonth}</span>
        </div>

        <button
          onClick={() => {
            alert(language === 'vi' ? 'Cảm ơn bạn đã nâng cấp SmartSale AI Enterprise Pro!' : 'Thank you for upgrading to SmartSale AI Enterprise Pro!');
            onClose();
          }}
          className="w-full mt-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
        >
          {t.upgradeNow}
        </button>
      </div>
    </div>
  );
};

// 7. REAL DATA MANAGER MODAL
interface RealDataManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  orders: Order[];
  onClearSampleOrders: () => void;
  onResetStoreBlank: () => void;
  onImportProducts: (newProducts: Product[]) => void;
  onRestoreSampleData: () => void;
  onOpenAddProduct: () => void;
  isAutoStreamActive?: boolean;
  onToggleAutoStream?: () => void;
  isDark?: boolean;
  dataMode?: 'demo' | 'real';
  onSetDataMode?: (mode: 'demo' | 'real', initialSetupAction?: 'clear_orders' | 'blank_store' | 'keep') => void;
  onNavigateToPos?: () => void;
}

export const RealDataManagerModal: React.FC<RealDataManagerModalProps> = ({
  isOpen,
  onClose,
  products,
  orders,
  onClearSampleOrders,
  onResetStoreBlank,
  onImportProducts,
  onRestoreSampleData,
  onOpenAddProduct,
  isAutoStreamActive,
  onToggleAutoStream,
  isDark,
  dataMode = 'demo',
  onSetDataMode,
  onNavigateToPos,
}) => {
  const { language, t, formatCurr } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'import' | 'backup'>('overview');
  const [rawInput, setRawInput] = useState('');
  const [importNotice, setImportNotice] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const restoreFileRef = React.useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  const handleExportJSON = () => {
    const backupData = {
      storeName: 'SmartSale Store',
      exportedAt: new Date().toISOString(),
      products,
      orders,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartsale_store_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleDownloadSampleCSV = () => {
    const sampleCSV = `Tên sản phẩm,Giá bán,Giá vốn,Tồn kho,Phân loại
Cà phê Arabica Cầu Đất 500g,185000,110000,40,Cà phê & Đồ uống
Trà Ô long Thượng Hạng 200g,145000,85000,35,Trà & Thảo mộc
Bình giữ nhiệt Inox 500ml,220000,120000,25,Gia dụng
Áo thun thể thao nam thoáng khí,160000,85000,50,Thời trang
Sữa chua dẻo Hy Lạp,35000,20000,60,Thực phẩm`;
    const blob = new Blob([sampleCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mau_Nhap_Hang_SmartSale.csv`;
    a.click();
  };

  const loadIndustryPreset = (presetType: 'grocery' | 'cafe' | 'fashion' | 'cosmetics') => {
    let presetText = '';
    if (presetType === 'grocery') {
      presetText = `Gạo ST25 Ông Cua 5kg, 195000, 150000, 30, Thực phẩm
Dầu ăn Simply 1 lít, 62000, 48000, 45, Nhu yếu phẩm
Nước tương Maggi Đậm Đặc 700ml, 34000, 25000, 60, Nhu yếu phẩm
Mì Hảo Hảo Tôm Chua Cay (Thùng 30 gói), 128000, 105000, 20, Thực phẩm
Sữa tươi tiệt trùng Vinamilk 1L, 38000, 30000, 50, Đồ uống`;
    } else if (presetType === 'cafe') {
      presetText = `Cà phê Đen đá truyền thống, 25000, 8000, 100, Cà phê
Cà phê Sữa đá Sài Gòn, 29000, 10000, 100, Cà phê
Bạc xỉu 3 tầng cốt dừa, 35000, 14000, 80, Cà phê
Trà đào Cam sả hạt chia, 39000, 15000, 60, Trà trái cây
Trà sữa trân châu đường đen, 42000, 16000, 75, Trà sữa
Bánh Croissant bơ tỏi nướng, 32000, 15000, 30, Bánh ngọt`;
    } else if (presetType === 'fashion') {
      presetText = `Áo phông Cotton 100% Unisex, 150000, 75000, 50, Áo nam & nữ
Quần Jean Skinny co giãn, 350000, 190000, 30, Quần
Áo sơ mi lụa công sở, 280000, 145000, 25, Áo nữ
Váy Midi dáng xòe thời trang, 390000, 210000, 20, Váy đầm
Tất vớ cotton cao cổ (Set 3 đôi), 65000, 28000, 80, Phụ kiện`;
    } else {
      presetText = `Kem chống nắng kiềm dầu 50ml, 320000, 190000, 25, Chăm sóc da
Sữa rửa mặt tạo bọt dịu nhẹ 150ml, 185000, 110000, 40, Làm sạch da
Son kem lì Velvet Tint, 210000, 115000, 35, Trang điểm
Nước hoa hồng cân bằng da Toner, 260000, 150000, 30, Chăm sóc da
Mặt nạ dưỡng ẩm cấp nước (Hộp 5 miếng), 120000, 65000, 50, Chăm sóc da`;
    }
    setRawInput(presetText);
    setImportNotice(language === 'vi' ? 'Đã tải danh sách mẫu. Nhấn "Nhập vào kho hàng" để lưu!' : 'Preset loaded. Click "Import to Inventory" to save!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawInput(text);
        setImportNotice(language === 'vi' ? `Đã đọc tệp "${file.name}". Nhấn "Nhập vào kho hàng" bên dưới.` : `Read file "${file.name}". Click "Import to Inventory" below.`);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleRestoreFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.products && Array.isArray(parsed.products)) {
          onImportProducts(parsed.products);
          setImportNotice(language === 'vi' ? `Khôi phục thành công ${parsed.products.length} sản phẩm từ bản sao lưu!` : `Successfully restored ${parsed.products.length} products!`);
          setTimeout(() => onClose(), 1500);
        } else {
          alert(language === 'vi' ? 'Tệp sao lưu không đúng cấu trúc' : 'Invalid backup structure');
        }
      } catch (err: any) {
        alert(language === 'vi' ? `Lỗi đọc tệp: ${err.message}` : `Error reading file: ${err.message}`);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleParseAndImport = () => {
    setImportNotice('');
    if (!rawInput.trim()) return;

    try {
      // 1. Try JSON
      if (rawInput.trim().startsWith('[') || rawInput.trim().startsWith('{')) {
        const parsed = JSON.parse(rawInput);
        const list: any[] = Array.isArray(parsed) ? parsed : parsed.products || [];
        if (list.length > 0) {
          const formatted: Product[] = list.map((item, idx) => ({
            id: item.id || `prod-imp-${Date.now()}-${idx}`,
            code: item.code || `SP-${1000 + idx}`,
            name: item.name || 'Sản phẩm mới',
            category: item.category || (language === 'vi' ? 'Sản phẩm chung' : 'General'),
            price: Number(item.price) || 100000,
            costPrice: Number(item.costPrice) || Math.round((Number(item.price) || 100000) * 0.7),
            stock: Number(item.stock) || 10,
            image: item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80',
            status: (Number(item.stock) || 10) <= 0 ? 'out_of_stock' : (Number(item.stock) || 10) <= 5 ? 'low_stock' : 'in_stock',
            soldCount: item.soldCount || 0,
            sku: item.sku || `SKU-${1000 + idx}`,
          }));
          onImportProducts(formatted);
          setImportNotice(language === 'vi' ? `✅ Đã nhập thành công ${formatted.length} sản phẩm!` : `✅ Successfully imported ${formatted.length} products!`);
          setRawInput('');
          return;
        }
      }

      // 2. Try CSV / line-by-line format:
      const lines = rawInput.trim().split('\n');
      const parsedItems: Product[] = [];

      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || trimmed.toLowerCase().startsWith('tên') || trimmed.toLowerCase().startsWith('name')) return;
        const parts = trimmed.split(/[,;\t]/).map((p) => p.trim());
        if (parts.length >= 2) {
          const name = parts[0].replace(/^["']|["']$/g, '');
          const price = parseFloat(parts[1].replace(/[^\d.]/g, '')) || 0;
          const cost = parts[2] ? parseFloat(parts[2].replace(/[^\d.]/g, '')) || Math.round(price * 0.7) : Math.round(price * 0.7);
          const stock = parts[3] ? parseInt(parts[3], 10) || 10 : 10;
          const category = parts[4] ? parts[4].replace(/^["']|["']$/g, '') : (language === 'vi' ? 'Hàng hóa' : 'Goods');

          parsedItems.push({
            id: `prod-imp-${Date.now()}-${idx}`,
            code: `SP-${1000 + idx}`,
            name,
            price,
            costPrice: cost,
            stock,
            category,
            image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200&auto=format&fit=crop&q=80',
            status: stock <= 0 ? 'out_of_stock' : stock <= 5 ? 'low_stock' : 'in_stock',
            soldCount: 0,
            sku: `SKU-${1000 + idx}`,
          });
        }
      });

      if (parsedItems.length > 0) {
        onImportProducts(parsedItems);
        setImportNotice(language === 'vi' ? `✅ Đã thêm ${parsedItems.length} sản phẩm thực tế vào cửa hàng!` : `✅ Added ${parsedItems.length} real products to your store!`);
        setRawInput('');
      } else {
        setImportNotice(language === 'vi' ? '⚠️ Định dạng không phù hợp. Vui lòng nhập: Tên sản phẩm, Giá bán, Giá vốn, Tồn kho, Phân loại' : '⚠️ Format unrecognized. Format: Name, Price, Cost, Stock, Category');
      }
    } catch (err: any) {
      setImportNotice(language === 'vi' ? `⚠️ Lỗi xử lý dữ liệu: ${err.message}` : `⚠️ Error parsing: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div
        className={`w-full max-w-xl rounded-2xl border p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold">
                {language === 'vi' ? 'Quản lý Dữ liệu Thực tế' : 'Real Store Data Management'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                {language === 'vi' ? '1 Cửa hàng duy nhất' : 'Single Store'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'vi'
                ? 'Dữ liệu lưu an toàn trên trình duyệt của bạn (tự động nhớ khi tải lại trang)'
                : 'Data is persistently stored in your browser (saved across page reloads)'}
            </p>
          </div>
        </div>

        {/* Real Data Status Snapshot */}
        <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 mb-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">{language === 'vi' ? 'Sản phẩm trong kho' : 'Stocked Products'}</span>
            <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {products.length} {language === 'vi' ? 'mã hàng' : 'items'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">{language === 'vi' ? 'Đơn hàng thực tế' : 'Real Orders'}</span>
            <span className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400">
              {orders.length} {language === 'vi' ? 'đơn' : 'orders'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">{language === 'vi' ? 'Doanh thu ghi nhận' : 'Recorded Revenue'}</span>
            <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurr(totalRevenue)}
            </span>
          </div>
        </div>

        {/* HERO DATA MODE SWITCH CARD */}
        <div
          id="modal-real-data-mode-hero"
          className={`p-4 rounded-2xl border mb-4 transition-all ${
            dataMode === 'real'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  dataMode === 'real'
                    ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300'
                }`}
              >
                {dataMode === 'real' ? <CheckCircle2 className="w-5 h-5" /> : <Database className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {language === 'vi' ? 'TRẠNG THÁI:' : 'STATUS:'}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold tracking-wide border ${
                      dataMode === 'real'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-300'
                    }`}
                  >
                    <span className="relative flex h-2 w-2">
                      <span
                        className={`inline-flex rounded-full h-2 w-2 ${
                          dataMode === 'real' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                        }`}
                      />
                    </span>
                    {dataMode === 'real'
                      ? language === 'vi'
                        ? 'ĐANG BẬT DỮ LIỆU THẬT'
                        : 'REAL DATA ACTIVE'
                      : language === 'vi'
                      ? 'ĐANG Ở DỮ LIỆU MẪU (DEMO)'
                      : 'DEMO SAMPLE MODE'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {dataMode === 'real'
                    ? language === 'vi'
                      ? 'Đã tắt toàn bộ đơn mô phỏng. Chỉ ghi nhận hóa đơn bán tại quầy POS và nhập hàng thật.'
                      : 'Simulated orders are completely turned off. Only real POS checkout invoices are recorded.'
                    : language === 'vi'
                    ? 'Hệ thống đang chạy đơn hàng mẫu mô phỏng. Nhấn nút bên dưới để Bật Dữ Liệu Thật cho cửa hàng.'
                    : 'System is running simulated orders. Click the button to turn on Real Data mode.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {dataMode === 'demo' ? (
                <button
                  id="btn-modal-activate-real-mode"
                  onClick={() => {
                    if (onSetDataMode) {
                      onSetDataMode('real', 'clear_orders');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-500/30 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-white text-white" />
                  <span>{language === 'vi' ? 'BẬT DỮ LIỆU THẬT NGAY' : 'TURN ON REAL DATA'}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (onSetDataMode) {
                        onSetDataMode('demo');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    {language === 'vi' ? 'Quay lại Demo' : 'Switch to Demo'}
                  </button>
                  {onNavigateToPos && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToPos();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{language === 'vi' ? 'Bán hàng tại POS' : 'Go to POS'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4 text-xs font-semibold gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 px-3 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'vi' ? '1. Khởi tạo & Dọn dẹp' : '1. Setup & Clean'}
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`pb-2 px-3 border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'vi' ? '2. Nhập sản phẩm thật' : '2. Import Products'}
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2 px-3 border-b-2 transition-colors ${
              activeTab === 'backup'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'vi' ? '3. Sao lưu & Dự phòng' : '3. Backup'}
          </button>
        </div>

        {/* TAB 1: OVERVIEW & CLEANUP */}
        {activeTab === 'overview' && (
          <div className="space-y-3 text-xs">
            {/* Simulation Mode Toggle */}
            {onToggleAutoStream && (
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {language === 'vi' ? 'Chế độ đơn hàng giả lập (Demo Simulation)' : 'Simulated Orders (Demo)'}
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'vi'
                      ? 'Tắt tính năng này để doanh thu chỉ tính đúng đơn hàng bạn xuất tại quầy POS.'
                      : 'Turn off so revenue only counts real checkout invoices created by you.'}
                  </p>
                </div>
                <button
                  onClick={onToggleAutoStream}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                    isAutoStreamActive
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {isAutoStreamActive
                    ? (language === 'vi' ? 'Đang bật demo' : 'Demo active')
                    : (language === 'vi' ? 'Đã tắt (Chế độ thật)' : 'Real Mode')}
                </button>
              </div>
            )}

            {/* Action A: Clear sample orders */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {language === 'vi' ? 'Bắt đầu bán thật (Reset về 0 đơn hàng)' : 'Start Real Sales (Reset to 0 orders)'}
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {language === 'vi'
                      ? 'Xóa toàn bộ các đơn hàng mẫu để hôm nay bắt đầu với 0 đơn và 0đ doanh thu. Danh mục sản phẩm và giá được giữ nguyên để bạn bán ngay tại quầy POS.'
                      : 'Clears all sample invoices so your day starts at 0 orders and $0 revenue. Products and catalog are preserved.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(language === 'vi' ? 'Bạn chắc chắn muốn xóa toàn bộ đơn mẫu để bắt đầu bán thật?' : 'Clear all sample orders?')) {
                      if (onSetDataMode) onSetDataMode('real', 'clear_orders');
                      else onClearSampleOrders();
                      onClose();
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs whitespace-nowrap shadow-xs active:scale-95 transition-all"
                >
                  {language === 'vi' ? 'Bắt đầu bán thật' : 'Reset to 0 orders'}
                </button>
              </div>
            </div>

            {/* Action B: Blank store */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-900/60 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-red-600 dark:text-red-400 text-sm flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4" />
                    <span>{language === 'vi' ? 'Xóa toàn bộ để nhập hàng mới từ đầu' : 'Blank Slate Store (0 items, 0 orders)'}</span>
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {language === 'vi'
                      ? 'Xóa trắng toàn bộ sản phẩm mẫu và đơn hàng demo để bạn tự nhập sản phẩm thực tế của cửa hàng mình.'
                      : 'Clears all sample products and orders so you can start with a completely empty catalog.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(language === 'vi' ? 'Cảnh báo: Bạn muốn xóa toàn bộ sản phẩm và đơn mẫu để tạo cửa hàng trống?' : 'Warning: Clear everything to blank?')) {
                      if (onSetDataMode) onSetDataMode('real', 'blank_store');
                      else onResetStoreBlank();
                      onClose();
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 font-bold text-xs whitespace-nowrap active:scale-95 transition-all"
                >
                  {language === 'vi' ? 'Xóa trắng cửa hàng' : 'Clear all'}
                </button>
              </div>
            </div>

            {/* Action C: Add product shortcut */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  {language === 'vi' ? 'Thêm từng sản phẩm thủ công' : 'Add Individual Products'}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'vi' ? 'Nhập tên, giá bán, giá vốn và tồn kho trực tiếp' : 'Enter name, price, cost, and stock manually'}
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenAddProduct();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Thêm món mới' : 'Add Item'}</span>
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: IMPORT REAL PRODUCTS */}
        {activeTab === 'import' && (
          <div className="space-y-3 text-xs">
            {/* Industry Presets */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                {language === 'vi' ? '⚡ Mẫu ngành hàng nhanh (1 bấm để tải mẫu):' : '⚡ Quick Industry Catalogs (1-click):'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => loadIndustryPreset('cafe')}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 font-medium text-[11px] text-left transition-colors bg-slate-50/50 dark:bg-slate-800/40"
                >
                  ☕ {language === 'vi' ? 'Cà phê & Đồ uống' : 'Cafe & Drinks'}
                </button>
                <button
                  type="button"
                  onClick={() => loadIndustryPreset('grocery')}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 font-medium text-[11px] text-left transition-colors bg-slate-50/50 dark:bg-slate-800/40"
                >
                  🛒 {language === 'vi' ? 'Tạp hóa / Nhu yếu' : 'Groceries'}
                </button>
                <button
                  type="button"
                  onClick={() => loadIndustryPreset('fashion')}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 font-medium text-[11px] text-left transition-colors bg-slate-50/50 dark:bg-slate-800/40"
                >
                  👕 {language === 'vi' ? 'Thời trang / Quần áo' : 'Fashion'}
                </button>
                <button
                  type="button"
                  onClick={() => loadIndustryPreset('cosmetics')}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 font-medium text-[11px] text-left transition-colors bg-slate-50/50 dark:bg-slate-800/40"
                >
                  💄 {language === 'vi' ? 'Mỹ phẩm & Skincare' : 'Cosmetics'}
                </button>
              </div>
            </div>

            {/* Upload or Download template buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,.txt,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-blue-700 shadow-xs transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Chọn tệp CSV / TXT / JSON' : 'Upload CSV / TXT / JSON'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSampleCSV}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Tải tệp mẫu Excel CSV' : 'Download Sample CSV'}</span>
              </button>
            </div>

            <p className="text-slate-600 dark:text-slate-300">
              {language === 'vi'
                ? 'Hoặc dán trực tiếp danh sách sản phẩm theo định dạng (mỗi dòng 1 món):'
                : 'Or paste products directly below (one item per line):'}
            </p>

            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 space-y-0.5">
              <p className="text-slate-400 font-semibold">{language === 'vi' ? 'Định dạng: Tên món, Giá bán, Giá vốn, Tồn kho, Phân loại' : 'Format: Name, Price, Cost, Stock, Category'}</p>
              <p>Áo thun nam Cotton, 180000, 95000, 50, Thời trang</p>
              <p>Cáp sạc Type-C 60W, 120000, 45000, 100, Phụ kiện</p>
            </div>

            <textarea
              rows={5}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder={
                language === 'vi'
                  ? 'Dán danh sách sản phẩm hoặc chuỗi JSON vào đây...'
                  : 'Paste CSV rows or JSON array here...'
              }
              className={`w-full p-3 rounded-xl border outline-none font-mono text-xs ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />

            {importNotice && (
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 font-medium">
                {importNotice}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRawInput('')}
                className={`px-3 py-2 rounded-xl border ${
                  isDark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600'
                }`}
              >
                {language === 'vi' ? 'Xóa nội dung' : 'Clear text'}
              </button>
              <button
                onClick={handleParseAndImport}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Nhập vào kho hàng' : 'Import to Inventory'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: BACKUP & EXPORT */}
        {activeTab === 'backup' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-blue-500" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {language === 'vi' ? 'Tải tệp sao lưu dữ liệu (.JSON)' : 'Download Backup File (.JSON)'}
                </h4>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {language === 'vi'
                  ? 'Sao lưu toàn bộ danh sách sản phẩm, bảng giá, số lượng tồn kho và lịch sử đơn hàng về máy tính của bạn để lưu giữ lâu dài.'
                  : 'Exports all products, prices, stock levels, and order history into a secure JSON backup file.'}
              </p>
              <button
                onClick={handleExportJSON}
                className="mt-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{language === 'vi' ? 'Tải tệp sao lưu ngay' : 'Download Backup Now'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-500" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {language === 'vi' ? 'Khôi phục từ tệp sao lưu (.JSON)' : 'Restore from Backup (.JSON)'}
                </h4>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {language === 'vi'
                  ? 'Nhập lại danh mục sản phẩm từ tệp .json bạn đã sao lưu trước đó.'
                  : 'Import product catalog from your previously downloaded backup JSON file.'}
              </p>
              <input
                type="file"
                ref={restoreFileRef}
                accept=".json"
                onChange={handleRestoreFromFile}
                className="hidden"
              />
              <button
                onClick={() => restoreFileRef.current?.click()}
                className="mt-2 px-4 py-2.5 rounded-xl border border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-bold flex items-center gap-2 active:scale-95 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{language === 'vi' ? 'Chọn tệp sao lưu để khôi phục' : 'Select Backup File to Restore'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
