import React from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface TotalHoldingCardProps {
  user: UserProfile;
  selectedTimeframe: string;
  onTimeframeChange: (tf: string) => void;
  onExploreAiInsights: () => void;
}

export const TotalHoldingCard: React.FC<TotalHoldingCardProps> = ({
  user,
  selectedTimeframe,
  onTimeframeChange,
  onExploreAiInsights,
}) => {
  return (
    <div className="flex flex-col gap-3.5 h-full select-none">
      {/* 1. Total Holding Card */}
      <div
        id="card-total-holding"
        className="bg-[#18191e] border border-[#262832] rounded-[24px] p-5 relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <span className="text-[#9ba0b4] text-xs sm:text-[13px] font-semibold tracking-tight">
            Total Holding
          </span>

          {/* Timeframe pill dropdown */}
          <button
            id="btn-holding-timeframe"
            onClick={() => onTimeframeChange(selectedTimeframe === '6M' ? '1Y' : '6M')}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#20222a] hover:bg-[#282a36] border border-[#2d303f] rounded-full text-xs font-semibold text-white transition-colors"
          >
            <span>{selectedTimeframe}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Big Number */}
        <div className="mt-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            $ {user.totalHolding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h2>
        </div>
      </div>

      {/* 2. Decisions Powered by Data (AI Hero Card) */}
      <div
        id="card-ai-decisions"
        className="flex-1 bg-gradient-to-b from-[#1c1a24] via-[#1a1721] to-[#15131b] border border-[#32283a] rounded-[24px] p-5 flex flex-col justify-between relative overflow-hidden group shadow-lg"
      >
        {/* Glowing cosmic nebula background aura */}
        <div className="absolute -bottom-8 -left-8 -right-8 h-32 bg-gradient-to-t from-pink-500/20 via-purple-500/10 to-transparent blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10">
          <h3 className="text-white font-bold text-sm sm:text-base tracking-tight">
            Decisions Powered by Data
          </h3>
          <p className="text-[#a1a5b8] text-[11px] sm:text-xs leading-relaxed mt-2 line-clamp-3">
            Move beyond guesswork with AI-driven investment insights tailored to your strategy.
          </p>
        </div>

        {/* Explore AI Insights Button with Radiant Halo */}
        <div className="pt-4 relative z-10 flex justify-center">
          <button
            id="btn-explore-ai-insights"
            onClick={onExploreAiInsights}
            className="w-full max-w-[200px] py-2 px-4 rounded-full bg-[#ec4899]/25 hover:bg-[#ec4899]/35 text-white font-semibold text-xs border border-[#ec4899]/60 shadow-[0_0_20px_rgba(236,72,153,0.35)] hover:shadow-[0_0_30px_rgba(236,72,153,0.55)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-pink-300" />
            <span className="truncate">Explore AI Insights</span>
          </button>
        </div>
      </div>
    </div>
  );
};
