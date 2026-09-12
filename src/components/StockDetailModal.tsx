import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  DollarSign,
  Layers,
  BarChart2,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { StockAsset } from '../types';
import { AssetBrandIcon } from './BrandLogos';

interface StockDetailModalProps {
  asset: StockAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onTrade: (symbol: string, type: 'BUY' | 'SELL', units: number, price: number) => void;
  cashBalance: number;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  asset,
  isOpen,
  onClose,
  onTrade,
  cashBalance,
}) => {
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [units, setUnits] = useState<number>(1);
  const [tradeSuccess, setTradeSuccess] = useState(false);

  if (!isOpen || !asset) return null;

  const totalCost = units * asset.price;
  const isPos = asset.changePercent >= 0;

  const handleExecuteTrade = () => {
    onTrade(asset.symbol, tradeType, units, asset.price);
    setTradeSuccess(true);
    setTimeout(() => {
      setTradeSuccess(false);
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-lg bg-[#15161d] border border-[#2c2e3d] rounded-[28px] p-6 shadow-2xl relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#242633]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#20222b] border border-[#2f3242] flex items-center justify-center">
              <AssetBrandIcon type={asset.logoType} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">{asset.name}</h3>
                <span className="text-xs font-semibold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                  {asset.symbol}
                </span>
              </div>
              <p className="text-[11px] text-[#8e92a4]">{asset.exchange}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#20222c] border border-[#2a2c3a] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Price & Change Banner */}
        <div className="py-4 flex items-baseline justify-between">
          <div>
            <span className="text-xs text-[#8e92a4] block">Market Price</span>
            <span className="text-2xl font-black text-white tracking-tight">
              ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isPos ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}
          >
            {isPos ? `+${asset.changePercent}%` : `${asset.changePercent}%`}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5 py-3 border-y border-[#242633] text-center">
          <div className="bg-[#1b1c25] p-2.5 rounded-xl border border-[#282a38]">
            <span className="text-[10px] text-[#8e92a4] block">Market Cap</span>
            <span className="text-xs font-bold text-white mt-0.5 block">{asset.marketCap || '$1.8T'}</span>
          </div>
          <div className="bg-[#1b1c25] p-2.5 rounded-xl border border-[#282a38]">
            <span className="text-[10px] text-[#8e92a4] block">P/E Ratio</span>
            <span className="text-xs font-bold text-white mt-0.5 block">{asset.peRatio || '34.2'}</span>
          </div>
          <div className="bg-[#1b1c25] p-2.5 rounded-xl border border-[#282a38]">
            <span className="text-[10px] text-[#8e92a4] block">Analyst Rating</span>
            <span className="text-xs font-bold text-pink-400 mt-0.5 block">{asset.analystRating || 'Strong Buy'}</span>
          </div>
        </div>

        {/* Trade Execution Panel */}
        <div className="mt-4 space-y-4">
          {/* Buy/Sell Selector */}
          <div className="flex p-1 bg-[#1b1c25] rounded-xl border border-[#282a38]">
            <button
              onClick={() => setTradeType('BUY')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tradeType === 'BUY'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Buy {asset.symbol}
            </button>
            <button
              onClick={() => setTradeType('SELL')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tradeType === 'SELL'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sell {asset.symbol}
            </button>
          </div>

          {/* Quantity Input */}
          <div className="flex items-center justify-between bg-[#1b1c25] border border-[#282a38] rounded-xl p-3">
            <span className="text-xs text-[#8e92a4]">Number of Units</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setUnits(Math.max(1, units - 1))}
                className="w-7 h-7 rounded-lg bg-[#252734] text-white flex items-center justify-center font-bold text-sm"
              >
                -
              </button>
              <span className="text-sm font-bold text-white w-8 text-center">{units}</span>
              <button
                onClick={() => setUnits(units + 1)}
                className="w-7 h-7 rounded-lg bg-[#252734] text-white flex items-center justify-center font-bold text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Trade Calculation Summary */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-[#8e92a4]">Estimated Total:</span>
            <span className="font-bold text-white text-sm">
              ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Action button */}
          {tradeSuccess ? (
            <div className="py-3 bg-emerald-600/20 border border-emerald-500/50 rounded-xl flex items-center justify-center gap-2 text-emerald-300 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Order Executed Successfully!</span>
            </div>
          ) : (
            <button
              id="btn-confirm-trade"
              onClick={handleExecuteTrade}
              className={`w-full py-3 rounded-xl font-bold text-xs text-white transition-all shadow-lg cursor-pointer ${
                tradeType === 'BUY'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-900/30'
                  : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-900/30'
              }`}
            >
              Confirm {tradeType} Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
