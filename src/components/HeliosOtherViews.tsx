import React, { useState } from 'react';
import {
  TrendingUp,
  PieChart,
  ShieldCheck,
  Zap,
  Globe,
  Sliders,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Headphones,
  FileText,
  Lock,
} from 'lucide-react';
import { StockAsset, UserProfile, HeliosTab } from '../types';
import { AssetBrandIcon } from './BrandLogos';

interface ViewProps {
  holdings: StockAsset[];
  watchlist: StockAsset[];
  user: UserProfile;
  onSelectAsset: (asset: StockAsset) => void;
  onOpenAiAssistant: (q?: string) => void;
}

export const PortfolioView: React.FC<ViewProps> = ({
  holdings,
  user,
  onSelectAsset,
  onOpenAiAssistant,
}) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Portfolio Management & Asset Ledger
          </h2>
          <p className="text-xs sm:text-sm text-[#8e92a4] mt-0.5">
            Real-time equity breakdown, fractional allocations, and risk scoring
          </p>
        </div>
        <button
          onClick={() => onOpenAiAssistant('Provide a comprehensive portfolio breakdown for my current holdings')}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-xs rounded-full shadow-lg shadow-pink-500/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>AI Rebalance Report</span>
        </button>
      </div>

      {/* Allocation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#18191e] border border-[#262832] rounded-2xl p-4">
          <span className="text-xs text-[#8e92a4]">Total Equity Value</span>
          <p className="text-xl font-black text-white mt-1">
            ${user.totalHolding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-emerald-400 font-semibold mt-1 inline-block">
            +3.11% in current cycle
          </span>
        </div>
        <div className="bg-[#18191e] border border-[#262832] rounded-2xl p-4">
          <span className="text-xs text-[#8e92a4]">Cash & Liquidity</span>
          <p className="text-xl font-black text-white mt-1">
            ${user.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400 font-semibold mt-1 inline-block">
            Ready for deployment
          </span>
        </div>
        <div className="bg-[#18191e] border border-[#262832] rounded-2xl p-4">
          <span className="text-xs text-[#8e92a4]">Sharpe Ratio / Beta</span>
          <p className="text-xl font-black text-white mt-1">2.41 / 1.14</p>
          <span className="text-[11px] text-pink-400 font-semibold mt-1 inline-block">
            Optimal Risk-Adjusted
          </span>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-[#18191e] border border-[#262832] rounded-2xl p-5 overflow-x-auto">
        <h3 className="text-sm font-bold text-white mb-4">Current Equities & Holdings</h3>
        <table className="w-full text-left text-xs min-w-[550px]">
          <thead>
            <tr className="border-b border-[#262832] text-[#8e92a4] pb-2">
              <th className="pb-3 font-semibold">Asset</th>
              <th className="pb-3 font-semibold">Units Held</th>
              <th className="pb-3 font-semibold">Price</th>
              <th className="pb-3 font-semibold">Today's Return</th>
              <th className="pb-3 font-semibold">Total Value</th>
              <th className="pb-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#22242e]">
            {holdings.map((h) => (
              <tr key={h.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3.5 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#22242d] flex items-center justify-center">
                    <AssetBrandIcon type={h.logoType} className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-white">{h.symbol}</span>
                    <span className="text-[11px] text-slate-400 block">{h.name}</span>
                  </div>
                </td>
                <td className="py-3.5 text-slate-300 font-medium">{h.unitsHeld || 10}</td>
                <td className="py-3.5 text-white font-bold">${h.price.toLocaleString()}</td>
                <td className="py-3.5 text-emerald-400 font-bold">+{h.changePercent}%</td>
                <td className="py-3.5 text-white font-bold">
                  ${((h.unitsHeld || 10) * h.price).toLocaleString()}
                </td>
                <td className="py-3.5 text-right">
                  <button
                    onClick={() => onSelectAsset(h)}
                    className="px-3 py-1 bg-[#242633] hover:bg-pink-600/30 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold border border-[#303344] transition-colors"
                  >
                    Trade
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const AnalysisView: React.FC<ViewProps> = ({ user, holdings, onOpenAiAssistant }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Institutional Technical & Fundamental Analysis
          </h2>
          <p className="text-xs sm:text-sm text-[#8e92a4] mt-0.5">
            Powered by Helios Quantitative Engine & LLM Market Telemetry
          </p>
        </div>
        <button
          onClick={() => onOpenAiAssistant('Run full quantitative factor analysis on tech stocks')}
          className="px-4 py-2 bg-[#252834] hover:bg-[#303344] text-white font-semibold text-xs rounded-full border border-[#383c4e] transition-colors flex items-center gap-1.5"
        >
          <span>Run Quant Models</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-[#18191e] border border-[#262832] rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white">Macro Market Regime</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Current macroeconomic factors indicate a resilient earnings expansion in AI compute infrastructure, offset by tight yield curves. Mega-cap tech retains strong pricing leverage.
          </p>
          <div className="pt-2 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              Bullish Momentum
            </span>
            <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold">
              AI Secular Growth
            </span>
          </div>
        </div>

        <div className="bg-[#18191e] border border-[#262832] rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white">Portfolio Stress Testing</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Simulated 200 bps interest rate hike scenario yields a maximum drawdown of -4.2%, well within acceptable institutional bounds for Nadia's growth profile.
          </p>
          <div className="pt-2 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
              Max Drawdown: -4.2%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MarketView: React.FC<ViewProps> = ({ watchlist, onSelectAsset }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Global Markets & Live Screener
        </h2>
        <p className="text-xs sm:text-sm text-[#8e92a4] mt-0.5">
          Real-time price feeds across NYSE, NASDAQ, ETFs, and Digital Assets
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {watchlist.map((asset) => (
          <div
            key={asset.id}
            onClick={() => onSelectAsset(asset)}
            className="bg-[#18191e] border border-[#262832] hover:border-[#3a3d4e] rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#20222b] flex items-center justify-center">
                  <AssetBrandIcon type={asset.logoType} className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{asset.name}</h4>
                  <span className="text-[10px] text-[#8e92a4]">{asset.exchange}</span>
                </div>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  asset.changePercent >= 0
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-rose-400 bg-rose-500/10'
                }`}
              >
                {asset.changePercent >= 0 ? `+${asset.changePercent}%` : `${asset.changePercent}%`}
              </span>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-lg font-black text-white">${asset.price.toLocaleString()}</span>
              <span className="text-[10px] text-pink-400 font-semibold">{asset.analystRating || 'Buy'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CommunityView: React.FC = () => (
  <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
        Helios Investor Community & Top Trader Alpha
      </h2>
      <p className="text-xs sm:text-sm text-[#8e92a4] mt-0.5">
        Follow verified high-net-worth portfolio allocations and verified hedge fund strategies
      </p>
    </div>

    <div className="space-y-4">
      {[
        {
          author: 'Marcus Sterling',
          handle: '@marcus_alpha',
          text: 'Blackwell GPU hyperscaler capacity contracts are expanding margins. Increasing NVDA to 22% weighting.',
          likes: '142',
          tag: 'NVDA +2.12%',
        },
        {
          author: 'Elena Vance',
          handle: '@vance_quant',
          text: 'Spotify subscription ARPUs in Europe are beating Q2 consensus. Momentum setup looking textbook.',
          likes: '89',
          tag: 'SPOT +16.31%',
        },
      ].map((post, i) => (
        <div key={i} className="bg-[#18191e] border border-[#262832] rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white">{post.author}</span>
              <span className="text-[11px] text-[#8e92a4] ml-2">{post.handle}</span>
            </div>
            <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10">
              {post.tag}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{post.text}</p>
        </div>
      ))}
    </div>
  </div>
);

export const SupportView: React.FC = () => (
  <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto select-none">
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
        Helios 24/7 Private Wealth Concierge
      </h2>
      <p className="text-xs sm:text-sm text-[#8e92a4] mt-0.5">
        Dedicated portfolio manager access and technical trading desk assistance
      </p>
    </div>

    <div className="bg-[#18191e] border border-[#262832] rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
          <Headphones className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Priority Concierge Desk Active</h3>
          <p className="text-xs text-[#8e92a4]">Average response latency: &lt; 45 seconds</p>
        </div>
      </div>
      <textarea
        placeholder="How can our institutional trading desk assist your account today?"
        className="w-full h-28 bg-[#14151b] border border-[#262832] rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500/50"
      />
      <button className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs rounded-xl shadow-md">
        Submit Private Inquiry
      </button>
    </div>
  </div>
);
