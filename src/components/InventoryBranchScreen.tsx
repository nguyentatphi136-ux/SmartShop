import React, { useState } from 'react';
import { Boxes, Truck } from 'lucide-react';
import { Product, RestockOrder } from '../types';
import { InventoryScreen } from './InventoryScreen';
import { RestockScreen } from './RestockScreen';
import { useLanguage } from '../utils/i18n';

interface InventoryBranchScreenProps {
  products: Product[];
  restockOrders: RestockOrder[];
  onOpenRestockModal: (productId?: string) => void;
  onReceiveOrder: (orderId: string) => void;
  isDark?: boolean;
}

export const InventoryBranchScreen: React.FC<InventoryBranchScreenProps> = ({
  products,
  restockOrders,
  onOpenRestockModal,
  onReceiveOrder,
  isDark,
}) => {
  const { language } = useLanguage();
  const [activeSection, setActiveSection] = useState<'inventory' | 'restock'>('inventory');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {language === 'vi' ? 'Tồn kho & Chi nhánh' : 'Inventory & Branches'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'vi' ? 'Theo dõi tồn kho, phiếu nhập và luân chuyển hàng hóa tại chi nhánh.' : 'Monitor stock, restock orders, and branch inventory flow.'}
          </p>
        </div>
      </div>

      <div className={`flex gap-1 p-1 rounded-xl border w-fit ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <button
          onClick={() => setActiveSection('inventory')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${activeSection === 'inventory' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <Boxes className="w-4 h-4" />
          {language === 'vi' ? 'Tồn kho' : 'Stock'}
        </button>
        <button
          onClick={() => setActiveSection('restock')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${activeSection === 'restock' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <Truck className="w-4 h-4" />
          {language === 'vi' ? 'Nhập hàng & Chi nhánh' : 'Restock & Branches'}
        </button>
      </div>

      {activeSection === 'inventory' ? (
        <InventoryScreen products={products} onOpenRestockModal={onOpenRestockModal} isDark={isDark} />
      ) : (
        <RestockScreen
          restockOrders={restockOrders}
          products={products}
          onOpenRestockModal={onOpenRestockModal}
          onReceiveOrder={onReceiveOrder}
          isDark={isDark}
        />
      )}
    </div>
  );
};
