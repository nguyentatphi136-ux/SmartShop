import React, { useState } from 'react';
import { StockAsset } from '../types';
import { AssetBrandIcon } from './BrandLogos';

interface WatchlistCardProps {
  assets: StockAsset[];
  onSelectAsset: (asset: StockAsset) => void;
}

export const WatchlistCard: React.FC<WatchlistCardProps> = ({
  assets,
  onSelectAsset,
}) => {
  const [activeTab, setActiveTab] = useState<'most_viewed' | 'gain' | 'lose'>('most_viewed');

  const filteredAssets = assets.filter((asset) => {
    if (activeTab === 'gain') return asset.changePercent > 0;
    if (activeTab === 'lose') return asset.changePercent < 0;
    return asset.category === 'most_viewed' || true;
  }).slice(0, 4);

  return (
    <div
      id="card-watchlist"
      className="bg-[#18191e] border border-[#262832] rounded-[24px] p-5 h-full flex flex-col justify-between select-none"
    >
      {/* Header & Tabs */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-white font-bold text-sm sm:text-base tracking-tight">
            Watchlist
          </h2>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 mb-3.5">
          {[
            { id: 'most_viewed', label: 'Most Viewed' },
            { id: 'gain', label: 'Gain' },
            { id: 'lose', label: 'Lose' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-watchlist-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-[#292b37] text-white border border-[#3c3f50]'
                    : 'text-[#8e92a4] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Assets List */}
        <div className="space-y-3">
          {filteredAssets.map((asset) => {
            const isPos = asset.changePercent >= 0;
            return (
              <div
                key={asset.id}
                id={`watchlist-item-${asset.symbol.toLowerCase()}`}
                onClick={() => onSelectAsset(asset)}
                className="flex items-center justify-between p-1.5 -mx-1.5 rounded-xl hover:bg-white/[0.03] cursor-pointer transition-colors group"
              >
                {/* Left: Brand Icon + Name & Exchange */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#20222b] border border-[#2d303e] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <AssetBrandIcon type={asset.logoType} className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-white tracking-tight truncate group-hover:text-pink-300 transition-colors">
                      {asset.name}
                    </p>
                    <p className="text-[10px] text-[#8e92a4] tracking-tight">
                      {asset.exchange}
                    </p>
                  </div>
                </div>

                {/* Right: Price & Percent Change */}
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-white tracking-tight">
                    ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                  </p>
                  <p
                    className={`text-[10px] font-semibold tracking-tight ${
                      isPos ? 'text-[#22c55e]' : 'text-[#ef4444]'
                    }`}
                  >
                    {isPos ? `+${asset.changePercent}%` : `${asset.changePercent}%`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer subtle indicator */}
      <div className="pt-2 border-t border-[#23252f] flex items-center justify-between text-[11px] text-[#6b7082]">
        <span>4 active trackers</span>
        <span className="text-pink-400 font-semibold cursor-pointer hover:underline">
          Manage list →
        </span>
      </div>
    </div>
  );
};
