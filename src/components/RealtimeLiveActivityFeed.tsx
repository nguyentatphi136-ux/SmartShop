import React, { useState } from 'react';
import {
  Zap,
  ShoppingBag,
  AlertTriangle,
  Package,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { RealtimeActivity } from '../types';
import { useLanguage } from '../utils/i18n';

interface RealtimeLiveActivityFeedProps {
  activities: RealtimeActivity[];
  onViewOrderDetails?: (orderId: string) => void;
  onOpenRestockModal?: (productId?: string) => void;
  isDark?: boolean;
}

export const RealtimeLiveActivityFeed: React.FC<RealtimeLiveActivityFeedProps> = ({
  activities,
  onViewOrderDetails,
  onOpenRestockModal,
  isDark,
}) => {
  const { language, t, formatCurr } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'order' | 'stock' | 'ai'>('all');

  const filteredActivities = activities.filter((act) => {
    if (filter === 'order') return act.type === 'order' || act.type === 'payment';
    if (filter === 'stock') return act.type === 'restock' || act.type === 'stock_warning';
    if (filter === 'ai') return act.type === 'ai_insight';
    return true;
  });

  return (
    <div
      id="realtime-activity-feed-card"
      className={`p-5 rounded-2xl border transition-all ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Zap className="w-4 h-4 text-blue-500 fill-blue-500/30" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                {t.activityFeedTitle}
              </h2>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.activityFeedSubtitle}
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {t.allFilter} ({activities.length})
          </button>
          <button
            onClick={() => setFilter('order')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              filter === 'order'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {t.ordersFilter}
          </button>
          <button
            onClick={() => setFilter('stock')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              filter === 'stock'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {t.inventoryFilter}
          </button>
          <button
            onClick={() => setFilter('ai')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              filter === 'ai'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {t.aiInsightsFilter}
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[380px] overflow-y-auto pr-1">
        {filteredActivities.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            {t.noActivitiesFound}
          </div>
        ) : (
          filteredActivities.map((act) => {
            const isOrder = act.type === 'order' || act.type === 'payment';
            const isWarning = act.type === 'stock_warning';
            const isRestock = act.type === 'restock';
            const isAi = act.type === 'ai_insight';

            return (
              <div
                key={act.id}
                className="py-3 px-2 flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all animate-in fade-in slide-in-from-top-1"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isOrder
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40'
                        : isWarning
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40'
                        : isRestock
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40'
                        : 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/40'
                    }`}
                  >
                    {isOrder ? (
                      <ShoppingBag className="w-4 h-4" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : isRestock ? (
                      <Package className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {act.title}
                      </p>
                      {act.channel && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {act.channel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {act.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{act.timestamp}</span>
                      {act.amount !== undefined && (
                        <>
                          <span>•</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            +{formatCurr(act.amount)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Quick Action */}
                <div className="flex items-center flex-shrink-0 self-center">
                  {isWarning && onOpenRestockModal && (
                    <button
                      onClick={() => onOpenRestockModal()}
                      className="px-2 py-1 rounded-lg text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 border border-amber-200 dark:border-amber-800/60 transition-colors"
                    >
                      {t.restockNow}
                    </button>
                  )}
                  {isOrder && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/40">
                      {t.statusPaid}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
