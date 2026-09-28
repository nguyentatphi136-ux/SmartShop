import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Zap,
  Target,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  DollarSign,
  Package,
  RefreshCw,
  Send,
  ShieldAlert,
  Percent,
  Compass,
  ArrowUpRight,
  Clock,
  Check,
  Copy,
} from 'lucide-react';
import { Product } from '../types';
import { useLanguage } from '../utils/i18n';

interface AiAnalystScreenProps {
  products: Product[];
  orders?: any[];
  token?: string | null;
  onOpenRestockModal?: (productId?: string) => void;
  isDark?: boolean;
}

interface AnalysisData {
  businessHealthScore: number;
  healthEvaluation: string;
  keyInsights: {
    crossSell: {
      title: string;
      description: string;
      expectedRevenueIncrease: string;
      primaryProductName?: string;
      comboProductName?: string;
      primaryProductId?: string;
      comboProductId?: string;
    };
    inventoryRisk: {
      title: string;
      description: string;
      criticalStock: number;
      productName?: string;
      productId?: string;
      urgency: 'high' | 'medium' | 'low';
    };
    marginOptimization: {
      title: string;
      description: string;
      marginPercent: number;
      productName?: string;
      productId?: string;
      recommendation: string;
    };
    salesForecast: {
      title: string;
      description: string;
      projectedRevenueNextWeek: string;
      trend: 'up' | 'stable' | 'down';
    };
  };
  executiveSummary: {
    cashFlowAnalysis: string;
    workingCapitalStatus: string;
    inventoryTurnoverRatio: string;
  };
  actionPlan7Days: Array<{
    category: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  promotionalIdeas: Array<{
    title: string;
    targetProducts: string;
    mechanism: string;
  }>;
}

interface AnalysisStats {
  totalProducts: number;
  totalStock: number;
  totalInventoryCost: number;
  totalRevenue: number;
  completedOrdersCount: number;
  lowStockCount: number;
}

export const AiAnalystScreen: React.FC<AiAnalystScreenProps> = ({
  products,
  orders,
  token,
  onOpenRestockModal,
  isDark,
}) => {
  const { language, formatCurr } = useLanguage();

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [aiEngine, setAiEngine] = useState<string>('Google Gemini AI');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingStep, setLoadingStep] = useState<string>('Đang quét dữ liệu cửa hàng...');
  const [error, setError] = useState<string | null>(null);

  // Strategist Q&A state
  const [queryText, setQueryText] = useState<string>('');
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [queryResponse, setQueryResponse] = useState<string | null>(null);
  const [copiedCombo, setCopiedCombo] = useState<boolean>(false);

  const authToken = token || localStorage.getItem('smartsale_session_token');

  const fetchAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setLoadingStep('Đang tổng hợp dữ liệu sản phẩm & hóa đơn SQLite...');

    try {
      setTimeout(() => setLoadingStep('Gemini AI đang phân tích dòng tiền & dự báo...'), 600);

      const res = await fetch('/api/ai/analyze-business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error('Không thể kết nối dịch vụ phân tích AI.');
      }

      const json = await res.json();
      if (json.success && json.data) {
        setAnalysis(json.data);
        setStats(json.stats || null);
        setAiEngine(json.aiEngine || 'Google Gemini AI');
        setLastUpdated(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } else {
        throw new Error(json.error || 'Dữ liệu phân tích không hợp lệ.');
      }
    } catch (err: any) {
      console.error('Failed to fetch AI business analysis:', err);
      setError(err.message || 'Lỗi khi tải phân tích AI.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [products.length, orders?.length]);

  const handleAskAnalyst = async (questionToAsk?: string) => {
    const q = (questionToAsk || queryText).trim();
    if (!q) return;

    setIsQuerying(true);
    try {
      const res = await fetch('/api/ai/analyst-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ question: q }),
      });

      const json = await res.json();
      if (json.success && json.answer) {
        setQueryResponse(json.answer);
      } else {
        setQueryResponse('Không thể nhận phản hồi từ AI Analyst lúc này.');
      }
    } catch (err) {
      setQueryResponse('Lỗi kết nối khi gửi câu hỏi tới AI.');
    } finally {
      setIsQuerying(false);
    }
  };

  const handleCopyCombo = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCombo(true);
    setTimeout(() => setCopiedCombo(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {language === 'vi' ? 'AI Business Analyst' : 'AI Business Analyst'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-500 animate-pulse" />
                  <span>{aiEngine}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'vi'
                  ? 'Trợ lý Giám đốc Phân tích Bán lẻ AI: Khai phá cơ hội doanh thu, cảnh báo rủi ro tồn đọng vốn và đề xuất chiến lược thực tế'
                  : 'AI Retail Business Analyst: Uncover revenue opportunities, cash-flow risks, and actionable recommendations'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === 'vi' ? `Phân tích lúc ${lastUpdated}` : `Analyzed at ${lastUpdated}`}</span>
            </span>
          )}

          <button
            onClick={fetchAnalysis}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? (language === 'vi' ? 'Đang phân tích...' : 'Analyzing...') : (language === 'vi' ? 'Làm mới phân tích AI' : 'Refresh AI Analysis')}</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton or Banner */}
      {isLoading && (
        <div className="p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
            <RefreshCw className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <p className="text-xs font-bold text-purple-900 dark:text-purple-200">
              {loadingStep}
            </p>
            <p className="text-[11px] text-purple-700 dark:text-purple-400 mt-0.5">
              Hệ thống đang đối chiếu dữ liệu hóa đơn, biên lợi nhuận sản phẩm và danh mục kho trong SQLite...
            </p>
          </div>
        </div>
      )}

