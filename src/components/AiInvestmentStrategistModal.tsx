import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  TrendingUp,
  ShieldAlert,
  SlidersHorizontal,
  Zap,
  ArrowRight,
  Bot,
  User,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { AiInsightMessage, UserProfile, StockAsset } from '../types';

interface AiInvestmentStrategistModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  initialQuery?: string;
  holdings: StockAsset[];
  watchlist: StockAsset[];
}

export const AiInvestmentStrategistModal: React.FC<AiInvestmentStrategistModalProps> = ({
  isOpen,
  onClose,
  user,
  initialQuery = '',
  holdings,
  watchlist,
}) => {
  const [messages, setMessages] = useState<AiInsightMessage[]>([
    {
      id: 'msg-welcome',
      role: 'ai',
      text: `### SmartShop AI
Xin chào **${user.name}**. Tôi chỉ phân tích dữ liệu bán hàng và tồn kho SmartShop trong phiên này. Hãy hỏi về sản phẩm, tồn kho hoặc doanh thu.`,
      timestamp: 'Just now',
      insightType: 'strategy',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { label: '📊 Analyze Portfolio Allocation', query: 'Analyze my total holding and asset allocation risk' },
    { label: '🧠 NVDA Blackwell Catalyst', query: 'What is the institutional outlook for NVDA and AI hardware?' },
    { label: '🎵 SPOT Breakout Analysis', query: 'Why did Spotify surge +16.31% today and should I buy?' },
    { label: '⚖️ Rebalance Strategy', query: 'How should I rebalance my tech heavy portfolio to lock in gains?' },
  ];

  useEffect(() => {
    if (initialQuery && isOpen) {
      handleSend(initialQuery);
    }
  }, [initialQuery, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMsg: AiInsightMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('smartsale_session_token') || ''}`,
        },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-4).map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            text: m.text,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.reply) throw new Error(data.error || 'AI không thể xử lý yêu cầu.');
      const aiReply: AiInsightMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: data.reply || 'Data synchronization complete. All market metrics updated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        insightType: 'strategy',
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'ai',
          text: 'Không thể kết nối Trợ lý SmartShop AI. Vui lòng kiểm tra phiên đăng nhập và thử lại.',
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-3xl h-[85vh] max-h-[750px] bg-[#14151b] border border-[#2d2f3d] rounded-[28px] shadow-2xl flex flex-col overflow-hidden relative">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-24 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#242633] flex items-center justify-between relative z-10 bg-[#161720]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500/30 via-purple-500/20 to-indigo-500/10 border border-pink-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.3)]">
              <Sparkles className="w-4 h-4 text-pink-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Helios AI Investment Strategist
                <span className="px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 text-[10px] font-semibold">
                  Institutional AI
                </span>
              </h2>
              <p className="text-[11px] text-[#8e92a4]">
                Data-driven financial insights & portfolio rebalancing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#20222d] border border-[#2c2f3e] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-6 py-2.5 bg-[#121319] border-b border-[#20222c] overflow-x-auto scrollbar-none flex items-center gap-2">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp.query)}
              disabled={isLoading}
              className="px-3 py-1 rounded-full bg-[#1c1d26] hover:bg-[#262836] border border-[#2b2d3d] text-[11px] font-medium text-slate-300 hover:text-white whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0"
            >
              <span>{qp.label}</span>
            </button>
          ))}
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-[#292b3a]">
          {messages.map((msg) => {
            const isAi = msg.role === 'ai';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}
              >
                {isAi && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500/30 to-purple-600/30 border border-pink-500/30 flex items-center justify-center flex-shrink-0 text-pink-300 text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-4 text-xs sm:text-[13px] leading-relaxed ${
                    isAi
                      ? 'bg-[#1a1b24] border border-[#292c3a] text-slate-200 shadow-md'
                      : 'bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium shadow-[0_0_15px_rgba(236,72,153,0.25)]'
                  }`}
                >
                  {isAi ? (
                    <div className="prose prose-invert max-w-none text-xs sm:text-[13px] space-y-2">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  ) : (
                    <p>{msg.text}</p>
                  )}
                  <span
                    className={`block text-[10px] mt-2 ${
                      isAi ? 'text-slate-500' : 'text-pink-100/70'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {!isAi && (
                  <div className="w-8 h-8 rounded-full bg-[#20222c] border border-[#2e3142] flex items-center justify-center flex-shrink-0 text-slate-300">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center flex-shrink-0 text-pink-300 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="bg-[#1a1b24] border border-[#292c3a] rounded-2xl p-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
                <span className="text-xs text-slate-400">
                  Synthesizing real-time portfolio metrics & catalysts...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#161720] border-t border-[#242633] relative z-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-[#1b1c26] border border-[#2d3040] rounded-2xl p-1.5 focus-within:border-pink-500/60 focus-within:ring-1 focus-within:ring-pink-500/30 transition-all"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask anything about stocks, risk hedging, or earnings..."
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isLoading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <span>Analyze</span>
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
