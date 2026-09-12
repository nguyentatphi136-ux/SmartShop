import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  ScanLine,
  Zap,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  Send,
  Smartphone,
  Check,
  ArrowLeft,
  Sparkles,
  Wifi,
  WifiOff,
  Play,
  ExternalLink,
} from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';

interface MobileCompanionScannerProps {
  sessionId: string;
  onExitToApp?: () => void;
}

interface MobileScanLog {
  id: string;
  barcode: string;
  timestamp: string;
  success: boolean;
}

export const MobileCompanionScanner: React.FC<MobileCompanionScannerProps> = ({
  sessionId,
  onExitToApp,
}) => {
  // Video & scanning refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const isScanningActiveRef = useRef<boolean>(false);
  const lastScannedCodeRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);
  const anyScanTimeRef = useRef<number>(0);
  const isProcessingFrameRef = useRef<boolean>(false);

  // States
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [hasTorchSupport, setHasTorchSupport] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');
  const [scanHistory, setScanHistory] = useState<MobileScanLog[]>([]);
  const [sentCount, setSentCount] = useState<number>(0);

  // Sound & Haptic
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1850, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);

      if (navigator.vibrate) {
        navigator.vibrate(80);
      }
    } catch (e) {
      console.warn('Audio error:', e);
    }
  };

  // Join session on mount
  useEffect(() => {
    const joinSession = async () => {
      try {
        const res = await fetch(`/api/scanner/session/${sessionId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceInfo: `${navigator.userAgent.includes('iPhone') ? 'iPhone' : 'Android'} Camera`,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setIsConnected(true);
        }
      } catch (e) {
        console.error('Failed to join scanner session:', e);
      }
    };

    joinSession();
  }, [sessionId]);

  // Send scanned barcode to PC via API
  const sendBarcodeToPC = async (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    setIsSending(true);
    playBeep();
    setLastScannedBarcode(clean);

    try {
      const res = await fetch(`/api/scanner/session/${sessionId}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: clean }),
      });
      const data = await res.json();

      setSentCount((prev) => prev + 1);
      setScanHistory((prev) => [
        {
          id: `scan-${Date.now()}-${Math.random()}`,
          barcode: clean,
          timestamp: new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          success: true,
        },
        ...prev.slice(0, 19),
      ]);
    } catch (e) {
      console.error('Failed to send barcode:', e);
      setScanHistory((prev) => [
        {
          id: `scan-err-${Date.now()}`,
          barcode: clean,
          timestamp: new Date().toLocaleTimeString('vi-VN'),
          success: false,
        },
        ...prev.slice(0, 19),
      ]);
    } finally {
      setIsSending(false);
      setTimeout(() => {
        setLastScannedBarcode(null);
      }, 2500);
    }
  };

  // Handle scanned code detection
  const handleCodeDetected = (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    const now = Date.now();

    // Minimum interval between ANY scans (800ms)
    if (now - anyScanTimeRef.current < 800) {
      return;
    }

    // Debounce duplicate barcode of the SAME code within 2.5s (2500ms)
    if (clean === lastScannedCodeRef.current && now - lastScanTimeRef.current < 2500) {
      return;
    }

    lastScannedCodeRef.current = clean;
    lastScanTimeRef.current = now;
    anyScanTimeRef.current = now;

    sendBarcodeToPC(clean);
  };

  // Start phone camera
  const startCamera = async () => {
    setCameraError(null);
    setIsVideoPlaying(false);
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        window.location.protocol !== 'https:' && window.location.hostname !== 'localhost'
          ? 'Trình duyệt yêu cầu kết nối HTTPS bảo mật để mở Camera trên điện thoại.'
          : 'Trình duyệt của bạn không hỗ trợ API Camera hoặc bị chặn quyền.'
      );
      return;
    }

    try {
      // Progressive constraint fallback to prevent OverconstrainedError on various phones
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (e1) {
        console.warn('High-res mobile camera constraint failed, trying basic facingMode:', e1);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: facingMode } },
            audio: false,
          });
        } catch (e2) {
          console.warn('FacingMode constraint failed, trying any video stream:', e2);
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        // Critical for iOS Safari and Chrome mobile autoplay policy
        video.muted = true;
        (video as any).defaultMuted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        video.setAttribute('muted', 'true');

        const playPromise = async () => {
          try {
            await video.play();
            setIsVideoPlaying(true);
          } catch (playErr) {
            console.warn('Mobile video autoplay blocked by browser policy:', playErr);
            setIsVideoPlaying(false);
          }
        };

        if (video.readyState >= 2) {
          playPromise();
        } else {
          video.onloadedmetadata = playPromise;
          video.oncanplay = playPromise;
        }
      }

      // Check torch capability
      const track = stream.getVideoTracks()[0];
      if (track && (track as any).getCapabilities) {
        const capabilities = (track as any).getCapabilities();
        setHasTorchSupport(!!capabilities.torch);
      }

      startDetectionLoop();
    } catch (err: any) {
      console.error('Mobile camera start error:', err);
      setCameraError(
        'Không thể mở Camera trên điện thoại. Vui lòng kiểm tra quyền Camera trong cài đặt trình duyệt.'
      );
    }
  };

  const stopCamera = () => {
    setIsVideoPlaying(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (zxingReaderRef.current) {
      try {
        zxingReaderRef.current.reset();
      } catch (e) {}
    }
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextTorch = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setIsTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch toggle error:', e);
    }
  };

  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const startDetectionLoop = () => {
    isScanningActiveRef.current = true;

    const NativeDetector = (window as any).BarcodeDetector;
    let detector: any = null;
    if (NativeDetector) {
      try {
        detector = new NativeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
        });
      } catch (e) {}
    }

    if (!zxingReaderRef.current) {
      zxingReaderRef.current = new BrowserMultiFormatReader();
    }

    const interval = setInterval(async () => {
      if (!isScanningActiveRef.current || !videoRef.current || isProcessingFrameRef.current) {
        return;
      }
      isProcessingFrameRef.current = true;

      try {
        const video = videoRef.current;
        if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0 || video.paused) {
          return;
        }

        // Draw current video frame to hidden canvas for non-intrusive decoding
        let canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = Math.min(video.videoWidth, 640);
        canvas.height = Math.min(video.videoHeight, 480);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        let detected = false;
        // 1. Try native hardware BarcodeDetector
        if (detector) {
          try {
            const barcodes = await detector.detect(canvas);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              detected = true;
              handleCodeDetected(barcodes[0].rawValue);
              return;
            }
          } catch (e) {}
        }

        // 2. Fallback to ZXing canvas decode (never pauses the video stream)
        if (!detected && zxingReaderRef.current) {
          try {
            const result = (zxingReaderRef.current as any).decode(canvas as any);
            if (result && result.getText()) {
              handleCodeDetected(result.getText());
            }
          } catch (e) {}
        }
      } finally {
        isProcessingFrameRef.current = false;
      }
    }, 200);

    return () => {
      isScanningActiveRef.current = false;
      clearInterval(interval);
    };
  };

  useEffect(() => {
    startCamera();
    return () => {
      isScanningActiveRef.current = false;
      stopCamera();
    };
  }, [facingMode]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col select-none overflow-hidden">
      {/* TOP COMPACT STATUS BAR */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-20">
        <div className="flex items-center gap-2.5">
          {onExitToApp && (
            <button
              onClick={onExitToApp}
              className="p-1.5 -ml-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Mở toàn bộ ứng dụng"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-bold text-white tracking-tight">Máy Quét Điện Thoại</h1>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isConnected
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {sessionId}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Đang kết nối camera trực tiếp với quầy POS</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled((p) => !p)}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Torch toggle */}
          {hasTorchSupport && (
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-xl border transition-colors ${
                isTorchOn
                  ? 'bg-amber-400 text-amber-950 border-amber-500 font-bold'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Zap className="w-4 h-4" />
            </button>
          )}

          {/* Flip camera */}
          <button
            onClick={flipCamera}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CAMERA VIEWFINDER (FULLSCREEN FILL) */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Tap-to-activate overlay if browser blocks autoplay */}
        {!isVideoPlaying && !cameraError && (
          <div
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play().then(() => setIsVideoPlaying(true)).catch(console.error);
              }
            }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs text-white p-4 cursor-pointer text-center"
          >
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center mb-3 shadow-2xl animate-pulse">
              <Play className="w-8 h-8 ml-1 text-white fill-white" />
            </div>
            <span className="text-sm font-bold">Chạm để bật Camera điện thoại</span>
            <span className="text-xs text-slate-300 mt-1 max-w-xs">
              Trình duyệt di động yêu cầu xác nhận chạm màn hình để phát video
            </span>
          </div>
        )}

        {/* HUD Scanner Reticle */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
          <div className="w-72 h-52 relative border-2 border-dashed border-blue-400/60 rounded-3xl flex items-center justify-center">
            {/* Viewfinder Corners */}
            <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl -mt-1 -ml-1" />
            <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl -mt-1 -mr-1" />
            <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl -mb-1 -ml-1" />
            <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-blue-500 rounded-br-2xl -mb-1 -mr-1" />

            {/* Red Laser scan line */}
            <div className="absolute w-full h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-bounce duration-1000" />

            <span className="absolute -bottom-8 text-xs font-semibold text-white/90 bg-black/70 px-4 py-1 rounded-full backdrop-blur-md">
              Hướng camera vào mã vạch sản phẩm
            </span>
          </div>

          {/* SUCCESS BANNER WHEN BARCODE SCANNED */}
          {lastScannedBarcode && (
            <div className="absolute top-6 inset-x-4 bg-emerald-600 text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-200 pointer-events-auto">
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-200 flex-shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-bold truncate">Đã gửi mã tới máy tính POS!</p>
                  <p className="text-[11px] font-mono text-emerald-100">Mã: {lastScannedBarcode}</p>
                </div>
              </div>
              <span className="text-[11px] font-bold bg-white text-emerald-800 px-2.5 py-1 rounded-xl flex-shrink-0">
                +{sentCount} thành công
              </span>
            </div>
          )}
        </div>

        {/* Camera Permission Error Overlay */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-950/95 p-6 flex flex-col items-center justify-center text-center z-30">
            <Camera className="w-12 h-12 text-slate-500 mb-3" />
            <p className="text-xs font-bold text-amber-300 max-w-xs mb-4">{cameraError}</p>
            <button
              onClick={startCamera}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thử lại Camera</span>
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM CONTROLS & MANUAL BARCODE INPUT */}
      <div className="bg-slate-900 border-t border-slate-800 p-3 sm:p-4 space-y-3 z-20">
        {/* Manual Barcode Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (manualCode.trim()) {
              sendBarcodeToPC(manualCode.trim());
              setManualCode('');
            }
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <ScanLine className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Nhập tay mã vạch / SKU nếu mờ..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={!manualCode.trim() || isSending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi</span>
          </button>
        </form>

        {/* Quick Test Barcode Buttons for fast verification */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] scrollbar-none">
          <span className="text-slate-400 flex-shrink-0">Mã test nhanh:</span>
          {['SP001', 'SP002', 'SP003', 'SP004', 'SP005'].map((testCode) => (
            <button
              key={testCode}
              onClick={() => sendBarcodeToPC(testCode)}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono flex-shrink-0 border border-slate-700 active:scale-95 transition-all"
            >
              {testCode}
            </button>
          ))}
        </div>

        {/* Connection status footer */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5">
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Đã đồng bộ với máy tính POS</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400">Đang kết nối lại...</span>
              </>
            )}
          </div>
          <span>Đã quét: <strong className="text-white">{sentCount}</strong> món</span>
        </div>
      </div>
    </div>
  );
};

export default MobileCompanionScanner;
