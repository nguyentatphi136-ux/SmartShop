import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Camera,
  ScanLine,
  Sparkles,
  X,
  Volume2,
  VolumeX,
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShoppingBag,
  Eye,
  Check,
  Package,
  Layers,
  Search,
  Smartphone,
  QrCode,
  Copy,
  ExternalLink,
  Wifi,
  WifiOff,
  RefreshCw,
  Tag,
  Play,
} from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';
import QRCode from 'qrcode';
import { Product } from '../types';
import { useLanguage } from '../utils/i18n';
import { BarcodeTag } from './BarcodeTag';

export interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddToCart: (product: Product) => void;
  isDark?: boolean;
  initialTab?: 'barcode' | 'visual' | 'mobile' | 'samples';
}

interface ScanLog {
  id: string;
  product: Product;
  barcode: string;
  timestamp: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddToCart,
  isDark,
  initialTab = 'barcode',
}) => {
  const { language, t, formatCurr } = useLanguage();

  // Mode: 'barcode' (realtime live barcode/QR stream) vs 'visual' (AI Visual Product Recognition) vs 'mobile' (Wireless Phone Camera) vs 'samples' (Sample Printable Barcode Tags)
  const [activeTab, setActiveTab] = useState<'barcode' | 'visual' | 'mobile' | 'samples'>(initialTab);

  // Sync initial tab when modal opens
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Camera & Stream State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  // Default to front camera 'user' on PC/Laptop, rear 'environment' on mobile
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(() => {
    if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      return 'environment';
    }
    return 'user';
  });
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [continuousScan, setContinuousScan] = useState<boolean>(true);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);

  // Scan & Detection feedback
  const [lastScanned, setLastScanned] = useState<{
    product: Product;
    code: string;
    timestamp: number;
    source?: string;
  } | null>(null);
  const [unrecognizedCode, setUnrecognizedCode] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanLog[]>([]);
  const lastScanTimestampRef = useRef<number>(0);
  const anyScanTimestampRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>('');
  const isProcessingScanRef = useRef<boolean>(false);
  const isDetectingFrameRef = useRef<boolean>(false);

  // Wireless Mobile Scanner Connection State
  const [sessionId, setSessionId] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem('pos_scanner_session_id');
      if (saved) return saved;
      const newId = `POS-${Math.floor(1000 + Math.random() * 9000)}`;
      sessionStorage.setItem('pos_scanner_session_id', newId);
      return newId;
    } catch {
      return `POS-${Math.floor(1000 + Math.random() * 9000)}`;
    }
  });
  const [isPhoneConnected, setIsPhoneConnected] = useState<boolean>(false);
  const [phoneDeviceInfo, setPhoneDeviceInfo] = useState<string>('Điện thoại');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [phoneScannedCount, setPhoneScannedCount] = useState<number>(0);

  // Visual Checkout State
  const [isAnalyzingVisual, setIsAnalyzingVisual] = useState<boolean>(false);
  const [visualCapturedImage, setVisualCapturedImage] = useState<string | null>(null);
  const [visualResult, setVisualResult] = useState<{
    matchedProduct: Product | null;
    confidence: number;
    description: string;
    alternativeMatches?: Array<{ productId: string; productName: string; confidence: number }>;
  } | null>(null);
  const [autoAddVisual, setAutoAddVisual] = useState<boolean>(true);

  // Manual & Simulator Filter
  const [searchSimText, setSearchSimText] = useState<string>('');

  // Audio BEEP synthesizer using Web Audio API
  const playCashierBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1750, ctx.currentTime); // Supermarket POS chime
      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(60);
      }
    } catch (e) {
      console.warn('AudioContext error:', e);
    }
  };

  const playAlertBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.warn('AudioContext error:', e);
    }
  };

  // Process a detected barcode string (from local camera or remote phone)
  const handleBarcodeDetected = (code: string, source: string = 'Camera') => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    const now = Date.now();

    // 1. Drop if currently processing a scan action
    if (isProcessingScanRef.current) {
      return;
    }

    // 2. Minimum interval of 800ms between ANY scans (prevents simultaneous triggers from detector & zxing)
    if (now - anyScanTimestampRef.current < 800) {
      return;
    }

    // 3. Strict 2.5-second debounce window for identical barcode (prevents "nhảy 2 lần")
    if (cleanCode === lastScannedCodeRef.current && now - lastScanTimestampRef.current < 2500) {
      return;
    }

    isProcessingScanRef.current = true;
    lastScanTimestampRef.current = now;
    anyScanTimestampRef.current = now;
    lastScannedCodeRef.current = cleanCode;

    // Release processing lock after 600ms
    setTimeout(() => {
      isProcessingScanRef.current = false;
    }, 600);

    // Search product in catalog
    const matched = products.find((p) => {
      const codeMatch = p.code.toLowerCase() === cleanCode.toLowerCase();
      const skuMatch = p.sku && p.sku.toLowerCase() === cleanCode.toLowerCase();
      const idMatch = p.id.toLowerCase() === cleanCode.toLowerCase();
      return codeMatch || skuMatch || idMatch;
    });

    if (matched) {
      playCashierBeep();
      setLastScanned({
        product: matched,
        code: cleanCode,
        timestamp: now,
        source,
      });
      setUnrecognizedCode(null);

      // Add to cart immediately
      onAddToCart(matched);

      // Add to scan session history
      setScanHistory((prev) => [
        {
          id: `scan-${now}-${Math.random()}`,
          product: matched,
          barcode: `${source === 'Phone' ? '📱 ' : ''}${cleanCode}`,
          timestamp: new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        },
        ...prev.slice(0, 19),
      ]);
    } else {
      playAlertBeep();
      setUnrecognizedCode(cleanCode);
      setLastScanned(null);
    }
  };

  // Generate QR Code for Phone Companion
  const companionUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    return `${origin}/?scannerSession=${sessionId}`;
  }, [sessionId]);

  useEffect(() => {
    if (companionUrl) {
      QRCode.toDataURL(companionUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.warn('QR Code generation failed:', err));
    }
  }, [companionUrl]);

  // Connect to Remote Scanner SSE Stream on server
  useEffect(() => {
    if (!isOpen) return;

    // Register session on backend
    fetch('/api/scanner/session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    }).catch(() => {});

    // Subscribe to SSE
    const eventSource = new EventSource(`/api/scanner/session/${sessionId}/events`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'phone_connected') {
          setIsPhoneConnected(true);
          if (data.deviceInfo) setPhoneDeviceInfo(data.deviceInfo);
        } else if (data.type === 'init') {
          if (data.phoneConnected) {
            setIsPhoneConnected(true);
          }
        } else if (data.type === 'barcode_scanned' && data.barcode) {
          setIsPhoneConnected(true);
          setPhoneScannedCount((prev) => prev + 1);
          handleBarcodeDetected(data.barcode, 'Phone');
        }
      } catch (err) {
        console.warn('SSE event error:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [isOpen, sessionId]);

  const handleResetSession = () => {
    const newId = `POS-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      sessionStorage.setItem('pos_scanner_session_id', newId);
    } catch {}
    setSessionId(newId);
    setIsPhoneConnected(false);
    setPhoneScannedCount(0);
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(companionUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    setIsVideoPlaying(false);
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCameraPermission(false);
      setCameraError(
        window.location.protocol !== 'https:' && window.location.hostname !== 'localhost'
          ? 'Trình duyệt yêu cầu kết nối HTTPS bảo mật để mở Camera. Hãy mở ứng dụng bằng giao thức HTTPS.'
          : 'Trình duyệt không hỗ trợ hoặc đã chặn API Camera.'
      );
      return;
    }

    try {
      // 3-Tier robust fallback constraints (guarantees camera opens on both laptops and phones)
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
      } catch (err1) {
        console.warn('Constraint tier 1 failed, trying tier 2 facingMode fallback:', err1);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: facingMode } },
            audio: false,
          });
        } catch (err2) {
          console.warn('Constraint tier 2 failed, falling back to generic video device:', err2);
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
        // Critical for iOS Safari and Chrome autoplay policy (avoids black video)
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
            console.warn('Video autoplay was paused or blocked by browser policy:', playErr);
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

      setHasCameraPermission(true);
      startBarcodeScanningLoop();
    } catch (err: any) {
      console.error('Camera access error:', err);
      setHasCameraPermission(false);
      setCameraError(
        err.name === 'NotAllowedError'
          ? language === 'vi'
            ? 'Quyền truy cập Camera bị từ chối. Vui lòng cấp quyền Camera trên trình duyệt hoặc sử dụng thẻ "Kết nối Điện thoại".'
            : 'Camera permission denied. Please allow camera access or use the "Phone Camera" mode.'
          : language === 'vi'
          ? 'Không tìm thấy hoặc không thể mở Camera trên thiết bị này. Bạn có thể dùng điện thoại làm máy quét không dây!'
          : 'Unable to start camera on this computer. You can use your phone camera instead!'
      );
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    setIsVideoPlaying(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (zxingReaderRef.current) {
      try {
        zxingReaderRef.current.reset();
      } catch (e) {}
    }
  };

  // Barcode Detection Loop (Native BarcodeDetector with ZXing Canvas Fallback)
  const isScanningActiveRef = useRef<boolean>(false);

  const startBarcodeScanningLoop = () => {
    isScanningActiveRef.current = true;

    // Check if BarcodeDetector API exists natively
    const NativeBarcodeDetector = (window as any).BarcodeDetector;
    let nativeDetector: any = null;

    if (NativeBarcodeDetector) {
      try {
        nativeDetector = new NativeBarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
        });
      } catch (e) {
        console.warn('Native BarcodeDetector init failed:', e);
      }
    }

    if (!zxingReaderRef.current) {
      zxingReaderRef.current = new BrowserMultiFormatReader();
    }

    let intervalId: any = null;

    const scanFrame = async () => {
      if (!isScanningActiveRef.current || !videoRef.current || isDetectingFrameRef.current) {
        return;
      }
      isDetectingFrameRef.current = true;

      try {
        const video = videoRef.current;
        // Ensure video is actively playing and has dimensions
        if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0 || video.paused) {
          return;
        }

        // Draw current video frame to hidden canvas
        // This decodes WITHOUT interrupting the HTML5 <video> stream playback!
        let canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = Math.min(video.videoWidth, 640);
        canvas.height = Math.min(video.videoHeight, 480);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        let detected = false;
        // 1. Try Native BarcodeDetector first (faster and hardware accelerated)
        if (nativeDetector) {
          try {
            const barcodes = await nativeDetector.detect(canvas);
            if (barcodes && barcodes.length > 0) {
              const rawValue = barcodes[0].rawValue;
              if (rawValue) {
                detected = true;
                handleBarcodeDetected(rawValue, 'Camera');
                return;
              }
            }
          } catch (e) {
            // fallback to zxing
          }
        }

        // 2. ZXing Fallback via canvas (CRITICAL: only run if native detector did not detect)
        if (!detected && zxingReaderRef.current) {
          try {
            const result = (zxingReaderRef.current as any).decode(canvas as any);
            if (result && result.getText()) {
              handleBarcodeDetected(result.getText(), 'Camera');
            }
          } catch (e) {
            // Frame had no valid barcode, normal silent continue
          }
        }
      } finally {
        isDetectingFrameRef.current = false;
      }
    };

    intervalId = setInterval(scanFrame, 220);

    return () => {
      isScanningActiveRef.current = false;
      if (intervalId) clearInterval(intervalId);
    };
  };

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.torch) {
        const nextState = !isTorchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState } as any],
        });
        setIsTorchOn(nextState);
      } else {
        alert(language === 'vi' ? 'Thiết bị không hỗ trợ đèn Flash/Torch' : 'Device does not support torch');
      }
    } catch (e) {
      console.warn('Torch toggle error:', e);
    }
  };

  // Flip Camera
  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Visual Checkout Capture & AI Analysis
  const captureAndAnalyzeVisual = async () => {
    if (!videoRef.current) return;
    setIsAnalyzingVisual(true);
    setVisualResult(null);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 800;
      canvas.height = videoRef.current.videoHeight || 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setVisualCapturedImage(dataUrl);

      const response = await fetch('/api/ai/visual-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: dataUrl,
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            code: p.code,
            sku: p.sku,
            category: p.category,
            price: p.price,
          })),
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.matchedProduct) {
        const fullProd = products.find((p) => p.id === resData.matchedProduct.id) || resData.matchedProduct;
        setVisualResult({
          matchedProduct: fullProd,
          confidence: resData.confidence || 0.92,
          description: resData.description || 'Nhận diện bao bì sản phẩm',
          alternativeMatches: resData.alternativeMatches,
        });

        playCashierBeep();

        if (autoAddVisual && resData.confidence >= 0.85) {
          onAddToCart(fullProd);
          setScanHistory((prev) => [
            {
              id: `visual-${Date.now()}`,
              product: fullProd,
              barcode: `AI-VISUAL (${Math.round((resData.confidence || 0.92) * 100)}%)`,
              timestamp: new Date().toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }),
            },
            ...prev,
          ]);
        }
      } else {
        playAlertBeep();
        setVisualResult({
          matchedProduct: null,
          confidence: 0,
          description: language === 'vi' ? 'Không nhận diện được sản phẩm nào trong kho' : 'No matching product found in store',
        });
      }
    } catch (err: any) {
      console.error('Visual analysis error:', err);
      playAlertBeep();
      setVisualResult({
        matchedProduct: null,
        confidence: 0,
        description: language === 'vi' ? 'Lỗi kết nối phân tích hình ảnh AI' : 'AI image analysis failed',
      });
    } finally {
      setIsAnalyzingVisual(false);
    }
  };

  // Manage camera lifecycle based on modal open state and active tab
  useEffect(() => {
    if (isOpen && activeTab !== 'mobile' && activeTab !== 'samples') {
      startCamera();
    } else {
      stopCamera();
      isScanningActiveRef.current = false;
      setLastScanned(null);
      setUnrecognizedCode(null);
      setVisualCapturedImage(null);
      setVisualResult(null);
    }
    return () => {
      stopCamera();
      isScanningActiveRef.current = false;
    };
  }, [isOpen, facingMode, activeTab]);

  // Filtered simulator products
  const simulatorProducts = useMemo(() => {
    if (!searchSimText.trim()) return products.slice(0, 8);
    const q = searchSimText.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [products, searchSimText]);

  if (!isOpen) return null;

  return (
    <div
      id="barcode-scanner-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ScanLine className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base tracking-tight">
                  {language === 'vi' ? 'Quét Barcode Camera & Kết Nối Điện Thoại' : 'Live Barcode Scanner & Mobile Camera'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  LIVE POS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'vi'
                  ? 'Quét qua camera máy tính, chụp AI hoặc kết nối camera điện thoại làm máy quét không dây'
                  : 'Scan via PC camera, AI visual, or use your phone camera as a wireless scanner'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={`p-2 rounded-xl border transition-colors ${
                soundEnabled
                  ? 'border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
              title={soundEnabled ? 'Âm thanh Bíp: Bật' : 'Âm thanh Bíp: Tắt'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              title="Đóng máy quét"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3 MODE TABS: BARCODE vs VISUAL vs MOBILE COMPANION */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 bg-slate-50 dark:bg-slate-900/50 gap-1 overflow-x-auto">
          {/* TAB 1: PC CAMERA BARCODE */}
          <button
            onClick={() => setActiveTab('barcode')}
            className={`flex items-center gap-2 py-2.5 px-3.5 sm:px-4 font-bold text-xs border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'barcode'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ScanLine className="w-4 h-4" />
            <span>{language === 'vi' ? 'Camera Máy Tính' : 'PC Barcode Camera'}</span>
          </button>

          {/* TAB 2: VISUAL CHECKOUT */}
          <button
            onClick={() => setActiveTab('visual')}
            className={`flex items-center gap-2 py-2.5 px-3.5 sm:px-4 font-bold text-xs border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'visual'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{language === 'vi' ? 'Visual Checkout (AI)' : 'Visual Checkout (AI)'}</span>
          </button>

          {/* TAB 3: PHONE CAMERA SCANNER (RECOMMENDED) */}
          <button
            onClick={() => setActiveTab('mobile')}
            className={`flex items-center gap-2 py-2.5 px-3.5 sm:px-4 font-bold text-xs border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'mobile'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-500" />
            <span>{language === 'vi' ? '📱 Kết Nối Điện Thoại (Khuyên dùng)' : '📱 Phone Camera Scanner'}</span>
            {isPhoneConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            )}
          </button>

          {/* TAB 4: SAMPLE TEST BARCODES */}
          <button
            onClick={() => setActiveTab('samples')}
            className={`flex items-center gap-2 py-2.5 px-3.5 sm:px-4 font-bold text-xs border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'samples'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Tag className="w-4 h-4 text-indigo-500" />
            <span>{language === 'vi' ? '🏷️ Mã Vạch Mẫu Để Test' : '🏷️ Sample Barcodes'}</span>
          </button>
        </div>

        {/* MODAL MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* TAB 4 CONTENT: SAMPLE TEST BARCODES */}
          {activeTab === 'samples' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-200">
                      Tem Mã Vạch Chuẩn (Code-128 & QR Code) Dùng Để Quét Thử
                    </h4>
                    <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 mt-0.5">
                      Dùng camera điện thoại hoặc camera máy tính chiếu thẳng vào các mã bên dưới để quét thử nghiệm!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('mobile')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mở màn hình kết nối điện thoại</span>
                  </button>
                </div>
              </div>

              {/* Grid of sample barcode tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.slice(0, 9).map((p) => (
                  <BarcodeTag
                    key={p.id}
                    product={p}
                    size="lg"
                    onSimulateScan={(code) => handleBarcodeDetected(code, 'Sample Tag')}
                  />
                ))}
              </div>
            </div>
          ) : activeTab === 'mobile' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT: QR CODE & CONNECTION INFO (6 Cols) */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-center space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {language === 'vi' ? 'Quét mã QR bằng Điện thoại' : 'Scan QR Code with Phone'}
                  </h4>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  {language === 'vi'
                    ? 'Dùng Camera thường hoặc ứng dụng Zalo trên iPhone/Android để quét mã này và bắt đầu quét mã vạch không dây.'
                    : 'Use iPhone/Android camera or Zalo to scan this QR code and start wireless barcode scanning.'}
                </p>

                {/* The QR Code Image Container */}
                <div className="p-3.5 bg-white rounded-2xl shadow-xl border-4 border-emerald-500/30 flex items-center justify-center">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="Scan to connect phone"
                      className="w-56 h-56 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                      <QrCode className="w-12 h-12 animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Session ID & Link */}
                <div className="w-full max-w-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 font-sans">Mã phiên:</span>
                    <strong className="text-blue-600 dark:text-blue-400 font-bold">{sessionId}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyLink}
                      className="flex-1 py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Đã chép link!' : 'Sao chép liên kết'}</span>
                    </button>

                    <button
                      onClick={() => window.open(companionUrl, '_blank')}
                      className="py-2 px-3 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                      title="Mở tab quét thử trên trình duyệt này"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Mở tab test</span>
                    </button>

                    <button
                      onClick={handleResetSession}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Tạo mã phiên mới"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT: LIVE STATUS & GUIDE & SESSION LOGS (6 Cols) */}
              <div className="lg:col-span-6 flex flex-col space-y-4">
                {/* Live Real-time Status Card */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isPhoneConnected
                      ? 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-100'
                      : 'border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20 text-amber-950 dark:text-amber-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {isPhoneConnected ? (
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                      )}
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm">
                          {isPhoneConnected
                            ? `🟢 Điện thoại đã kết nối (${phoneDeviceInfo})`
                            : '🟡 Đang chờ kết nối từ Điện thoại...'}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {isPhoneConnected
                            ? 'Camera điện thoại đang hoạt động. Mọi mã quét trên điện thoại sẽ tự động thêm vào giỏ hàng ngay lập tức!'
                            : 'Mở ứng dụng Camera trên điện thoại và quét mã QR ở bên trái để đồng bộ.'}
                        </p>
                      </div>
                    </div>
                    {isPhoneConnected && (
                      <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-xl text-xs font-bold">
                        Đã quét {phoneScannedCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* 4 Steps Guide */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>Hướng dẫn kết nối 4 bước cực nhanh:</span>
                  </h4>
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <p>
                        Mở ứng dụng <strong>Camera</strong> (trên iPhone / Android) hoặc mở <strong>Zalo</strong> bấm quét mã.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <p>
                        Hướng camera điện thoại vào <strong>Mã QR</strong> hiển thị trên màn hình máy tính.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        3
                      </span>
                      <p>
                        Nhấn vào liên kết để mở giao diện máy quét chuyên dụng trên điện thoại (không cần cài app).
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        4
                      </span>
                      <p>
                        Cầm điện thoại quét bất kỳ mã vạch nào — <strong>máy tính sẽ kêu "BÍP" và sản phẩm tự nhảy vào giỏ hàng</strong>!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Session Scanned Items Feed */}
                <div className="flex-1 flex flex-col min-h-[140px] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 mb-2">
                    <span className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Sản phẩm vừa nhận từ Điện thoại</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                        {scanHistory.length}
                      </span>
                    </span>
                    {scanHistory.length > 0 && (
                      <button
                        onClick={() => setScanHistory([])}
                        className="text-[11px] text-slate-400 hover:text-red-500 transition-colors"
                      >
                        Xóa
                      </button>
                    )}
                  </div>

                  {scanHistory.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 p-4">
                      <Smartphone className="w-6 h-6 mb-1 opacity-50" />
                      <p className="text-[11px]">
                        {language === 'vi'
                          ? 'Chưa có sản phẩm nào được quét. Hãy dùng điện thoại để bắt đầu quét!'
                          : 'No items scanned yet. Scan with your phone to see items appear here!'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-40">
                      {scanHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={item.product.image}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-xs truncate text-slate-900 dark:text-white">
                                {item.product.name}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono truncate">
                                {item.barcode} • {item.timestamp}
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                            {formatCurr(item.product.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* TAB 1 & 2 CONTENT: LOCAL PC CAMERA / AI VISUAL */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* LEFT: CAMERA VIEWFINDER & CONTROLS (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col space-y-3">
                {/* Viewfinder Container */}
                <div className="relative aspect-4/3 w-full bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-800 group">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Viewfinder Overlay HUD */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                    {/* Laser scan line (animated in barcode mode) */}
                    {activeTab === 'barcode' && (
                      <div className="w-4/5 max-w-xs h-44 sm:h-52 relative border-2 border-dashed border-blue-400/50 rounded-2xl flex items-center justify-center">
                        {/* Viewfinder Corners */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-xl -mt-1 -ml-1" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-xl -mt-1 -mr-1" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-xl -mb-1 -ml-1" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-xl -mb-1 -mr-1" />

                        {/* Red Scanning Laser */}
                        <div className="absolute w-full h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-bounce duration-1000" />

                        <span className="absolute -bottom-7 text-[11px] font-semibold text-white/90 bg-black/60 px-3 py-0.5 rounded-full backdrop-blur-xs">
                          {language === 'vi' ? 'Đặt mã vạch vào khung' : 'Align barcode in frame'}
                        </span>
                      </div>
                    )}

                    {/* Visual Mode Center Reticle */}
                    {activeTab === 'visual' && (
                      <div className="w-56 h-56 sm:w-64 sm:h-64 relative border-2 border-amber-400/60 rounded-3xl flex items-center justify-center bg-amber-500/5 backdrop-blur-[1px]">
                        <div className="w-12 h-12 rounded-full border-2 border-amber-400/70 border-t-transparent animate-spin" />
                        <span className="absolute -bottom-8 text-[11px] font-semibold text-white/90 bg-black/70 px-3 py-1 rounded-full backdrop-blur-xs">
                          {language === 'vi' ? 'Đặt sản phẩm vào chính giữa' : 'Center product in frame'}
                        </span>
                      </div>
                    )}

                    {/* Instant Success Flash Banner */}
                    {lastScanned && Date.now() - lastScanned.timestamp < 2200 && (
                      <div className="absolute top-4 inset-x-4 bg-emerald-600/95 text-white p-2.5 rounded-xl shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-200">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-200" />
                          <div className="truncate">
                            <p className="text-xs font-bold truncate">{lastScanned.product.name}</p>
                            <p className="text-[10px] text-emerald-100 font-mono">
                              +{formatCurr(lastScanned.product.price)} • Mã: {lastScanned.code}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold bg-white text-emerald-800 px-2 py-0.5 rounded-full flex-shrink-0">
                          +1 Đã vào giỏ
                        </span>
                      </div>
                    )}

                    {/* Unrecognized Barcode Alert */}
                    {unrecognizedCode && (
                      <div className="absolute top-4 inset-x-4 bg-amber-600/95 text-white p-2.5 rounded-xl shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-200">
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-200" />
                          <div className="truncate">
                            <p className="text-xs font-bold">{language === 'vi' ? 'Chưa có sản phẩm này' : 'Unrecognized Barcode'}</p>
                            <p className="text-[10px] text-amber-100 font-mono">Mã quét: {unrecognizedCode}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setUnrecognizedCode(null)}
                          className="text-[10px] font-bold bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg"
                        >
                          Bỏ qua
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tap to unblock Autoplay if browser blocked automatic video start */}
                  {!isVideoPlaying && !cameraError && (
                    <div
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.muted = true;
                          videoRef.current.play().then(() => setIsVideoPlaying(true)).catch(console.error);
                        }
                      }}
                      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs text-white p-4 cursor-pointer text-center"
                    >
                      <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center mb-3 shadow-xl animate-pulse">
                        <Play className="w-7 h-7 ml-1 text-white fill-white" />
                      </div>
                      <span className="text-sm font-bold">Chạm để bật Camera máy tính</span>
                      <span className="text-xs text-slate-300 mt-1 max-w-xs">
                        Trình duyệt yêu cầu xác nhận trước khi phát video camera trực tiếp
                      </span>
                    </div>
                  )}

                  {/* Fallback Screen if Camera error / denied */}
                  {cameraError && (
                    <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col items-center justify-center text-center text-white z-10 space-y-3">
                      <Camera className="w-10 h-10 text-slate-500" />
                      <p className="text-xs font-bold text-amber-300 max-w-sm">{cameraError}</p>
                      
                      {/* Suggested Action: Switch to Phone Camera */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveTab('mobile')}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Dùng Camera Điện thoại</span>
                        </button>

                        <button
                          onClick={startCamera}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Thử lại</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* CAMERA CONTROL BAR */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={flipCamera}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{facingMode === 'environment' ? 'Camera sau' : 'Camera trước'}</span>
                    </button>

                    <button
                      onClick={toggleTorch}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isTorchOn
                          ? 'bg-amber-400 text-amber-950 border-amber-500 font-bold'
                          : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Flash</span>
                    </button>

                    {activeTab === 'barcode' && (
                      <button
                        onClick={() => setContinuousScan((prev) => !prev)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          continuousScan
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                            : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <span>{continuousScan ? 'Quét liên tục: Bật' : 'Quét 1 lần'}</span>
                      </button>
                    )}
                  </div>

                  {activeTab === 'visual' && (
                    <button
                      disabled={isAnalyzingVisual}
                      onClick={captureAndAnalyzeVisual}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                    >
                      {isAnalyzingVisual ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>AI đang nhận diện...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Chụp & Nhận diện AI</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Helpful Phone Switch Banner */}
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Muốn dùng camera điện thoại cầm tay để quét mã linh hoạt hơn?</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('mobile')}
                    className="font-bold underline hover:text-emerald-950 dark:hover:text-white"
                  >
                    Kết nối ngay
                  </button>
                </div>
              </div>

              {/* RIGHT: RESULTS, AI RECOGNITION & SCAN HISTORY (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col space-y-4">
                {activeTab === 'visual' && (
                  <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-bold text-xs">
                        <Sparkles className="w-4 h-4" />
                        <span>{language === 'vi' ? 'Kết quả Nhận diện AI' : 'AI Recognition Result'}</span>
                      </div>
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoAddVisual}
                          onChange={(e) => setAutoAddVisual(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>Tự thêm vào giỏ</span>
                      </label>
                    </div>

                    {visualResult?.matchedProduct ? (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={visualResult.matchedProduct.image}
                            alt={visualResult.matchedProduct.name}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs sm:text-sm truncate text-slate-900 dark:text-white">
                              {visualResult.matchedProduct.name}
                            </p>
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                              {formatCurr(visualResult.matchedProduct.price)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-500 font-mono">
                                SKU: {visualResult.matchedProduct.sku || visualResult.matchedProduct.code}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                                {Math.round(visualResult.confidence * 100)}% khớp
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                          "{visualResult.description}"
                        </p>

                        <button
                          onClick={() => {
                            if (visualResult.matchedProduct) {
                              onAddToCart(visualResult.matchedProduct);
                              playCashierBeep();
                            }
                          }}
                          className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{language === 'vi' ? 'Thêm vào Giỏ Hàng' : 'Add to Cart'}</span>
                        </button>
                      </div>
                    ) : visualCapturedImage ? (
                      <div className="p-3 text-center text-xs text-slate-500">
                        {visualResult?.description || (language === 'vi' ? 'Đang phân tích...' : 'Analyzing...')}
                      </div>
                    ) : (
                      <div className="p-5 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-amber-300 dark:border-amber-900/60 rounded-xl">
                        <Eye className="w-6 h-6 mx-auto mb-1.5 text-amber-500/70" />
                        <span>{language === 'vi' ? 'Hướng camera vào sản phẩm và bấm "Chụp & Nhận diện AI"' : 'Point camera at product and click "Capture & AI Match"'}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Session Scanned Items Feed */}
                <div className="flex-1 flex flex-col min-h-[160px] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 mb-2">
                    <span className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
                      <span>{language === 'vi' ? 'Lịch sử quét phiên này' : 'Session Scan Log'}</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold">
                        {scanHistory.length}
                      </span>
                    </span>
                    {scanHistory.length > 0 && (
                      <button
                        onClick={() => setScanHistory([])}
                        className="text-[11px] text-slate-400 hover:text-red-500 transition-colors"
                      >
                        Xóa
                      </button>
                    )}
                  </div>

                  {scanHistory.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 p-4">
                      <ScanLine className="w-6 h-6 mb-1 opacity-50" />
                      <p className="text-[11px]">
                        {language === 'vi'
                          ? 'Chưa có sản phẩm nào được quét trong phiên này.'
                          : 'No items scanned in this session yet.'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-44">
                      {scanHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={item.product.image}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-xs truncate text-slate-900 dark:text-white">
                                {item.product.name}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono truncate">
                                {item.barcode} • {item.timestamp}
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-xs text-blue-600 dark:text-blue-400 flex-shrink-0">
                            {formatCurr(item.product.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* BARCODE TEST SIMULATOR */}
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{language === 'vi' ? '⚡ Bấm thử mã vạch (Test Barcode)' : '⚡ Quick Barcode Simulator'}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Click để quét thử</span>
                  </div>

                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchSimText}
                      onChange={(e) => setSearchSimText(e.target.value)}
                      placeholder={language === 'vi' ? 'Tìm mã SKU/Barcode test...' : 'Search test barcode...'}
                      className="w-full pl-7 pr-2.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-0.5">
                    {simulatorProducts.map((p) => {
                      const barcodeCode = p.sku || p.code;
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleBarcodeDetected(barcodeCode, 'Simulator')}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/60 dark:bg-slate-800/40 text-left transition-colors flex items-center justify-between gap-1 group active:scale-95"
                          title={`Bấm để quét mã ${barcodeCode} (${p.name})`}
                        >
                          <div className="min-w-0 truncate">
                            <p className="font-semibold text-[11px] truncate text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                              {p.name}
                            </p>
                            <p className="text-[9px] font-mono text-slate-400 truncate">{barcodeCode}</p>
                          </div>
                          <Plus className="w-3 h-3 text-slate-400 group-hover:text-emerald-500 flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>
              {activeTab === 'mobile'
                ? isPhoneConnected
                  ? 'Điện thoại đang kết nối với quầy thu ngân theo thời gian thực'
                  : 'Hãy quét mã QR để bắt đầu quét hàng bằng điện thoại'
                : language === 'vi'
                ? 'Camera & Trí tuệ nhân tạo đang sẵn sàng nhận diện trực tiếp'
                : 'Camera & Vision engine ready for live checkout'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
          >
            {language === 'vi' ? 'Hoàn tất & Quay lại POS' : 'Done & Return to POS'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScannerModal;
