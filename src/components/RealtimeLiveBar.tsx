import React, { useState, useEffect } from 'react';
import {
  Radio,
  Clock,
  Sparkles,
  Zap,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Database,
} from 'lucide-react';
import { RealtimeActivity } from '../types';
import { soundManager } from '../utils/audioChime';
import { formatCurrency } from '../utils/formatters';
import { useLanguage } from '../utils/i18n';

interface RealtimeLiveBarProps {
  isAutoStreamActive: boolean;
  onToggleAutoStream: () => void;
  streamIntervalSeconds: number;
  onChangeInterval: (seconds: number) => void;
  onTriggerInstantOrder: () => void;
  latestActivity: RealtimeActivity | null;
  totalRealtimeOrdersToday: number;
  totalRealtimeRevenueToday: number;
  onOpenRealDataManager?: () => void;
  isDark?: boolean;
  dataMode?: 'demo' | 'real';
  onToggleDataMode?: (mode: 'demo' | 'real') => void;
}

export const RealtimeLiveBar: React.FC<RealtimeLiveBarProps> = ({
  isAutoStreamActive,
  onToggleAutoStream,
  streamIntervalSeconds,
  onChangeInterval,
  onTriggerInstantOrder,
  latestActivity,
  totalRealtimeOrdersToday,
  totalRealtimeRevenueToday,
  onOpenRealDataManager,
  isDark,
  dataMode = 'demo',
  onToggleDataMode,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getIsMuted());
  const [hasPulse, setHasPulse] = useState<boolean>(false);

  // Live real-time clock ticker every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Flash pulse when new activity arrives
  useEffect(() => {
    if (latestActivity) {
      setHasPulse(true);
      const t = setTimeout(() => setHasPulse(false), 2500);
      return () => clearTimeout(t);
    }
  }, [latestActivity]);

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setMuted(nextMuted);
    if (!nextMuted) {
      soundManager.playCashRegisterChime();
    }
  };

  const formatDate = (d: Date) => {
    if (language === 'en') {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[d.getDay()];
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${dayName}, ${day}/${month}/${year}`;
  };

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div
      id="realtime-live-bar"
      className={`rounded-2xl border p-3.5 sm:p-4 transition-all duration-300 ${
        isDark
          ? hasPulse
            ? 'bg-slate-900 border-blue-500/80 shadow-lg shadow-blue-500/10'
            : 'bg-slate-900/90 border-slate-800'
          : hasPulse
          ? 'bg-blue-50/70 border-blue-400 shadow-md shadow-blue-500/10'
          : 'bg-white border-slate-200 shadow-xs'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Left Side: Real-time status, Live Clock & Date */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Live Pulsing Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
              dataMode === 'real'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-xs'
                : isAutoStreamActive
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {(dataMode === 'real' || isAutoStreamActive) && (
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    dataMode === 'real' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  dataMode === 'real'
                    ? 'bg-emerald-500'
                    : isAutoStreamActive
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />
            </span>
            <span className="tracking-wide text-[11px] sm:text-xs">
              {dataMode === 'real'
                ? language === 'vi'
                  ? '🟢 DỮ LIỆU THẬT (REAL)'
                  : '🟢 REAL DATA MODE'
                : isAutoStreamActive
                ? language === 'vi'
                  ? '🧪 DỮ LIỆU DEMO (MẪU)'
                  : '🧪 DEMO SAMPLE MODE'
                : language === 'vi'
                ? 'TẠM DỪNG STREAM'
                : 'STREAM PAUSED'}
            </span>
          </div>

          {/* Quick Mode Toggle Pill (Demo vs Real) */}
          {onToggleDataMode && (
            <div
              id="livebar-data-mode-toggle"
              className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs shadow-xs"
              title={language === 'vi' ? 'Chuyển đổi giữa Dữ liệu mẫu (Demo) và Dữ liệu thật' : 'Switch between Demo and Real Data'}
            >
              <button
                type="button"
                onClick={() => onToggleDataMode('demo')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dataMode === 'demo'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>🧪 Demo</span>
              </button>
              <button
                type="button"
                id="btn-livebar-activate-real"
                onClick={() => onToggleDataMode('real')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dataMode === 'real'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 font-black'
                }`}
              >
                <span>🟢 Thật</span>
              </button>
            </div>
          )}

          {/* Real-time Clock */}
          <div
            id="realtime-clock-display"
            className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold font-mono tracking-wider border border-slate-200/60 dark:border-slate-700"
          >
            <Clock className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            <span>{formatTime(currentTime)}</span>
            <span className="text-slate-400 dark:text-slate-500 font-sans font-normal">|</span>
            <span className="font-sans font-medium text-slate-600 dark:text-slate-300 text-[11px] sm:text-xs">
              {formatDate(currentTime)}
            </span>
          </div>

          {/* Language Switcher pill next to realtime clock on the live bar */}
          <div
            id="livebar-language-switch"
            className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs"
            title={t.switchLang}
          >
            <button
              onClick={() => setLanguage('vi')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                language === 'vi'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>🇻🇳</span>
              <span className="text-[11px]">VI</span>
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                language === 'en'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>🇬🇧</span>
              <span className="text-[11px]">EN</span>
            </button>
          </div>

          {/* Quick Metrics capsule */}
          <div className="hidden xl:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 pl-1">
            <span>{language === 'vi' ? 'Hôm nay:' : 'Today:'}</span>
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
              {totalRealtimeOrdersToday} {language === 'vi' ? 'đơn' : 'orders'}
            </span>
            <span>•</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {formatCurrency(totalRealtimeRevenueToday)}
            </span>
          </div>
        </div>

        {/* Right Side: Simulation & Stream Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 justify-end">
          {dataMode === 'demo' ? (
            <>
              {/* Interval Select */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 px-1.5 hidden sm:inline">
                  {language === 'vi' ? 'Tần suất:' : 'Interval:'}
                </span>
                {[10, 20, 45].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => onChangeInterval(sec)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-colors ${
                      streamIntervalSeconds === sec
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>

              {/* Toggle Stream Button */}
              <button
                id="btn-toggle-realtime-stream"
                onClick={onToggleAutoStream}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                  isAutoStreamActive
                    ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                }`}
                title={isAutoStreamActive ? t.liveStreamPaused : t.liveStreamActive}
              >
                {isAutoStreamActive ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden xs:inline">{language === 'vi' ? 'Tạm dừng' : 'Pause'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Bật Stream' : 'Resume'}</span>
                  </>
                )}
              </button>

              {/* Explicit Turn On Real Data Button */}
              <button
                id="btn-open-real-data-manager"
                onClick={() => {
                  if (onToggleDataMode) {
                    onToggleDataMode('real');
                  } else if (onOpenRealDataManager) {
                    onOpenRealDataManager();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
                title={language === 'vi' ? 'Bật chế độ dữ liệu thật của cửa hàng (tắt mô phỏng)' : 'Activate Real Store Data Mode'}
              >
                <Database className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Bật Dữ liệu Thật' : 'Turn on Real Data'}</span>
              </button>

              {/* Trigger Instant Order Button */}
              <button
                id="btn-trigger-instant-order"
                onClick={onTriggerInstantOrder}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:from-blue-800 text-white text-xs font-bold shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
                title={language === 'vi' ? 'Mô phỏng phát sinh ngay 1 đơn hàng mới từ sàn TMĐT/POS' : 'Simulate an incoming live order from E-Commerce/POS'}
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-bounce" />
                <span>{t.triggerInstantOrder}</span>
              </button>
            </>
          ) : (
            <>
              {/* In Real Mode: Clear Status & POS indicator */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{language === 'vi' ? 'Lắng nghe hóa đơn POS thực tế' : 'Recording real POS orders'}</span>
              </div>

              {/* Real Store Data Manager Button */}
              {onOpenRealDataManager && (
                <button
                  id="btn-open-real-data-manager"
                  onClick={onOpenRealDataManager}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shadow-xs cursor-pointer"
                  title={language === 'vi' ? 'Quản lý kho hàng & đơn hàng thực tế' : 'Manage Real Store Data'}
                >
                  <Database className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{language === 'vi' ? 'Quản lý Dữ liệu Thật' : 'Manage Real Data'}</span>
                </button>
              )}
            </>
          )}

          {/* Mute/Unmute Audio Chime */}
          <button
            id="btn-toggle-sound-chime"
            onClick={toggleSound}
            className={`p-1.5 rounded-xl border transition-colors ${
              isDark
                ? 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title={isMuted ? t.unmuteSound : t.muteSound}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-slate-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-blue-500" />
            )}
          </button>
        </div>
      </div>

      {/* Latest Live Ticker Alert */}
      {latestActivity && (
        <div
          className={`mt-2.5 pt-2.5 border-t flex items-center justify-between gap-2 text-xs transition-all ${
            isDark ? 'border-slate-800/80 text-slate-300' : 'border-slate-100 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
            <span className="flex-shrink-0 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px] border border-blue-500/20">
              {latestActivity.channel || (language === 'vi' ? 'Thời gian thực' : 'Real-time')}
            </span>
            <p className="truncate font-medium">
              <span className="font-bold text-slate-900 dark:text-white">{latestActivity.title}: </span>
              {latestActivity.description}
            </p>
          </div>
          <span className="text-[11px] text-slate-400 flex-shrink-0 font-mono">
            {latestActivity.timestamp}
          </span>
        </div>
      )}
    </div>
  );
};
