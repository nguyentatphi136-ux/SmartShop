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

interface DetectedFaceItem {
  name: string;
  role: string;
  key: string;
  isKnown: boolean;
  isTarget: boolean;
  similarityPercent: number;
  cosineSimilarity: number;
  box: [number, number, number, number];
  landmarks: number[][];
  detectionProb: number;
}

interface TrackInfo {
  hasFace: boolean;
  faceCount?: number;
  faces?: DetectedFaceItem[];
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

  // Vẽ Bounding Box & Bảng Tên người ngay bên cạnh khuôn mặt (Hỗ trợ ĐA KHUÔN MẶT đồng thời)
  const drawFaceOverlay = useCallback((track: TrackInfo) => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !track.hasFace) {
      clearOverlay();
      return;
    }

    // Danh sách tất cả khuôn mặt phát hiện được
    const faces: DetectedFaceItem[] =
      track.faces && track.faces.length > 0
        ? track.faces
        : track.box
        ? [
            {
              name: track.name || 'Đang quét...',
              role: track.role || 'unknown',
              key: 'unknown',
              isKnown: !!track.isKnown,
              isTarget: !!track.isTarget,
              similarityPercent: track.similarityPercent || 0,
              cosineSimilarity: track.cosineSimilarity || 0,
              box: track.box,
              landmarks: track.landmarks || [],
              detectionProb: 1.0,
            },
          ]
        : [];

