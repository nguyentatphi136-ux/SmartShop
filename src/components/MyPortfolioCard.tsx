import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { StockAsset } from '../types';
import { AssetBrandIcon } from './BrandLogos';

interface MyPortfolioCardProps {
  holdings: StockAsset[];
  onSeeAll: () => void;
  onSelectHolding: (asset: StockAsset) => void;
}

export const MyPortfolioCard: React.FC<MyPortfolioCardProps> = ({
  holdings,
  onSeeAll,
  onSelectHolding,
}) => {
  return (
    <div
      id="card-my-portfolio"
      className="bg-[#18191e] border border-[#262832] rounded-[24px] p-5 h-full flex flex-col justify-between select-none"
    >
      {/* Header with Title & Action buttons */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-white font-bold text-sm sm:text-base tracking-tight">
            My Portfolio
          </h2>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-portfolio-see-all"
              onClick={onSeeAll}
              className="px-3 py-1 bg-[#20222a] hover:bg-[#282a36] border border-[#2d303f] rounded-full text-xs font-semibold text-white transition-colors"
            >
              See all
            </button>
            <button
              onClick={onSeeAll}
              className="w-7 h-7 rounded-full bg-[#20222a] hover:bg-[#282a36] border border-[#2d303f] flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              title="Open full portfolio view"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2x2 Grid of holding tiles */}
        <div className="grid grid-cols-2 gap-2.5">
          {holdings.slice(0, 4).map((asset) => {
            return (
              <div
                key={asset.id}
                id={`holding-tile-${asset.symbol.toLowerCase()}`}
                onClick={() => onSelectHolding(asset)}
                className="bg-[#1e1f26] hover:bg-[#242630] border border-[#2a2c38] hover:border-[#383b4b] rounded-[18px] p-3 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
              >
                {/* Price & Change */}
                <div>
                  <p className="text-xs sm:text-[13px] font-extrabold text-white tracking-tight">
                    $ {asset.price.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                  </p>
                  <p className="text-[10px] font-semibold text-[#22c55e] mt-0.5 tracking-tight">
                    +{asset.changeValue.toFixed(2)} ({asset.changePercent}%)
                  </p>
                </div>

                {/* Bottom: Logo + Symbol + Units */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#272935]">
                  <div className="flex items-center gap-1.5">
                    <div className="text-white">
                      <AssetBrandIcon type={asset.logoType} className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-white tracking-tight">
                      {asset.symbol}
                    </span>
                  </div>

                  <span className="text-[10px] font-medium text-[#8e92a4]">
                    Units {asset.unitsHeld}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick summary footer */}
      <div className="pt-2.5 border-t border-[#23252f] flex items-center justify-between text-[11px] text-[#6b7082]">
        <span>4 Active Equities</span>
        <span className="text-emerald-400 font-semibold">+3.11% overall</span>
      </div>
    </div>
  );
};
