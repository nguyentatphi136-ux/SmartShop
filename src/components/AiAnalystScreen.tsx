import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Zap,
  Target,
  ArrowRight,
  CheckCircle,
  Lightbulb,
  DollarSign,
  Package,
} from 'lucide-react';
import { Product } from '../types';
import { useLanguage } from '../utils/i18n';

interface AiAnalystScreenProps {
  products: Product[];
  onOpenRestockModal?: (productId?: string) => void;
  isDark?: boolean;
}

export const AiAnalystScreen: React.FC<AiAnalystScreenProps> = ({
  products,
  onOpenRestockModal,
  isDark,
}) => {
  const { language, t, formatCurr } = useLanguage();
  const [selectedInsight, setSelectedInsight] = useState<string>('insight-1');

  const lowStockProds = products.filter((p) => p.stock <= 10);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-purple-500/20">
              <Brain className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t.aiAnalystTitle}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              Gemini Pro Analytics
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.aiAnalystSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {language === 'vi' ? 'Cập nhật tự động: 2 phút trước' : 'Auto-updated: 2 minutes ago'}
          </span>
        </div>
      </div>

      {/* AI Key Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Insight 1 */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
            <Lightbulb className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">{t.growthOpportunity}</span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {t.crossSellTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            {t.crossSellDesc}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t.expectedRevenue}</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold cursor-pointer hover:underline">
              {t.createComboNow}
            </span>
          </div>
        </div>

        {/* Insight 2 */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">{t.outOfStockAlert}</span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {t.macbookStockRisk}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            {t.macbookStockDesc}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-red-500 font-semibold">{t.stock}: 5 {language === 'vi' ? 'cái' : 'units'}</span>
            <button
              onClick={() => onOpenRestockModal && onOpenRestockModal('prod-2')}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              {t.orderStockNow}
            </button>
          </div>
        </div>

        {/* Insight 3 */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">{t.priceMarginOptimization}</span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {t.tshirtElasticity}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            {t.tshirtElasticityDesc}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">{t.profitMargin}: 56%</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t.perfectOptimization}</span>
          </div>
        </div>
      </div>

      {/* Deep Executive AI Report */}
      <div
        className={`p-6 rounded-2xl border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {t.executiveAiReport}
            </h3>
          </div>
          <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-950/80 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800/40">
            {t.highLevelRecommendations}
          </span>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
              {t.cashFlowAnalysis}
            </h4>
            <p>
              {language === 'vi' ? (
                <>
                  Tồn kho hiện hữu đang chiếm <strong>850.000.000đ</strong> giá trị vốn. Trong đó, nhóm hàng điện thoại và máy tính xách tay chiếm tới 75% giá trị. Tốc độ luân chuyển kho ở Chi nhánh Quận 1 đạt 4.2 vòng/năm, cao hơn mức trung bình ngành 15%.
                </>
              ) : (
                <>
                  Current inventory accounts for <strong>$34,000</strong> in working capital. Electronics and laptops comprise 75% of total capital. Inventory turnover at District 1 branch reaches 4.2 turns/year, 15% above industry average.
                </>
              )}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
              {t.next7DaysActions}
            </h4>
            <ul className="list-disc list-inside space-y-1.5 mt-1 text-slate-700 dark:text-slate-300">
              <li>
                <strong>{language === 'vi' ? 'Bổ sung gấp tồn kho' : 'Urgent restock'}</strong>: {language === 'vi' ? 'Nhập thêm 20 tai nghe Sony WH-1000XM5 và 50 ốp lưng iPhone 15 Pro Max.' : 'Restock 20 units of Sony WH-1000XM5 and 50 iPhone 15 Pro Max Clear Cases.'}
              </li>
              <li>
                <strong>{language === 'vi' ? 'Kích hoạt chăm sóc khách hàng VVIP' : 'Activate VIP engagement'}</strong>: {language === 'vi' ? 'Gửi thông báo ưu đãi độc quyền qua Zalo/SMS cho 148 khách VIP có ngày sinh nhật trong tháng.' : 'Send personalized birthday perks via SMS/app notifications to 148 VIP customers this month.'}
              </li>
              <li>
                <strong>{language === 'vi' ? 'Mở rộng thanh toán VietQR' : 'Expand instant QR payments'}</strong>: {language === 'vi' ? 'Giảm thời gian chờ tại quầy POS từ 45 giây xuống còn 15 giây/giao dịch.' : 'Cut checkout counter wait times from 45s down to 15s per transaction.'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