    if (faces.length === 0) {
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

    // Lặp qua từng khuôn mặt để vẽ Bounding Box, 5 Landmarks và Bảng Tên nổi
    faces.forEach((face, index) => {
      if (!face.box) return;

      // Toạ độ lật ngang (vì camera soi gương)
      const rawBox = face.box;
      const x1 = Math.max(4, (imgW - rawBox[2]) * scaleX);
      const x2 = Math.min(canvas.width - 4, (imgW - rawBox[0]) * scaleX);
      const y1 = Math.max(4, rawBox[1] * scaleY);
      const y2 = Math.min(canvas.height - 4, rawBox[3] * scaleY);
      const boxW = x2 - x1;
      const boxH = y2 - y1;

      // Màu sắc theo trạng thái nhận diện:
      // - Xanh lá (#10b981): Đúng tài khoản đang đăng nhập (isTarget)
      // - Vàng cam (#f59e0b): Người quen trong hệ thống (Chủ quán/Quản lý) nhưng không phải tài khoản này
      // - Đỏ neon (#ef4444): Người lạ / Chưa đăng ký trong hệ thống
      const isTargetMatch = face.isTarget;
      const isKnownUser = face.isKnown;

      const strokeColor = isTargetMatch
        ? '#10b981'
        : isKnownUser
        ? '#f59e0b'
        : '#ef4444';
      const glowColor = isTargetMatch
        ? 'rgba(16, 185, 129, 0.45)'
        : isKnownUser
        ? 'rgba(245, 158, 11, 0.45)'
        : 'rgba(239, 68, 68, 0.45)';

      // 1. Vẽ khung Bounding Box kiểu High-Tech (4 góc vuông neon)
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 10;

      const cornerLen = Math.min(22, boxW * 0.25);
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
      if (face.landmarks && Array.isArray(face.landmarks)) {
        ctx.save();
        ctx.fillStyle = isTargetMatch ? '#34d399' : isKnownUser ? '#38bdf8' : '#f87171';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 6;
        face.landmarks.forEach((pt) => {
          const lx = (imgW - pt[0]) * scaleX;
          const ly = pt[1] * scaleY;
          ctx.beginPath();
          ctx.arc(lx, ly, 3, 0, 2 * Math.PI);
          ctx.fill();
        });
        ctx.restore();
      }

      // 3. VẼ BẢNG TÊN NGAY BÊN CẠNH KHUÔN MẶT (FLOATING NAME BADGE)
      const displayName = isKnownUser ? face.name : 'Người lạ';
      const percentText = `${face.similarityPercent || 0}%`;
      const roleText =
        face.role === 'admin'
          ? 'Chủ cửa hàng'
          : face.role === 'manager'
          ? 'Quản lý'
          : 'Chưa đăng ký';

      ctx.save();
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
      const nameWidth = ctx.measureText(displayName).width;
      ctx.font = '10px system-ui, -apple-system, sans-serif';
      const subWidth = ctx.measureText(`${roleText} • ${percentText}`).width;
      const badgeW = Math.max(140, Math.max(nameWidth, subWidth) + 38);
      const badgeH = 44;

      // Ưu tiên đặt BÊN PHẢI khuôn mặt nếu còn đủ chỗ, nếu không thì đặt PHÍA TRÊN hoặc BÊN DƯỚI
      let tagX = x2 + 10;
      let tagY = y1;
      if (tagX + badgeW > canvas.width - 8) {
        tagX = Math.max(8, Math.min(x1, canvas.width - badgeW - 8));
        tagY = y1 >= badgeH + 8 ? y1 - badgeH - 8 : y2 + 8;
      }

      // Nền thẻ tên (Dark Glassmorphism)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 8;

      const r = 8;
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
      ctx.arc(tagX + 14, tagY + 16, 4.5, 0, 2 * Math.PI);
      ctx.fill();

      // Số thứ tự nếu có từ 2 khuôn mặt trở lên
      if (faces.length > 1) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`#${index + 1}`, tagX + badgeW - 20, tagY + 15);
      }

      // Dòng 1: Tên người (Trắng đậm)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
      ctx.fillText(displayName, tagX + 24, tagY + 18);

      // Dòng 2: Vai trò & % Tương đồng
      ctx.fillStyle = isTargetMatch ? '#6ee7b7' : isKnownUser ? '#fde68a' : '#fca5a5';
      ctx.font = '500 10px system-ui, -apple-system, sans-serif';
      ctx.fillText(isKnownUser ? `${roleText} • ${percentText}` : `Người lạ • ${percentText}`, tagX + 24, tagY + 33);

      ctx.restore();
    });
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
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none gap-2">
                  <div className="px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700 text-[11px] text-white flex items-center gap-1.5 shadow truncate max-w-[80%]">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        liveTrack?.hasFace
                          ? liveTrack.isTarget
                            ? 'bg-emerald-400 animate-ping'
                            : 'bg-amber-400'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span className="truncate">
                      {liveTrack?.hasFace
                        ? liveTrack.faceCount && liveTrack.faceCount > 1
                          ? `👥 Đã thấy ${liveTrack.faceCount} khuôn mặt: ${liveTrack.faces?.map((f) => (f.isKnown ? f.name : 'Người lạ')).join(', ')}`
                          : `Đã phát hiện: ${liveTrack.name}`
                        : 'Đang đợi khuôn mặt trước camera...'}
                    </span>
                  </div>

                  {liveTrack?.hasFace && (
                    <div className="px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700 text-[11px] font-mono font-bold text-white shadow flex-shrink-0">
                      {liveTrack.faceCount && liveTrack.faceCount > 1
                        ? `${liveTrack.faceCount} người`
                        : `${liveTrack.similarityPercent}%`}
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

          {/* Real-time Recognition Banner (Multi-Face list or Single) */}
          {liveTrack?.hasFace && (
            <div className="space-y-2">
              {liveTrack.faces && liveTrack.faces.length > 1 ? (
                /* Multi-face list banner */
                <div className="p-3 rounded-2xl border bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      Phát hiện đồng thời {liveTrack.faces.length} khuôn mặt trong khung hình:
                    </span>
                    {liveTrack.isTarget && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        Đã nhận diện chính chủ
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {liveTrack.faces.map((f, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-xl border flex items-center justify-between ${
                          f.isTarget
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                            : f.isKnown
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-4 h-4 rounded-full bg-slate-900/10 dark:bg-slate-100/10 text-[10px] font-mono font-bold flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <p className="font-bold truncate text-[11px]">{f.name}</p>
                            <p className="text-[10px] opacity-75">
                              {f.isTarget
                                ? 'Tài khoản đăng nhập'
                                : f.isKnown
                                ? f.role === 'admin'
                                  ? 'Chủ cửa hàng'
                                  : 'Quản lý'
                                : 'Người lạ'}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white/70 dark:bg-slate-900/60 flex-shrink-0 ml-1">
                          {f.similarityPercent}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Single face banner */
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
                      <p className="font-bold">{liveTrack.name}</p>
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
