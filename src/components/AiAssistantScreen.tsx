import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Plus,
  MessageSquare,
  Bot,
  Send,
  Paperclip,
  Sparkles,
  Check,
  ShoppingCart,
  Loader2,
  TrendingUp,
  Image as ImageIcon,
  Copy,
  Mic,
  MicOff,
  Package,
  AlertTriangle,
  Tag,
  Zap,
} from 'lucide-react';
import { ChatSession, ChatMessage, Product } from '../types';
import { useLanguage } from '../utils/i18n';

interface AiModelStatus {
  primaryModel: string;
  activeModel: string | null;
  models: { model: string; available: boolean; reason: string | null; retryAt: string | null }[];
}

// "gemini-3.6-flash" -> "Gemini 3.6 Flash"
const formatModelName = (model: string) =>
  model
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

interface AiAssistantScreenProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onSendMessage: (text: string, imageAttachment?: string) => Promise<void>;
  onAddToCartFromAI: (productName: string, price: number) => void;
  isDark?: boolean;
}

export const AiAssistantScreen: React.FC<AiAssistantScreenProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onSendMessage,
  onAddToCartFromAI,
  isDark,
}) => {
  const { language, t, formatCurr } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [addedSuccessId, setAddedSuccessId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'history'>('chat');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Cập nhật model Gemini đang dùng sau mỗi lượt trả lời (server tự chuyển model khi hết lượt)
  const [aiStatus, setAiStatus] = useState<AiModelStatus | null>(null);
  const messageCount = activeSession?.messages.length || 0;
  useEffect(() => {
    fetch('/api/ai/status', {
      headers: { Authorization: `Bearer ${localStorage.getItem('smartsale_session_token') || ''}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setAiStatus(data))
      .catch(() => {});
  }, [messageCount]);

  const currentModel = aiStatus?.activeModel || null;
  const isOffline = !!aiStatus && !currentModel;
  const isUsingFallback = !!currentModel && currentModel !== aiStatus?.primaryModel;
  const primaryStatus = aiStatus?.models.find((m) => m.model === aiStatus.primaryModel);
  const primaryRetryTime = primaryStatus?.retryAt
    ? new Date(primaryStatus.retryAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : null;
  const modelLabel = currentModel
    ? formatModelName(currentModel)
    : isOffline
    ? language === 'vi' ? 'Chế độ cơ bản' : 'Basic mode'
    : 'Gemini AI';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isLoading]);

  // Voice recognition support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'vi' ? 'vi-VN' : 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert(
        language === 'vi'
          ? 'Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói Web Speech API.'
          : 'Your browser does not support the Web Speech API.'
      );
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : inputText;
    if (!text.trim() && !selectedImage) return;

    setInputText('');
    const imagePayload = selectedImage || undefined;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      await onSendMessage(text, imagePayload);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const quickPrompts = language === 'vi' ? [
    { label: '📊 Doanh thu hôm nay', text: 'Doanh thu hôm nay thế nào?' },
    { label: '🏆 Top sản phẩm bán chạy', text: 'Tháng này sản phẩm nào bán chạy nhất?' },
    { label: '⚠️ Cảnh báo hết hàng', text: 'Sản phẩm nào đang sắp hết hàng cần nhập gấp?' },
    { label: '🎁 Gợi ý khuyến mãi cuối tuần', text: 'Gợi ý tạo chiến dịch khuyến mãi cuối tuần' },
    { label: '📱 Tồn kho iPhone & Apple', text: 'Kiểm tra tồn kho các sản phẩm Apple iPhone' },
    { label: '👥 Khách hàng VVIP', text: 'Phân tích tệp khách hàng VIP và VVIP' },
  ] : [
    { label: '📊 Today\'s Revenue', text: 'How is today\'s revenue?' },
    { label: '🏆 Best Selling Products', text: 'What are the top-selling products this month?' },
    { label: '⚠️ Low Stock Alert', text: 'Which products are running out of stock?' },
    { label: '🎁 Weekend Promotions', text: 'Suggest weekend promotional campaigns' },
    { label: '📱 iPhone Stock Check', text: 'Check current inventory for Apple iPhone models' },
    { label: '👥 VIP Customer Analytics', text: 'Analyze VIP and VVIP customer segments' },
  ];

  const todaySessions = sessions.filter((s) => s.timeCategory === 'today');
  const yesterdaySessions = sessions.filter((s) => s.timeCategory === 'yesterday');
  const pastSessions = sessions.filter((s) => s.timeCategory === 'week_ago');

  return (
    <div id="ai-assistant-screen" className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8.5rem)] lg:h-[calc(100vh-6.5rem)] pb-14 lg:pb-2">
      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden items-center justify-between gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            mobileTab === 'chat'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          💬 {language === 'vi' ? 'Trò chuyện AI' : 'AI Chat'}
        </button>
        <button
          onClick={() => setMobileTab('history')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            mobileTab === 'history'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          📜 {language === 'vi' ? 'Lịch sử' : 'History'} ({sessions.length})
        </button>
      </div>

      {/* Left Chat History Sub-sidebar */}
      <div
        id="ai-sessions-sidebar"
        className={`w-full lg:w-72 flex-col justify-between rounded-2xl border p-3.5 flex-shrink-0 transition-all ${
          mobileTab === 'chat' ? 'hidden lg:flex' : 'flex'
        } ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div>
          {/* New Chat Button */}
          <button
            id="btn-new-chat"
            onClick={() => {
              onNewSession();
              setMobileTab('chat');
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newChat}</span>
          </button>

          {/* Session categories */}
          <div className="mt-4 space-y-4 overflow-y-auto max-h-[calc(100vh-16rem)] pr-1 scrollbar-thin">
            {/* Today */}
            {todaySessions.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                  {t.today}
                </p>
                <div className="space-y-1">
                  {todaySessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        onSelectSession(session.id);
                        setMobileTab('chat');
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium truncate flex items-center gap-2 transition-all ${
                        activeSessionId === session.id
                          ? isDark
                            ? 'bg-slate-800 text-blue-400 font-semibold'
                            : 'bg-blue-50 text-blue-600 font-semibold'
                          : isDark
                          ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                      <span className="truncate">{session.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Yesterday */}
            {yesterdaySessions.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                  {t.yesterday}
                </p>
                <div className="space-y-1">
                  {yesterdaySessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        onSelectSession(session.id);
                        setMobileTab('chat');
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium truncate flex items-center gap-2 transition-all ${
                        activeSessionId === session.id
                          ? isDark
                            ? 'bg-slate-800 text-blue-400 font-semibold'
                            : 'bg-blue-50 text-blue-600 font-semibold'
                          : isDark
                          ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                      <span className="truncate">{session.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 7 Days Ago */}
            {pastSessions.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                  {t.pastWeek}
                </p>
                <div className="space-y-1">
                  {pastSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        onSelectSession(session.id);
                        setMobileTab('chat');
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium truncate flex items-center gap-2 transition-all ${
                        activeSessionId === session.id
                          ? isDark
                            ? 'bg-slate-800 text-blue-400 font-semibold'
                            : 'bg-blue-50 text-blue-600 font-semibold'
                          : isDark
                          ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                      <span className="truncate">{session.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI status indicator */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 px-1 text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  isOffline ? 'bg-rose-500' : isUsingFallback ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'
                }`}
              />
              <span className="font-medium text-slate-600 dark:text-slate-300 truncate">{modelLabel}</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${
                isOffline
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  : isUsingFallback
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {isOffline ? 'Offline' : isUsingFallback ? (language === 'vi' ? 'Dự phòng' : 'Fallback') : 'Online'}
            </span>
          </div>
          {aiStatus && primaryStatus && !primaryStatus.available && (
            <p className="text-[10px] leading-snug text-amber-600 dark:text-amber-400">
              {formatModelName(aiStatus.primaryModel)}: {primaryStatus.reason}
              {primaryRetryTime ? ` (dùng lại lúc ${primaryRetryTime})` : ''}.{' '}
              {currentModel
                ? `Đã tự chuyển sang ${formatModelName(currentModel)}.`
                : 'Tất cả model đều tạm hết lượt, AI trả lời ở chế độ cơ bản.'}
            </p>
          )}
        </div>
      </div>

      {/* Main Chat Conversation Area */}
      <div
        id="ai-chat-main-window"
        className={`flex-1 flex flex-col justify-between rounded-2xl border transition-all overflow-hidden ${
          mobileTab === 'history' ? 'hidden lg:flex' : 'flex'
        } ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        {/* Chat Top Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>SmartSale AI</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  v3.7
                </span>
              </h2>
              <p className="text-xs text-slate-400">{t.aiSubtitle}</p>
            </div>
          </div>

          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg max-w-[200px] truncate">
            {activeSession ? activeSession.title : t.newChat}
          </div>
        </div>

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeSession?.messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-2xl space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Bubble */}
                  <div
                    className={`relative group p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                        : isDark
                        ? 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-tl-none shadow-sm'
                        : 'bg-slate-50/90 text-slate-800 border border-slate-200/90 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {/* Render message with React Markdown */}
                    <div className="prose prose-sm dark:prose-invert max-w-none space-y-2 font-normal">
                      <Markdown>{msg.text}</Markdown>
                    </div>

                    {/* Copy action for AI messages */}
                    {!isUser && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="p-1 rounded-lg bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                          title={language === 'vi' ? 'Sao chép câu trả lời' : 'Copy response'}
                        >
                          {copiedMsgId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Highlighted Product Card inside message */}
                  {msg.productCard && (
                    <div
                      className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 ${
                        isDark
                          ? 'bg-slate-800/80 border-slate-700'
                          : 'bg-white border-blue-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={msg.productCard.image}
                          alt={msg.productCard.name}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-white">
                            {msg.productCard.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {t.price}:{' '}
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {formatCurr(msg.productCard.price)}
                            </span>
                          </p>
                          <p
                            className={`text-[11px] font-medium mt-0.5 ${
                              msg.productCard.stock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                            }`}
                          >
                            {msg.productCard.stock > 0
                              ? `${language === 'vi' ? 'Tồn kho' : 'In Stock'}: ${msg.productCard.stock}`
                              : (language === 'vi' ? '🔴 Tạm hết hàng trong kho' : '🔴 Out of stock')}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onAddToCartFromAI(msg.productCard!.name, msg.productCard!.price);
                          setAddedSuccessId(msg.id);
                          setTimeout(() => setAddedSuccessId(null), 2000);
                        }}
                        className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center justify-center gap-1.5 transition-all ${
                          addedSuccessId === msg.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 active:scale-95'
                        }`}
                      >
                        {addedSuccessId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{language === 'vi' ? 'ĐÃ THÊM' : 'ADDED'}</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>{language === 'vi' ? 'NHẬP VÀO GIỎ' : 'ADD TO CART'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 block px-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3 animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div
                className={`p-3.5 rounded-2xl rounded-tl-none border text-xs flex items-center gap-2.5 ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="font-medium">{t.aiThinking}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto border-t border-slate-100 dark:border-slate-800 scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 flex-shrink-0">
            <Sparkles className="w-3 h-3 text-amber-500" />
            {t.quickSuggestions}:
          </span>
          {quickPrompts.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPrompt(item.text)}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all active:scale-95 flex-shrink-0 ${
                isDark
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600'
                  : 'border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Bottom Input Field Box */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800">
          {/* Image attachment preview if any */}
          {selectedImage && (
            <div className="mb-2.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <img
                  src={selectedImage}
                  alt="Attachment"
                  className="w-11 h-11 rounded-lg object-cover border border-slate-300 dark:border-slate-600"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    {language === 'vi' ? 'Ảnh đính kèm đã sẵn sàng' : 'Attachment ready'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {language === 'vi' ? 'AI sẽ nhận diện hình ảnh, mã vạch hoặc hóa đơn' : 'AI will analyze image, barcode, or receipt'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-xs font-medium text-rose-500 hover:underline px-3 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                {language === 'vi' ? 'Xóa ảnh' : 'Remove'}
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              id="btn-ai-attachment"
              onClick={() => fileInputRef.current?.click()}
              className={`p-2.5 rounded-xl border transition-colors ${
                isDark
                  ? 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
              title={language === 'vi' ? 'Đính kèm ảnh sản phẩm hoặc hóa đơn' : 'Attach product image or invoice'}
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Voice Mic Button */}
            <button
              onClick={toggleVoiceRecording}
              className={`p-2.5 rounded-xl border transition-all ${
                isRecording
                  ? 'bg-rose-500 border-rose-600 text-white animate-pulse'
                  : isDark
                  ? 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
              title={isRecording ? (language === 'vi' ? 'Đang nghe... Bấm để dừng' : 'Listening... Click to stop') : (language === 'vi' ? 'Nhập bằng giọng nói' : 'Voice typing')}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Text Input */}
            <input
              id="ai-message-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isRecording ? (language === 'vi' ? 'Đang lắng nghe giọng nói của bạn...' : 'Listening to your voice...') : t.aiInputPlaceholder}
              className={`flex-1 px-4 py-2.5 text-sm rounded-xl border outline-none transition-all ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              }`}
            />

            {/* Send Button */}
            <button
              id="btn-ai-send"
              onClick={() => handleSend()}
              disabled={isLoading || (!inputText.trim() && !selectedImage)}
              className={`p-2.5 rounded-xl text-white transition-all ${
                isLoading || (!inputText.trim() && !selectedImage)
                  ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-sm shadow-blue-500/20'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[10px] text-center text-slate-400 mt-2">
            SmartSale AI • {modelLabel}
          </p>
        </div>
      </div>
    </div>
  );
};
