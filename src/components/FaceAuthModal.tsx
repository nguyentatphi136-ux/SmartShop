import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Scan,
  UserCheck,
  Sparkles,
  Lock,
  Eye,
  User,
} from 'lucide-react';
import { StaffUser } from '../types';

interface FaceAuthModalProps {
  isOpen: boolean;
  user: StaffUser | null;
  tempToken: string;
  onSuccess: (authenticatedUser: StaffUser, sessionToken: string) => void;
  onCancel: () => void;
  isDark?: boolean;
}

interface TrackInfo {
  hasFace: boolean;
  name?: string;
  role?: string;
  similarityPercent?: number;
  cosineSimilarity?: number;
  isTarget?: boolean;
  isKnown?: boolean;
  box?: [number, number, number, number];
  landmarks?: number[][];
  imgWidth?: number;
  imgHeight?: number;
}

export const FaceAuthModal: React.FC<FaceAuthModalProps> = ({
  isOpen,
  user,
  tempToken,
  onSuccess,
  onCancel,
  isDark = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [liveTrack, setLiveTrack] = useState<TrackInfo | null>(null);
  const [autoMatchCount, setAutoMatchCount] = useState<number>(0);
  const [scanResult, setScanResult] = useState<{
    matched?: boolean;
    message?: string;
    similarityPercent?: number;
    cosineSimilarity?: number;
    euclideanDistance?: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isTrackingActiveRef = useRef<boolean>(false);
  const trackTimerRef = useRef<any>(null);

  // Khởi động Camera khi Modal mở
  useEffect(() => {
    if (isOpen) {
      startCamera();
      setScanResult(null);
      setErrorMessage(null);
      setLiveTrack(null);
      setAutoMatchCount(0);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt của bạn không hỗ trợ truy cập Webcam.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraActive(true);
          startLiveTracking();
        };
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Quyền truy cập Camera bị từ chối. Vui lòng cho phép quyền Camera trên thanh địa chỉ trình duyệt.'
          : 'Không thể mở Camera trên thiết bị này: ' + (err.message || 'Lỗi không xác định')
      );
    }
  };

  const stopCamera = () => {
    isTrackingActiveRef.current = false;
    if (trackTimerRef.current) {
      clearTimeout(trackTimerRef.current);
      trackTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    clearOverlay();
  };

  const clearOverlay = () => {
    const canvas = overlayCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Vẽ Bounding Box & Bảng Tên người ngay bên cạnh khuôn mặt
  const drawFaceOverlay = useCallback((track: TrackInfo) => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !track.hasFace || !track.box) {
      clearOverlay();
      return;
    }

    canvas.width = video.clientWidth || 640;
    canvas.height = video.clientHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const imgW = track.imgWidth || 640;
    const imgH = track.imgHeight || 480;
    const scaleX = canvas.width / imgW;
    const scaleY = canvas.height / imgH;

    // Toạ độ lật ngang (vì camera soi gương)
    const rawBox = track.box;
    const x1 = Math.max(4, (imgW - rawBox[2]) * scaleX);
    const x2 = Math.min(canvas.width - 4, (imgW - rawBox[0]) * scaleX);
    const y1 = Math.max(4, rawBox[1] * scaleY);
    const y2 = Math.min(canvas.height - 4, rawBox[3] * scaleY);
    const boxW = x2 - x1;
    const boxH = y2 - y1;

    // Màu sắc theo trạng thái nhận diện:
    // - Xanh lá: Đúng tài khoản đang đăng nhập (isTarget)
    // - Vàng cam: Đúng người trong hệ thống nhưng khác tài khoản đang đăng nhập
    // - Đỏ/Hồng: Người lạ / Chưa nhận diện
    const isTargetMatch = track.isTarget;
    const isKnownUser = track.isKnown;

    const strokeColor = isTargetMatch ? '#10b981' : isKnownUser ? '#f59e0b' : '#ef4444';
    const glowColor = isTargetMatch ? 'rgba(16, 185, 129, 0.4)' : isKnownUser ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.4)';

    // 1. Vẽ khung Bounding Box kiểu High-Tech (4 góc vuông)
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 10;

    const cornerLen = Math.min(24, boxW * 0.25);
    // Góc trên trái
    ctx.beginPath();
    ctx.moveTo(x1, y1 + cornerLen);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x1 + cornerLen, y1);
    ctx.stroke();

    // Góc trên phải
    ctx.beginPath();
    ctx.moveTo(x2 - cornerLen, y1);
    ctx.lineTo(x2, y1);
    ctx.lineTo(x2, y1 + cornerLen);
    ctx.stroke();

    // Góc dưới trái
    ctx.beginPath();
    ctx.moveTo(x1, y2 - cornerLen);
    ctx.lineTo(x1, y2);
    ctx.lineTo(x1 + cornerLen, y2);
    ctx.stroke();

    // Góc dưới phải
    ctx.beginPath();
    ctx.moveTo(x2 - cornerLen, y2);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2, y2 - cornerLen);
    ctx.stroke();

    // Viền mỏng toàn hộp
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(x1, y1, boxW, boxH);
    ctx.restore();

    // 2. Vẽ 5 điểm Landmarks (Mắt, Mũi, Khóe miệng) từ MTCNN
    if (track.landmarks && Array.isArray(track.landmarks)) {
      ctx.save();
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 6;
      track.landmarks.forEach((pt) => {
        const lx = (imgW - pt[0]) * scaleX;
        const ly = pt[1] * scaleY;
        ctx.beginPath();
        ctx.arc(lx, ly, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
      ctx.restore();
    }

    // 3. VẼ BẢNG TÊN NGAY BÊN CẠNH KHUÔN MẶT (NAME TAG BADGE)
    const displayName = track.name || 'Đang quét...';
    const percentText = `${track.similarityPercent || 0}%`;
    const roleText = track.role === 'admin' ? 'Chủ cửa hàng' : track.role === 'manager' ? 'Quản lý' : 'Chưa xác thực';

    ctx.save();
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    const nameWidth = ctx.measureText(displayName).width;
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    const subWidth = ctx.measureText(`${roleText} • ${percentText}`).width;
    const badgeW = Math.max(160, Math.max(nameWidth, subWidth) + 38);
    const badgeH = 46;

    // Xác định vị trí đặt Bảng tên:
    // Ưu tiên đặt BÊN PHẢI khuôn mặt nếu còn đủ chỗ, nếu không thì đặt PHÍA TRÊN trán
    let tagX = x2 + 12;
    let tagY = y1;
    if (tagX + badgeW > canvas.width - 10) {
      // Nếu tràn viền phải, đặt phía trên hộp mặt
      tagX = Math.max(10, Math.min(x1, canvas.width - badgeW - 10));
      tagY = Math.max(8, y1 - badgeH - 10);
    }

    // Vẽ nền thẻ tên (Dark Glassmorphism)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 8;

    // Bo góc thẻ tên
    const r = 10;
    ctx.beginPath();
    ctx.moveTo(tagX + r, tagY);
    ctx.lineTo(tagX + badgeW - r, tagY);
    ctx.quadraticCurveTo(tagX + badgeW, tagY, tagX + badgeW, tagY + r);
    ctx.lineTo(tagX + badgeW, tagY + badgeH - r);
    ctx.quadraticCurveTo(tagX + badgeW, tagY + badgeH, tagX + badgeW - r, tagY + badgeH);
    ctx.lineTo(tagX + r, tagY + badgeH);
    ctx.quadraticCurveTo(tagX, tagY + badgeH, tagX, tagY + badgeH - r);
    ctx.lineTo(tagX, tagY + r);
    ctx.quadraticCurveTo(tagX, tagY, tagX + r, tagY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Biểu tượng chấm tròn trạng thái (Status Dot)
    ctx.shadowBlur = 0;
    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    ctx.arc(tagX + 16, tagY + 18, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Dòng 1: Tên người (Trắng đậm)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.fillText(displayName, tagX + 28, tagY + 20);

    // Dòng 2: Vai trò & % Tương đồng
    ctx.fillStyle = isTargetMatch ? '#6ee7b7' : isKnownUser ? '#fde68a' : '#fca5a5';
    ctx.font = '500 11px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${roleText} • ${percentText}`, tagX + 28, tagY + 36);

    ctx.restore();
  }, []);

  // Vòng lặp Real-time Live Tracking gửi frame nhẹ (~300ms/lần)
  const startLiveTracking = () => {
    isTrackingActiveRef.current = true;

    const runTrackLoop = async () => {
      if (!isTrackingActiveRef.current || !videoRef.current || isScanning) {
        if (isTrackingActiveRef.current) {
          trackTimerRef.current = setTimeout(runTrackLoop, 350);
        }
        return;
      }

      const video = videoRef.current;
      if (video.readyState < 2) {
        trackTimerRef.current = setTimeout(runTrackLoop, 300);
        return;
      }

      try {
        // Cắt frame nhẹ kích thước nhỏ (360x270) để gửi mạng cực nhanh (< 15ms)
        const trackCanvas = document.createElement('canvas');
        trackCanvas.width = 360;
        trackCanvas.height = 270;
        const ctx = trackCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, trackCanvas.width, trackCanvas.height);
          const frameB64 = trackCanvas.toDataURL('image/jpeg', 0.82);

          const res = await fetch('/api/auth/track-face', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: frameB64,
              email: user?.email,
              role: user?.role,
            }),
          });

          if (res.ok) {
            const trackData: TrackInfo = await res.json();
            setLiveTrack(trackData);
            drawFaceOverlay(trackData);

            // Đếm số lần nhận diện chính xác liên tiếp
            if (trackData.isTarget && (trackData.similarityPercent || 0) >= 75) {
              setAutoMatchCount((prev) => prev + 1);
            } else {
              setAutoMatchCount(0);
            }
          }
        }
      } catch (e) {
        // Bỏ qua lỗi tracking ngầm
      }

      if (isTrackingActiveRef.current) {
        trackTimerRef.current = setTimeout(runTrackLoop, 320);
      }
    };

    runTrackLoop();
  };

  // Xác thực chính thức khi người dùng bấm nút
  const handleCaptureAndVerify = async () => {
    if (!videoRef.current || !captureCanvasRef.current || !user) return;
    setIsScanning(true);
    setErrorMessage(null);

    try {
      const video = videoRef.current;
      const canvas = captureCanvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Không thể khởi tạo bộ xử lý Canvas.');

      // Lật ảnh gương
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageBase64 = canvas.toDataURL('image/jpeg', 0.92);

      const res = await fetch('/api/auth/verify-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempToken,
          email: user.email,
          image: imageBase64,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setScanResult({
          matched: false,
          message: data.error || 'Khuôn mặt không khớp với hồ sơ lưu trữ.',
          similarityPercent: data.details?.similarityPercent,
          cosineSimilarity: data.details?.cosineSimilarity,
          euclideanDistance: data.details?.euclideanDistance,
        });
        setErrorMessage(data.error || 'Xác thực khuôn mặt thất bại. Vui lòng thử lại.');
      } else {
        setScanResult({
          matched: true,
          message: data.message || 'Xác thực khuôn mặt thành công!',
          similarityPercent: data.matchDetails?.similarityPercent || 95,
          cosineSimilarity: data.matchDetails?.cosineSimilarity,
          euclideanDistance: data.matchDetails?.euclideanDistance,
        });

        setTimeout(() => {
          stopCamera();
          onSuccess(data.user, data.sessionToken);
        }, 1000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối tới máy chủ nhận diện khuôn mặt.');
    } finally {
      setIsScanning(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all relative ${
          isDark
            ? 'bg-slate-900/95 border-slate-700/80 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                Xác thực Khuôn mặt Face ID
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                  Real-time MTCNN + FaceNet
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nhận diện tên & chức vụ ngay trên khung hình
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onCancel();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Identity Banner */}
        <div className="px-6 py-3 bg-blue-50/70 dark:bg-blue-950/40 border-b border-blue-100/50 dark:border-blue-900/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Yêu cầu xác thực: <strong>{user.name}</strong>
            </span>
          </div>
          <div className="inline-flex items-center gap-1 font-medium px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            {user.role === 'admin' ? 'Chủ cửa hàng (Admin)' : 'Quản lý cửa hàng (Manager)'}
          </div>
        </div>

        {/* Body Camera View */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Camera & Real-Time Drawing Overlay */}
          <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner">
            {cameraError ? (
              <div className="p-6 text-center text-xs text-rose-300 max-w-xs space-y-3">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <p>{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium inline-flex items-center gap-1.5 text-xs transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Thử lại
                </button>
              </div>
            ) : (
              <>
                {/* Video Feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />

                {/* Overlay Canvas for Real-time Bounding Box & Name Tag */}
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute inset-0 pointer-events-none w-full h-full"
                />

                {/* Status Indicator Bar at Top of Video */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <div className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-[11px] text-white flex items-center gap-1.5 shadow">
                    <span className={`w-2 h-2 rounded-full ${liveTrack?.hasFace ? (liveTrack.isTarget ? 'bg-emerald-400 animate-ping' : 'bg-amber-400') : 'bg-slate-400'}`} />
                    <span>
                      {liveTrack?.hasFace
                        ? `Đã phát hiện khuôn mặt: ${liveTrack.name}`
                        : 'Đang đợi khuôn mặt trước camera...'}
                    </span>
                  </div>

                  {liveTrack?.hasFace && (
                    <div className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-[11px] font-mono font-bold text-white shadow">
                      {liveTrack.similarityPercent}%
                    </div>
                  )}
                </div>

                {/* Horizontal laser beam while formally verifying */}
                {isScanning && (
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] animate-bounce pointer-events-none" />
                )}

                {/* Success Overlay Glow */}
                {scanResult?.matched && (
                  <div className="absolute inset-0 bg-emerald-500/25 backdrop-blur-[2px] flex flex-col items-center justify-center text-white animate-fadeIn pointer-events-none">
                    <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-2 drop-shadow-lg" />
                    <span className="text-base font-bold drop-shadow">Xác thực thành công!</span>
                    <span className="text-xs text-emerald-100 mt-1">
                      {liveTrack?.name || user.name} • Đang đăng nhập...
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Hidden canvas for full capture */}
            <canvas ref={captureCanvasRef} className="hidden" />
          </div>

          {/* Real-time Recognition Banner */}
          {liveTrack?.hasFace && (
            <div
              className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                liveTrack.isTarget
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : liveTrack.isKnown
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {liveTrack.isTarget ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <User className="w-4 h-4 text-amber-600 flex-shrink-0" />
                )}
                <div>
                  <p className="font-bold">
                    {liveTrack.name}
                  </p>
                  <p className="text-[11px] opacity-80">
                    {liveTrack.isTarget
                      ? 'Khuôn mặt trùng khớp với tài khoản đăng nhập!'
                      : liveTrack.isKnown
                      ? 'Nhận diện được nhưng khác với tài khoản đang đăng nhập.'
                      : 'Người lạ hoặc góc mặt chưa rõ.'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-white/80 dark:bg-slate-900/60 shadow-sm">
                {liveTrack.similarityPercent}%
              </span>
            </div>
          )}

          {/* Feedback message if manual scan had error */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onCancel();
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Hủy & Quay lại
            </button>
            <button
              type="button"
              disabled={!cameraActive || isScanning || scanResult?.matched}
              onClick={handleCaptureAndVerify}
              className={`flex-[2] py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                !cameraActive || isScanning || scanResult?.matched
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                  : liveTrack?.isTarget
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/50 animate-pulse'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 active:scale-[0.98]'
              }`}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang đối chiếu vector MTCNN + FaceNet...
                </>
              ) : scanResult?.matched ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Xác thực thành công
                </>
              ) : liveTrack?.isTarget ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Khớp chính xác! Xác nhận Đăng nhập
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  Chụp & Quét Khuôn mặt
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