      {error && !isLoading && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-center justify-between text-xs text-red-700 dark:text-red-300">
          <span>{error}</span>
          <button onClick={fetchAnalysis} className="font-bold underline cursor-pointer">
            Thử lại
          </button>
        </div>
      )}

      {/* Overview Statistics Banner */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>{language === 'vi' ? 'Vốn hàng tồn kho' : 'Inventory Cost'}</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {formatCurr(stats.totalInventoryCost)}
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              {stats.totalStock} {language === 'vi' ? 'sản phẩm trong kho' : 'units in stock'}
            </span>
          </div>

          <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>{language === 'vi' ? 'Doanh thu hoàn tất' : 'Total Revenue'}</span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {formatCurr(stats.totalRevenue)}
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              {stats.completedOrdersCount} {language === 'vi' ? 'hóa đơn hoàn tất' : 'completed orders'}
            </span>
          </div>

          <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>{language === 'vi' ? 'Danh mục theo dõi' : 'Active Catalog'}</span>
              <Package className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {stats.totalProducts} {language === 'vi' ? 'mã hàng' : 'SKUs'}
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              {language === 'vi' ? 'Đang đồng bộ SQLite' : 'Synced from SQLite'}
            </span>
          </div>

          <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>{language === 'vi' ? 'Cảnh báo tồn kho' : 'Low Stock Alert'}</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
              {stats.lowStockCount} {language === 'vi' ? 'mã cần bổ sung' : 'need restock'}
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              {language === 'vi' ? 'Mức tồn <= 10 chiếc' : 'Stock level <= 10 units'}
            </span>
          </div>
        </div>
      )}

      {/* Health Score & High Level Overview */}
      {analysis && (
        <div className={`p-5 rounded-3xl border transition-all bg-gradient-to-br ${
          isDark
            ? 'from-slate-900 via-purple-950/20 to-slate-900 border-slate-800'
            : 'from-white via-purple-50/40 to-indigo-50/30 border-purple-100 shadow-sm'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                <Compass className="w-4 h-4" />
                <span>{language === 'vi' ? 'Đánh giá sức khỏe kinh doanh' : 'Business Health Index'}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {analysis.healthEvaluation}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {analysis.executiveSummary?.workingCapitalStatus} {analysis.executiveSummary?.inventoryTurnoverRatio}
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white dark:bg-slate-800/80 px-5 py-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm shrink-0">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Health Score
                </span>
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                  {analysis.businessHealthScore}/100
                </span>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-600 flex items-center justify-center font-bold text-xs text-purple-600 dark:text-purple-300">
                <Zap className="w-5 h-5 fill-purple-600 text-purple-600 dark:fill-purple-400 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Key Insights Grid */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Cross-sell Combo Opportunity */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div>
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                <Lightbulb className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {language === 'vi' ? 'Bán chéo & Combo' : 'Cross-sell Opportunity'}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                {analysis.keyInsights.crossSell.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {analysis.keyInsights.crossSell.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {analysis.keyInsights.crossSell.expectedRevenueIncrease}
              </span>
              <button
                onClick={() => handleCopyCombo(`${analysis.keyInsights.crossSell.primaryProductName || ''} + ${analysis.keyInsights.crossSell.comboProductName || ''}`)}
                className="text-purple-600 dark:text-purple-400 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                {copiedCombo ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-500">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Sao chép combo</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2. Inventory Risk Warning */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div>
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                <ShieldAlert className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {language === 'vi' ? 'Cảnh báo tồn kho' : 'Stock Depletion Risk'}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                {analysis.keyInsights.inventoryRisk.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {analysis.keyInsights.inventoryRisk.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-red-500 font-bold">
                {language === 'vi' ? `Tồn: ${analysis.keyInsights.inventoryRisk.criticalStock} chiếc` : `Stock: ${analysis.keyInsights.inventoryRisk.criticalStock}`}
              </span>
              <button
                onClick={() => onOpenRestockModal && onOpenRestockModal(analysis.keyInsights.inventoryRisk.productId)}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{language === 'vi' ? 'Nhập hàng ngay' : 'Restock Now'}</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 3. Margin & Pricing Optimization */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                <Percent className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {language === 'vi' ? 'Biên lợi nhuận cao' : 'Margin Optimization'}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                {analysis.keyInsights.marginOptimization.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {analysis.keyInsights.marginOptimization.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {analysis.keyInsights.marginOptimization.marginPercent}% {language === 'vi' ? 'biên lãi' : 'margin'}
              </span>
              <span className="text-slate-400 text-[11px]">
                {language === 'vi' ? 'Ưu tiên tư vấn' : 'High Priority'}
              </span>
            </div>
          </div>

          {/* 4. Sales Forecast */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {language === 'vi' ? 'Dự báo dòng tiền' : 'Revenue Forecast'}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                {analysis.keyInsights.salesForecast.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {analysis.keyInsights.salesForecast.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-blue-600 dark:text-blue-400 font-bold">
                {analysis.keyInsights.salesForecast.projectedRevenueNextWeek}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 uppercase">
                {analysis.keyInsights.salesForecast.trend}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 7-Day Action Plan & Executive Report */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 7-Day Plan */}
          <div className={`p-6 rounded-2xl border transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  {language === 'vi' ? 'Kế hoạch hành động 7 ngày tới' : 'Next 7 Days Action Plan'}
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-900">
                {analysis.actionPlan7Days.length} {language === 'vi' ? 'đầu việc' : 'tasks'}
              </span>
            </div>

            <div className="space-y-3">
              {analysis.actionPlan7Days.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-start gap-3 text-xs"
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold ${
                    item.priority === 'high'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      : item.priority === 'medium'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{item.category}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        item.priority === 'high'
                          ? 'text-red-600 bg-red-50 dark:bg-red-900/40'
                          : 'text-slate-500 bg-slate-100 dark:bg-slate-700'
                      }`}>
                        {item.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {item.action}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cashflow & Promotional Ideas */}
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  {language === 'vi' ? 'Báo cáo Dòng tiền & Vốn hàng' : 'Cash Flow & Inventory Capital'}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {analysis.executiveSummary.cashFlowAnalysis}
              </p>
            </div>

            <div className={`p-6 rounded-2xl border transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  {language === 'vi' ? 'Ý tưởng Chiến dịch Kích cầu' : 'Promotional Campaign Ideas'}
                </h3>
              </div>
              <div className="space-y-2.5">
                {analysis.promotionalIdeas?.map((idea, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 text-xs">
                    <p className="font-bold text-purple-900 dark:text-purple-200">{idea.title}</p>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5"><strong>Áp dụng:</strong> {idea.targetProducts}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5"><strong>Cơ chế:</strong> {idea.mechanism}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive AI Business Analyst Strategic Q&A */}
      <div className={`p-6 rounded-3xl border transition-all ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {language === 'vi' ? 'Hỏi Chuyên gia Chiến lược AI' : 'Consult AI Strategy Specialist'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'vi' ? 'Đặt câu hỏi cụ thể về sản phẩm, doanh số hoặc chính sách giá của cửa hàng bạn' : 'Ask specific questions regarding store strategy, margins, or promotions'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick prompt pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
          <span className="text-slate-400 shrink-0 text-[11px]">Gợi ý:</span>
          {[
            'Làm thế nào để tăng doanh số dòng phụ kiện tai nghe?',
            'Có nên áp dụng khuyến mãi giảm giá 10% cuối tuần này?',
            'Chiến lược xử lý các mặt hàng tồn kho lâu ngày?',
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQueryText(prompt);
                handleAskAnalyst(prompt);
              }}
              className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-950/80 dark:hover:text-purple-300 transition-all shrink-0 cursor-pointer text-[11px] border border-slate-200 dark:border-slate-700"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskAnalyst();
          }}
          className="mt-3 flex gap-2"
        >
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder={language === 'vi' ? 'Nhập câu hỏi chiến lược cho AI Analyst...' : 'Type strategic question for AI Analyst...'}
            className={`flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border outline-none transition-all ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
            }`}
          />
          <button
            type="submit"
            disabled={isQuerying || !queryText.trim()}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-purple-500/20 active:scale-95"
          >
            {isQuerying ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Hỏi AI</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Answer Box */}
        {queryResponse && (
          <div className="mt-4 p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line animate-fadeIn">
            <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Phân tích chiến lược từ {aiEngine}:</span>
            </div>
            {queryResponse}
          </div>
        )}
      </div>
    </div>
  );
};
