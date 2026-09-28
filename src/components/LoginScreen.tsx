import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Bot,
  Store,
  Sparkles,
  Lock,
  ArrowLeft,
  Moon,
  Sun,
  UserCheck,
  Scan,
} from 'lucide-react';
import { StaffUser } from '../types';
import { INITIAL_STAFF, TESTER_STAFF_USER } from '../data/initialData';
import { FaceAuthModal } from './FaceAuthModal';
import { ErrorBoundary } from './ErrorBoundary';

interface LoginScreenProps {
  onLoginSuccess: (user: StaffUser) => void;
  staffList?: StaffUser[];
  isDark?: boolean;
  onToggleDarkMode?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  staffList = INITIAL_STAFF,
  isDark = false,
  onToggleDarkMode,
}) => {
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState<string>('nguyentatphi136@gmail.com');
  const [otpCode, setOtpCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState<number>(0);
  const [activeStaffList, setActiveStaffList] = useState<StaffUser[]>(staffList);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Trạng thái xác thực khuôn mặt (chỉ dành cho Chủ cửa hàng và Quản lý)
  const [isFaceModalOpen, setIsFaceModalOpen] = useState<boolean>(false);
  const [pendingFaceUser, setPendingFaceUser] = useState<StaffUser | null>(null);
  const [tempToken, setTempToken] = useState<string>('');

  useEffect(() => {
    setActiveStaffList(staffList);
  }, [staffList]);

  useEffect(() => {
    fetch('/api/auth/staff-candidates')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.staffList) && data.staffList.length > 0) {
          const list: StaffUser[] = data.staffList;
          if (!list.some((s) => s.id === 'user-tester' || s.email.toLowerCase() === 'tester@smartsale.ai')) {
            setActiveStaffList([TESTER_STAFF_USER, ...list]);
          } else {
            setActiveStaffList(list);
          }
        }
      })
      .catch(() => {});
  }, []);

  const otpInputRef = useRef<HTMLInputElement | null>(null);

  // Countdown timer for resend
  useEffect(() => {
    let timer: any = null;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCountdown]);

  // Focus OTP input when entering verify step
  useEffect(() => {
    if (step === 'verify') {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 250);
    }
  }, [step]);

  // Quick 1-Click Tester Login (Bypasses OTP and Face ID completely)
  const handleTesterQuickLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg('Đang đăng nhập nhanh tài khoản Tester...');

    try {
      const res = await fetch('/api/auth/quick-tester-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.user) {
        throw new Error(data.error || 'Không thể đăng nhập tài khoản Tester.');
      }

      const authenticatedUser: StaffUser = data.user;
      try {
        localStorage.setItem('smartsale_auth_user', JSON.stringify(authenticatedUser));
        if (data.sessionToken) {
          localStorage.setItem('smartsale_session_token', data.sessionToken);
        }
      } catch (e) {}

      onLoginSuccess(authenticatedUser);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể kết nối máy chủ.');
      setSuccessMsg(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Send verification code to email
  const handleSendVerificationCode = async (targetEmail?: string) => {
    const cleanEmail = (targetEmail || email).trim().toLowerCase();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Tự động chuyển hướng đăng nhập nhanh cho tài khoản tester
    if (cleanEmail === 'tester@smartsale.ai') {
      await handleTesterQuickLogin();
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ (ví dụ: nguyentatphi136@gmail.com)');
      return;
    }

    setIsLoading(true);

    try {
      // Call backend auth API
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể gửi mã xác thực.');
      }
      setEmail(cleanEmail);
      setStep('verify');
      setResendCountdown(60);
      setSuccessMsg(`Mã xác thực bảo mật gồm 6 chữ số đã được gửi tới ${cleanEmail}`);
      if (data.devCode) {
        setDevOtpHint(data.devCode);
      } else {
        setDevOtpHint(null);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể kết nối máy chủ xác thực.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify code & Login
  const handleVerifyAndLogin = async (codeToVerify?: string) => {
    const code = (codeToVerify || otpCode).trim();
    setErrorMsg(null);

    if (!code || code.length < 6) {
      setErrorMsg('Vui lòng nhập đầy đủ mã xác thực 6 chữ số');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Check backend verification
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.user) {
        throw new Error(data.error || 'Mã xác thực không chính xác hoặc đã hết hạn.');
      }

      // NẾU TÀI KHOẢN YÊU CẦU XÁC THỰC KHUÔN MẶT (CHỦ CỬA HÀNG HOẶC QUẢN LÝ):
      if (data.requireFace && data.tempToken) {
        setPendingFaceUser(data.user);
        setTempToken(data.tempToken);
        setIsFaceModalOpen(true);
        setSuccessMsg(data.message || 'Mã OTP chính xác. Vui lòng quét khuôn mặt để hoàn tất.');
        return;
      }

      // THU NGÂN VÀ THỦ KHO: Đăng nhập thành công ngay lập tức
      const authenticatedUser: StaffUser = data.user;

      // Save user session
      try {
        localStorage.setItem('smartsale_auth_user', JSON.stringify(authenticatedUser));
        if (data.sessionToken) {
          localStorage.setItem('smartsale_session_token', data.sessionToken);
        }
      } catch (e) {}

      onLoginSuccess(authenticatedUser);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể xác thực tài khoản.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceSuccess = (authenticatedUser: StaffUser, sessionToken: string) => {
    setIsFaceModalOpen(false);
    try {
      localStorage.setItem('smartsale_auth_user', JSON.stringify(authenticatedUser));
      localStorage.setItem('smartsale_session_token', sessionToken);
    } catch (e) {}
    onLoginSuccess(authenticatedUser);
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 transition-colors relative ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      {/* Dark mode toggle top right */}
      {onToggleDarkMode && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={onToggleDarkMode}
            className={`p-2.5 rounded-xl border transition-all ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Chuyển đổi giao diện sáng/tối"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      )}

      {/* Main Login Card */}
      <div
        className={`w-full max-w-md rounded-2xl border shadow-xl backdrop-blur-md relative z-10 overflow-hidden transition-all ${
          isDark
            ? 'bg-slate-900/95 border-slate-800'
            : 'bg-white border-slate-200'
        }`}
      >
        {/* Card Header */}
        <div className="p-6 sm:p-8 text-center border-b border-slate-100 dark:border-slate-800/80">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white shadow-lg shadow-blue-500/30 mb-4">
            <Bot className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            SmartSale AI
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Hệ thống Quản lý Bán hàng & Phân tích Doanh thu Trí tuệ Nhân tạo
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Đăng nhập bảo mật bằng Email & Xác thực OTP</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8">
          {/* Quick Tester Login Box */}
          <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 dark:border-emerald-500/40 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Tài khoản Tester (Kiểm thử)
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                ⚡ Không OTP & Face ID
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              Trải nghiệm ngay toàn bộ tính năng quản trị, bán hàng POS và chuyển đổi vai trò không cần chờ OTP hay quét camera.
            </p>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleTesterQuickLogin}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>⚡ Đăng nhập Tester ngay (1-Click)</span>
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: ENTER EMAIL */}
          {step === 'email' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendVerificationCode();
              }}
              className="space-y-5"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Địa chỉ Email đăng nhập
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nhapemail@cuahang.com"
                    className={`w-full pl-11 pr-4 py-3 text-sm rounded-xl border outline-none transition-all ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Hệ thống sẽ gửi mã xác thực 6 số đến email này để bảo mật</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang gửi mã xác thực...</span>
                  </>
                ) : (
                  <>
                    <span>Gửi mã xác thực</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick Select Preset Staff Accounts */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5">
                  Tài khoản nhân sự có sẵn:
                </p>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {activeStaffList.map((staff) => {
                    const isTester = staff.id === 'user-tester' || staff.email === 'tester@smartsale.ai';
                    return (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => {
                          if (isTester) {
                            handleTesterQuickLogin();
                          } else {
                            setEmail(staff.email);
                            handleSendVerificationCode(staff.email);
                          }
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                          isTester
                            ? 'border-emerald-400/60 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40'
                            : email === staff.email
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isTester
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {isTester ? '⚡' : staff.name.charAt(0)}
                          </div>
                          <div>
                            <p className={`font-semibold ${isTester ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-900 dark:text-slate-100'}`}>
                              {staff.name}
                            </p>
                            <p className={`text-[11px] ${isTester ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>
                              {staff.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isTester ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                              Bỏ qua OTP & Face ID
                            </span>
                          ) : (
                            <>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {staff.role === 'admin'
                                  ? 'Chủ cửa hàng'
                                  : staff.role === 'manager'
                                  ? 'Quản lý'
                                  : staff.role === 'inventory_staff'
                                  ? 'Thủ kho'
                                  : 'Thu ngân'}
                              </span>
                              {(staff.role === 'admin' || staff.role === 'manager') && (
                                <span
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                  title="Yêu cầu quét khuôn mặt Face ID sau khi nhập OTP"
                                >
                                  <Scan className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />
                                  Face ID
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>
          )}

          {/* STEP 2: VERIFICATION OTP CODE */}
          {step === 'verify' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Target Email Notice */}
              <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Email xác thực:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Đổi email</span>
                  </button>
                </div>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5 text-sm">{email}</p>
              </div>

              {/* Dev Environment OTP Shortcut & Spam Folder Notice */}
              {devOtpHint && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="font-semibold flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Môi trường Thử nghiệm (Dev):
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                      Mã OTP của bạn: <strong className="font-mono text-sm tracking-widest text-amber-950 dark:text-amber-100">{devOtpHint}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpCode(devOtpHint);
                      handleVerifyAndLogin(devOtpHint);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] whitespace-nowrap shadow-xs cursor-pointer transition-all active:scale-95"
                  >
                    Điền nhanh & Đăng nhập
                  </button>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  <span>Đã gửi mã qua hòm thư điện tử</span>
                </p>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Nếu không thấy trong <strong>Hộp thư đến</strong>, vui lòng kiểm tra thư mục <strong>Thư rác (Spam / Junk)</strong> hoặc tab <strong>Quảng cáo / Cập nhật</strong> của email.
                </p>
              </div>

              {/* Code Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerifyAndLogin();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Nhập mã xác thực 6 chữ số
                  </label>
                  <div className="relative">
                    <KeyRound className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      ref={otpInputRef}
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className={`w-full pl-11 pr-4 py-3 text-lg font-mono tracking-widest text-center rounded-xl border outline-none font-bold transition-all ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length < 6}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang xác thực thông tin...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Xác thực & Đăng nhập</span>
                    </>
                  )}
                </button>

                {/* Resend button */}
                <div className="text-center pt-2">
                  {resendCountdown > 0 ? (
                    <span className="text-xs text-slate-400">
                      Gửi lại mã xác thực sau <strong className="text-slate-600 dark:text-slate-300">{resendCountdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendVerificationCode()}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Gửi lại mã xác thực mới</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>SmartSale AI POS Security</span>
          <span>Phiên bản v2.5 Enterprise</span>
        </div>
      </div>

      {/* Modal Quét Khuôn mặt Face ID */}
      <ErrorBoundary
        fallbackTitle="Lỗi kích hoạt Camera Face ID"
        fallbackMessage="Trình duyệt hoặc phần cứng camera trên thiết bị này không phản hồi. Bạn có thể thử lại hoặc làm mới trang."
        onReset={() => {
          setIsFaceModalOpen(false);
          setPendingFaceUser(null);
          setTempToken('');
        }}
      >
        <FaceAuthModal
          isOpen={isFaceModalOpen}
          user={pendingFaceUser}
          tempToken={tempToken}
          onSuccess={handleFaceSuccess}
          onCancel={() => {
            setIsFaceModalOpen(false);
            setPendingFaceUser(null);
            setTempToken('');
          }}
          isDark={isDark}
        />
      </ErrorBoundary>
    </div>
  );
};
