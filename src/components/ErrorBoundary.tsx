import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, LogOut, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SmartSale AI ErrorBoundary caught an exception]:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleLogoutToLogin = () => {
    try {
      localStorage.removeItem('smartsale_session_token');
      localStorage.removeItem('smartsale_auth_user');
      sessionStorage.clear();
    } catch (_) {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

      return (
        <div className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-6 transition-colors ${
          isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
        }`}>
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 sm:p-8 space-y-6 text-center backdrop-blur-md relative z-10 ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Warning Icon Badge */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 shadow-lg shadow-amber-500/20 mb-1">
              <ShieldAlert className="w-8 h-8 animate-bounce" />
            </div>

            {/* Error Headlines */}
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {this.props.fallbackTitle || 'Hệ thống bảo vệ giao diện SmartSale AI'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                {this.props.fallbackMessage ||
                  'Đã xảy ra sự cố hiển thị tạm thời trên thiết bị này. Cơ chế tự phục hồi đã bảo toàn toàn bộ dữ liệu và phiên làm việc của bạn.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Khôi phục & Thử lại</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Tải lại trang (F5)</span>
              </button>

              <button
                type="button"
                onClick={this.handleLogoutToLogin}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-xs border border-rose-200 dark:border-rose-900/40 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Màn hình Đăng nhập</span>
              </button>
            </div>

            {/* Collapsible Error Details for Troubleshooting */}
            {this.state.error && (
              <div className="pt-2 text-left">
                <button
                  type="button"
                  onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <span>Chi tiết kỹ thuật (Dành cho nhà phát triển)</span>
                  {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {this.state.showDetails && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-[10px] overflow-auto max-h-48 border border-slate-800 leading-relaxed shadow-inner">
                    <p className="text-rose-400 font-bold mb-1">{this.state.error.name}: {this.state.error.message}</p>
                    {this.state.error.stack && (
                      <pre className="whitespace-pre-wrap opacity-75">{this.state.error.stack}</pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
