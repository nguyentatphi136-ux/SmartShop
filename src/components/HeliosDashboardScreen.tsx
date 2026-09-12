import React, { useState } from 'react';
import { UserProfile, StockAsset, PerformancePoint } from '../types';
import { TotalHoldingCard } from './TotalHoldingCard';
import { WatchlistCard } from './WatchlistCard';
import { MyPortfolioCard } from './MyPortfolioCard';
import { PortfolioPerformanceChart } from './PortfolioPerformanceChart';

interface HeliosDashboardScreenProps {
  user: UserProfile;
  holdings: StockAsset[];
  watchlist: StockAsset[];
  performanceData: PerformancePoint[];
  selectedRange: string;
  onRangeChange: (range: string) => void;
  selectedTimeframe: string;
  onTimeframeChange: (tf: string) => void;
  onSelectAsset: (asset: StockAsset) => void;
  onSeeAllPortfolio: () => void;
  onExploreAiInsights: () => void;
}

export const HeliosDashboardScreen: React.FC<HeliosDashboardScreenProps> = ({
  user,
  holdings,
  watchlist,
  performanceData,
  selectedRange,
  onRangeChange,
  selectedTimeframe,
  onTimeframeChange,
  onSelectAsset,
  onSeeAllPortfolio,
  onExploreAiInsights,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'market' | 'wallet' | 'tools'>('market');

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 max-w-[1600px] mx-auto select-none">
      {/* Sub-Nav Filter Pills (Market | Wallet | Tools) */}
      <div className="flex items-center gap-2">
        {[
          { id: 'market', label: 'Market' },
          { id: 'wallet', label: 'Wallet' },
          { id: 'tools', label: 'Tools' },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`subnav-tab-${tab.id}`}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-[#23252f] text-white border border-[#343746] shadow-sm'
                  : 'text-[#8e92a4] hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Top 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Column 1: Total Holding + AI Decisions Powered by Data */}
        <div className="h-full">
          <TotalHoldingCard
            user={user}
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={onTimeframeChange}
            onExploreAiInsights={onExploreAiInsights}
          />
        </div>

        {/* Column 2: Watchlist */}
        <div className="h-full">
          <WatchlistCard
            assets={watchlist}
            onSelectAsset={onSelectAsset}
          />
        </div>

        {/* Column 3: My Portfolio 2x2 Grid */}
        <div className="h-full md:col-span-2 lg:col-span-1">
          <MyPortfolioCard
            holdings={holdings}
            onSeeAll={onSeeAllPortfolio}
            onSelectHolding={onSelectAsset}
          />
        </div>
      </div>

      {/* Bottom Full Width Card: Portfolio Performance */}
      <div className="w-full">
        <PortfolioPerformanceChart
          data={performanceData}
          selectedRange={selectedRange}
          onRangeChange={onRangeChange}
        />
      </div>
    </div>
  );
};
