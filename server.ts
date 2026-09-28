import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { randomInt, randomBytes } from "crypto";

// Bộ bảo vệ chống sập tiến trình đột ngột (Crash Guard)
process.on("uncaughtException", (err) => {
  console.error("[SmartShop Server] Bắt lỗi ngoại lệ chưa xử lý (Uncaught Exception):", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[SmartShop Server] Bắt promise bị từ chối chưa xử lý (Unhandled Rejection):", reason);
});
import * as nodemailer from "nodemailer";
import {
  addStoreProduct,
  addStoreStaff,
  checkoutStoreOrder,
  cleanExpiredStoreSessions,
  clearBusinessData,
  createReturnRecord,
  createStoreSession,
  createWarrantyClaim,
  deleteStoreProduct,
  deleteStoreSession,
  deleteStoreStaff,
  getStoreSession,
  getStoreState,
  replaceStoreState,
  receiveRestockOrder,
  restockStoreProduct,
  updateStoreProduct,
  updateStoreStaff,
} from "./src/server/store";
import { StaffUser } from "./src/types";

dotenv.config();

function createMailTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!user || !pass) return null;

  const isGmail =
    (process.env.SMTP_HOST && process.env.SMTP_HOST.includes("gmail")) ||
    user.includes("@gmail.com");

  if (isGmail) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000,
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "localhost",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
  });
}

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Chuỗi model Gemini theo thứ tự ưu tiên. Mỗi model có hạn mức (lượt hỏi/phút, /ngày) riêng,
// nên khi model đầu hết lượt hoặc quá tải, hệ thống tự chuyển sang model kế tiếp.
// Có thể đổi bằng biến môi trường: GEMINI_MODELS="gemini-3.6-flash,gemini-3.5-flash-lite"
const DEFAULT_GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-flash-lite-latest",
];
const GEMINI_MODELS = (process.env.GEMINI_MODELS || "")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const geminiModelChain = GEMINI_MODELS.length > 0 ? GEMINI_MODELS : DEFAULT_GEMINI_MODELS;

// Model đang tạm ngưng dùng (hết lượt / quá tải) -> thời điểm được thử lại
const geminiModelCooldowns = new Map<string, { until: number; reason: string }>();

// Hạn mức theo ngày của Gemini API được đặt lại lúc 0h giờ Thái Bình Dương (Mỹ)
function nextPacificMidnight(now: number): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      hour12: false,
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })
      .formatToParts(new Date(now))
      .map((p) => [p.type, p.value])
  );
  const secondsSinceMidnight = (Number(parts.hour) % 24) * 3600 + Number(parts.minute) * 60 + Number(parts.second);
  return now + (86400 - secondsSinceMidnight) * 1000;
}

function getGeminiCooldown(err: any): { until: number; reason: string } | null {
  const status = Number(err?.status) || 0;
  const text = String(err?.message || "");
  const now = Date.now();

  if (status === 429 || text.includes("RESOURCE_EXHAUSTED")) {
    if (/PerDay/i.test(text)) {
      return { until: nextPacificMidnight(now), reason: "Hết lượt hỏi trong ngày" };
    }
    const retryDelay = text.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/);
    return { until: now + Math.ceil(retryDelay ? Number(retryDelay[1]) : 60) * 1000, reason: "Hết lượt hỏi trong phút" };
  }
  if (status === 404) return { until: now + 24 * 3600 * 1000, reason: "Model không khả dụng với API key này" };
  if (status >= 500 || text.startsWith("Timeout after")) return { until: now + 60 * 1000, reason: "Model đang quá tải" };
  return null;
}

function getGeminiStatus() {
  const now = Date.now();
  const models = geminiModelChain.map((model) => {
    const cooldown = geminiModelCooldowns.get(model);
    const blocked = !!cooldown && cooldown.until > now;
    return {
      model,
      available: !blocked,
      reason: blocked ? cooldown!.reason : null,
      retryAt: blocked ? new Date(cooldown!.until).toISOString() : null,
    };
  });
  return {
    primaryModel: geminiModelChain[0],
    activeModel: models.find((m) => m.available)?.model || null,
    models,
  };
}

async function callGeminiWithTimeout(params: {
  contents: any;
  config?: any;
  timeoutMs?: number;
}): Promise<{ text: string; modelUsed: string }> {
  const ai = getGenAI();
  if (!ai) throw new Error("GEMINI_API_KEY is not configured.");

  const timeoutMs = params.timeoutMs || 12000;
  const candidates = geminiModelChain.filter((model) => (geminiModelCooldowns.get(model)?.until || 0) <= Date.now());
  if (candidates.length === 0) {
    throw new Error("Tất cả các model Gemini đều đã hết lượt hoặc đang quá tải.");
  }

  for (const model of candidates) {
    let timer: any = null;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms on model ${model}`)), timeoutMs);
      });

      const generatePromise = ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });

      const response: any = await Promise.race([generatePromise, timeoutPromise]);
      const text = response?.text || "";
      if (text) {
        geminiModelCooldowns.delete(model);
        return { text, modelUsed: model };
      }
    } catch (err: any) {
      const cooldown = getGeminiCooldown(err);
      if (cooldown) {
        geminiModelCooldowns.set(model, cooldown);
        console.warn(
          `[SmartShop AI] ${model}: ${cooldown.reason} -> tạm ngưng đến ${new Date(cooldown.until).toLocaleString("vi-VN")}, chuyển sang model kế tiếp.`,
          String(err?.message || "").slice(0, 200)
        );
      } else {
        console.warn(`[SmartShop AI] Model ${model} attempt failed:`, err?.message || err?.status || err);
      }
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  throw new Error("Tất cả các model Gemini đều không phản hồi hoặc đã hết thời gian chờ.");
}

// Chuyển lịch sử chat từ frontend sang định dạng hội thoại nhiều lượt của Gemini để AI nhớ ngữ cảnh.
// Hỗ trợ cả { sender: 'user' | 'ai' } (Trợ lý AI) và { role: 'user' | 'model' } (AI Investment Strategist).
function buildGeminiHistory(history: unknown, currentMessage: string, maxMessages = 20) {
  if (!Array.isArray(history)) return [];

  let items = history.filter((m: any) => m && typeof m.text === "string" && m.text.trim());
  const last: any = items[items.length - 1];
  if (last && (last.sender === "user" || last.role === "user") && last.text === currentMessage) {
    items = items.slice(0, -1); // Câu hỏi hiện tại được gửi riêng (kèm ảnh nếu có)
  }

  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];
  for (const m of items.slice(-maxMessages) as any[]) {
    const role = m.sender === "user" || m.role === "user" ? "user" : "model";
    if (contents.length === 0 && role === "model") continue; // Hội thoại phải bắt đầu bằng lượt của người dùng
    const text = m.text.slice(0, 4000);
    const prev = contents[contents.length - 1];
    if (prev && prev.role === role) prev.parts[0].text += `\n\n${text}`;
    else contents.push({ role, parts: [{ text }] });
  }
  return contents;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: "10mb" }));

  // Clean expired SQLite sessions on boot & schedule hourly cleanup
  try {
    const cleaned = cleanExpiredStoreSessions();
    if (cleaned > 0) console.log(`[SmartShop Auth] Cleaned ${cleaned} expired sessions on startup.`);
  } catch (e) {}
  setInterval(() => {
    try {
      cleanExpiredStoreSessions();
    } catch (e) {}
  }, 60 * 60 * 1000);

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ==========================================
  // WIRELESS MOBILE SCANNER SESSION & SSE HUB
  // ==========================================
  interface ScannerSession {
    id: string;
    createdAt: number;
    lastActiveAt: number;
    clients: express.Response[];
    phoneConnected: boolean;
    lastScannedCode?: string;
    lastScannedTime?: number;
  }

  const scannerSessions = new Map<string, ScannerSession>();

  // Cleanup inactive scanner sessions older than 3 hours
  setInterval(() => {
    const now = Date.now();
    for (const [id, session] of scannerSessions.entries()) {
      if (now - session.lastActiveAt > 3 * 3600 * 1000) {
        session.clients.forEach((c) => {
          try {
            c.end();
          } catch (_) {}
        });
        scannerSessions.delete(id);
      }
    }
  }, 15 * 60 * 1000);

  // Create new session or verify session ID
  app.post("/api/scanner/session/create", (req, res) => {
    const requestedId = req.body?.sessionId;
    const sessionId = requestedId && typeof requestedId === "string" && requestedId.trim().length >= 4
      ? requestedId.trim()
      : `POS-${Math.floor(1000 + Math.random() * 9000)}`;

    let session = scannerSessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        clients: [],
        phoneConnected: false,
      };
      scannerSessions.set(sessionId, session);
    }
    res.json({ success: true, sessionId });
  });

  // SSE Stream for PC to receive scans from phone
  app.get("/api/scanner/session/:id/events", (req, res) => {
    const sessionId = req.params.id;
    let session = scannerSessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        clients: [],
        phoneConnected: false,
      };
      scannerSessions.set(sessionId, session);
    }

    session.lastActiveAt = Date.now();

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*",
    });

    session.clients.push(res);

    // Initial state event
    res.write(
      `data: ${JSON.stringify({
        type: "init",
        sessionId,
        phoneConnected: session.phoneConnected,
      })}\n\n`
    );

    // Heartbeat every 20 seconds
    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat\n\n`);
      } catch (e) {
        clearInterval(heartbeat);
      }
    }, 20000);

    req.on("close", () => {
      clearInterval(heartbeat);
      if (session) {
        session.clients = session.clients.filter((c) => c !== res);
      }
    });
  });

  // Phone joins the session
  app.post("/api/scanner/session/:id/join", (req, res) => {
    const sessionId = req.params.id;
    let session = scannerSessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        clients: [],
        phoneConnected: true,
      };
      scannerSessions.set(sessionId, session);
    } else {
      session.phoneConnected = true;
      session.lastActiveAt = Date.now();
    }

    // Notify connected PC screens via SSE
    const payload = JSON.stringify({
      type: "phone_connected",
      deviceInfo: req.body?.deviceInfo || "Smartphone Camera",
      timestamp: Date.now(),
    });

    session.clients.forEach((client) => {
      try {
        client.write(`data: ${payload}\n\n`);
      } catch (e) {}
    });

    res.json({ success: true, sessionId, phoneConnected: true });
  });

  // Phone sends scanned barcode
  app.post("/api/scanner/session/:id/scan", (req, res) => {
    const sessionId = req.params.id;
    const barcode = req.body?.barcode;
    if (!barcode) {
      return res.status(400).json({ error: "Barcode is required" });
    }

    const cleanBarcode = String(barcode).trim();
    let session = scannerSessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        clients: [],
        phoneConnected: true,
      };
      scannerSessions.set(sessionId, session);
    }

    session.lastActiveAt = Date.now();

    // Prevent duplicate broadcast of identical barcode within 2200ms
    if (session.lastScannedCode === cleanBarcode && Date.now() - (session.lastScannedTime || 0) < 2200) {
      return res.json({ success: true, duplicate: true, barcode: cleanBarcode });
    }
    session.lastScannedCode = cleanBarcode;
    session.lastScannedTime = Date.now();

    // Broadcast barcode to PC POS screen(s)
    const payload = JSON.stringify({
      type: "barcode_scanned",
      barcode: cleanBarcode,
      timestamp: Date.now(),
      format: req.body?.format || "auto",
    });

    session.clients.forEach((client) => {
      try {
        client.write(`data: ${payload}\n\n`);
      } catch (e) {}
    });

    res.json({ success: true, barcode: cleanBarcode });
  });

  // Check session status
  app.get("/api/scanner/session/:id/status", (req, res) => {
    const session = scannerSessions.get(req.params.id);
    res.json({
      exists: !!session,
      phoneConnected: session?.phoneConnected || false,
      clientsCount: session?.clients.length || 0,
    });
  });

  // ==========================================
  // EMAIL AUTHENTICATION & VERIFICATION CODES
  // ==========================================
  interface VerificationEntry {
    email: string;
    code: string;
    expiresAt: number;
    attempts: number;
  }
  const verificationStore = new Map<string, VerificationEntry>();

  interface FacePendingEntry {
    email: string;
    user: StaffUser;
    expiresAt: number;
  }
  const facePendingStore = new Map<string, FacePendingEntry>();

  // Send verification code to email
  app.post("/api/auth/send-verification-code", async (req, res) => {
    const email = req.body?.email ? String(req.body.email).trim().toLowerCase() : "";
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Email không hợp lệ. Vui lòng nhập đúng định dạng email." });
    }

    const staff = getStoreState().staffList.find((candidate) => candidate.email.toLowerCase() === email);
    if (!staff || staff.status !== "active") {
      return res.status(403).json({ error: "Email không thuộc tài khoản nhân sự đang hoạt động." });
    }

    // TÀI KHOẢN TESTER: Tự động cấp mã 123456 không cần gửi email
    const isTester = staff.id === "user-tester" || email === "tester@smartsale.ai";
    if (isTester) {
      const code = "123456";
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      verificationStore.set(email, { email, code, expiresAt, attempts: 0 });
      return res.json({
        success: true,
        message: "Tài khoản Tester: Mã xác thực là 123456 (Bỏ qua Face ID)",
        email,
        expiresInSeconds: 86400,
        devCode: code,
        isTester: true,
      });
    }

    const code = randomInt(100000, 1000000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    const isDev = process.env.NODE_ENV !== "production" || process.env.ALLOW_DEV_OTP_LOG !== "false";
    try {
      if (isDev) {
        console.log(`[SmartShop Auth][DEV] Verification code for ${email}: ${code}`);
      }

      const mailTransporter = createMailTransporter();
      if (mailTransporter) {
        try {
          const mailResult = await mailTransporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject: `[SmartShop] Mã xác thực đăng nhập: ${code}`,
            text: `Mã xác thực SmartShop của bạn là: ${code}\n\nMã có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.\nNếu không thấy trong Hộp thư đến, vui lòng kiểm tra thư mục Thư rác (Spam/Junk).\n\nTrân trọng,\nĐội ngũ SmartShop POS & AI`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h1 style="color: #2563eb; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">SmartShop POS & AI</h1>
                  <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Hệ thống Quản lý Bán hàng Điện tử Thông minh</p>
                </div>
                <div style="padding: 24px; background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; text-align: center;">
                  <p style="color: #475569; font-size: 14px; margin: 0 0 16px; font-weight: 500;">Mã xác thực đăng nhập bảo mật của bạn là:</p>
                  <div style="display: inline-block; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #1d4ed8; background: #ffffff; padding: 14px 28px; border: 2px dashed #93c5fd; border-radius: 10px; box-shadow: 0 2px 8px rgba(37,99,235,0.08);">
                    ${code}
                  </div>
                  <p style="color: #64748b; font-size: 12px; margin: 16px 0 0;">Mã có hiệu lực trong vòng <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
                </div>
                <div style="margin-top: 20px; padding: 12px 16px; background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; font-size: 12px; color: #854d0e; text-align: left;">
                  <strong>Lưu ý quan trọng:</strong> Nếu bạn không tìm thấy email này trong Hộp thư đến (Inbox), vui lòng kiểm tra thêm thư mục <strong>Thư rác (Spam / Junk)</strong> hoặc tab <strong>Quảng cáo / Cập nhật</strong> của ứng dụng email.
                </div>
                <div style="margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                  Email này được gửi tự động từ hệ thống SmartShop. Nếu bạn không yêu cầu đăng nhập, hãy bỏ qua email này.
                </div>
              </div>
            `,
          });
          console.log(`[SmartShop Auth] Email sent successfully to ${email}. MessageId: ${mailResult.messageId}, Response: ${mailResult.response}`);
        } finally {
          try {
            mailTransporter.close();
          } catch (_) {}
        }
      } else if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_OTP_LOG === "false") {
        return res.status(503).json({ error: "Chưa cấu hình dịch vụ email OTP." });
      }
    } catch (error) {
      console.error("OTP email delivery failed:", error);
      if (process.env.NODE_ENV === "production") {
        return res.status(502).json({ error: "Không thể gửi email OTP." });
      }
    }

    verificationStore.set(email, { email, code, expiresAt, attempts: 0 });

    res.json({
      success: true,
      message: `Mã xác thực đã được gửi đến ${email}`,
      email,
      expiresInSeconds: 300,
      ...(isDev ? { devCode: code } : {}),
    });
  });

  // Quick 1-Click Tester Login (Bypasses OTP and Face ID completely)
  app.post("/api/auth/quick-tester-login", (req, res) => {
    const staff = getStoreState().staffList.find(
      (candidate) => candidate.id === "user-tester" || candidate.email.toLowerCase() === "tester@smartsale.ai"
    );
    if (!staff || staff.status !== "active") {
      return res.status(404).json({ error: "Không tìm thấy tài khoản Tester." });
    }

    const sessionToken = randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days validity
    createStoreSession(
      sessionToken,
      staff.email,
      expiresAt,
      typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
      req.ip
    );

    res.json({
      success: true,
      requireFace: false,
      message: "Đăng nhập Tester thành công! Bỏ qua xác thực OTP và Face ID.",
      email: staff.email,
      sessionToken,
      user: staff,
    });
  });

  // Public candidate list for quick login presets
  app.get("/api/auth/staff-candidates", (req, res) => {
    const staffList = getStoreState().staffList
      .filter((s) => s.status === "active")
      .map(({ id, name, email, role, branch }) => ({ id, name, email, role, branch }));
    res.json({ success: true, staffList });
  });

  // Verify submitted code
  app.post("/api/auth/verify-code", (req, res) => {
    const email = req.body?.email ? String(req.body.email).trim().toLowerCase() : "";
    const submittedCode = req.body?.code ? String(req.body.code).trim() : "";

    if (!email || !submittedCode) {
      return res.status(400).json({ error: "Thiếu thông tin email hoặc mã xác thực." });
    }

    const staff = getStoreState().staffList.find((candidate) => candidate.email.toLowerCase() === email);
    if (!staff || staff.status !== "active") {
      verificationStore.delete(email);
      return res.status(403).json({ error: "Tài khoản nhân sự không còn hoạt động." });
    }

    const isTester = staff.id === "user-tester" || email === "tester@smartsale.ai";

    if (!isTester) {
      const entry = verificationStore.get(email);
      if (!entry) {
        return res.status(400).json({
          error: "Chưa có mã xác thực nào được gửi cho email này hoặc mã đã hết hạn. Vui lòng nhấn gửi lại mã.",
        });
      }

      if (Date.now() > entry.expiresAt) {
        verificationStore.delete(email);
        return res.status(400).json({ error: "Mã xác thực đã hết hạn. Vui lòng gửi lại mã mới." });
      }

      entry.attempts += 1;
      if (entry.attempts > 5) {
        verificationStore.delete(email);
        return res.status(400).json({ error: "Bạn đã nhập sai quá 5 lần. Vui lòng yêu cầu mã xác thực mới." });
      }

      if (entry.code !== submittedCode) {
        return res.status(400).json({
          error: "Mã xác thực không chính xác. Vui lòng kiểm tra lại 6 chữ số.",
        });
      }
    }

    verificationStore.delete(email);

    // CHỈ TÀI KHOẢN ADMIN VÀ MANAGER MỚI CẦN XÁC THỰC KHUÔN MẶT (BỎ QUA HOÀN TOÀN CHO TESTER)
    const isFaceRequired = !isTester && (staff.faceRequired || staff.role === "admin" || staff.role === "manager");
    if (isFaceRequired) {
      const tempToken = randomBytes(24).toString("hex");
      facePendingStore.set(tempToken, {
        email,
        user: staff,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes to complete face scan
      });

      return res.json({
        success: true,
        requireFace: true,
        tempToken,
        user: staff,
        message: "Xác thực mã OTP thành công. Vui lòng quét khuôn mặt để hoàn tất đăng nhập bảo mật.",
      });
    }

    // ĐĂNG NHẬP NGAY LẬP TỨC (BỎ QUA FACE ID CHO TESTER VÀ THU NGÂN / THỦ KHO)
    const sessionToken = randomBytes(32).toString("hex");
    const expiresAt = isTester
      ? Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days validity for tester
      : Date.now() + 8 * 60 * 60 * 1000; // 8 hours validity
    createStoreSession(
      sessionToken,
      email,
      expiresAt,
      typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
      req.ip
    );

    res.json({
      success: true,
      requireFace: false,
      message: isTester ? "Đăng nhập Tester thành công! Bỏ qua OTP và Face ID." : "Xác thực email thành công.",
      email,
      sessionToken,
      user: staff,
    });
  });

  // Verify Face ID via Python FastAPI service
  app.post("/api/auth/verify-face", async (req, res) => {
    const tempToken = req.body?.tempToken ? String(req.body.tempToken).trim() : "";
    const email = req.body?.email ? String(req.body.email).trim().toLowerCase() : "";
    const image = req.body?.image ? String(req.body.image) : "";

    if (!image) {
      return res.status(400).json({ error: "Thiếu dữ liệu hình ảnh từ camera." });
    }

    let pending = tempToken ? facePendingStore.get(tempToken) : null;
    if (!pending && email) {
      for (const [t, p] of facePendingStore.entries()) {
        if (p.email.toLowerCase() === email && Date.now() < p.expiresAt) {
          pending = p;
          break;
        }
      }
    }

    const staff = pending?.user || getStoreState().staffList.find((s) => s.email.toLowerCase() === email);
    if (!staff || staff.status !== "active") {
      return res.status(403).json({ error: "Phiên xác thực đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại." });
    }

    try {
      // Gửi request sang Python FastAPI service (cổng 8000)
      const cvRes = await fetch("http://127.0.0.1:8000/api/cv/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image,
          role: staff.role,
          email: staff.email,
        }),
      });

      if (!cvRes.ok) {
        const errData = (await cvRes.json().catch(() => ({}))) as any;
        return res.status(400).json({
          success: false,
          error: errData.detail || "Không thể xử lý nhận diện khuôn mặt.",
        });
      }

      const cvData = (await cvRes.json()) as any;
      if (cvData.hasFace === false) {
        return res.status(400).json({
          success: false,
          error: cvData.error || "Không tìm thấy khuôn mặt trong khung hình.",
          details: cvData,
        });
      }

      if (!cvData.matched) {
        return res.status(401).json({
          success: false,
          error: cvData.message || `Khuôn mặt không khớp với hồ sơ ${staff.name}. Độ tương đồng: ${cvData.similarityPercent}%.`,
          details: cvData,
        });
      }

      // Xác thực khớp thành công! Tạo phiên đăng nhập chính thức
      if (tempToken) {
        facePendingStore.delete(tempToken);
      }
      const sessionToken = randomBytes(32).toString("hex");
      const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
      createStoreSession(
        sessionToken,
        staff.email,
        expiresAt,
        typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
        req.ip
      );

      return res.json({
        success: true,
        message: cvData.message || `Xác thực khuôn mặt ${staff.name} thành công!`,
        sessionToken,
        user: staff,
        matchDetails: cvData,
      });
    } catch (err: any) {
      console.error("[Face Auth Service Error]", err);
      return res.status(502).json({
        error: "Dịch vụ nhận diện khuôn mặt (Python CV Service) chưa được khởi chạy hoặc không phản hồi.",
        hint: "Vui lòng khởi động Python service tại http://127.0.0.1:8000 (chạy lệnh: python cv_service/server.py)",
      });
    }
  });

  // Check Python CV Service Status & Enrolled Profiles
  app.get("/api/auth/cv-status", async (req, res) => {
    try {
      const cvRes = await fetch("http://127.0.0.1:8000/api/cv/health", { signal: AbortSignal.timeout(3000) });
      if (cvRes.ok) {
        const data = await cvRes.json();
        return res.json({ online: true, ...data });
      }
      return res.json({ online: false, error: "Dịch vụ Python phản hồi mã lỗi " + cvRes.status });
    } catch (e: any) {
      return res.json({ online: false, error: e.message || "Không thể kết nối Python CV service" });
    }
  });

  // Real-time Live Tracking & Name Recognition endpoint
  app.post("/api/auth/track-face", async (req, res) => {
    const image = req.body?.image ? String(req.body.image) : "";
    const email = req.body?.email ? String(req.body.email) : "";
    const role = req.body?.role ? String(req.body.role) : "";

    if (!image) {
      return res.json({ hasFace: false });
    }

    try {
      const cvRes = await fetch("http://127.0.0.1:8000/api/cv/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, email, role }),
        signal: AbortSignal.timeout(4000),
      });

      if (!cvRes.ok) {
        return res.json({ hasFace: false });
      }

      const data = await cvRes.json();
      return res.json(data);
    } catch (_) {
      return res.json({ hasFace: false });
    }
  });

  app.get("/api/auth/session", (req, res) => {
    const token = typeof req.headers.authorization === "string"
      ? req.headers.authorization.replace(/^Bearer\s+/i, "").trim()
      : "";
    if (!token) return res.status(401).json({ error: "Chưa cung cấp mã phiên đăng nhập." });

    const session = getStoreSession(token);
    if (!session) {
      return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
    }

    const user = getStoreState().staffList.find((candidate) => candidate.email.toLowerCase() === session.email);
    if (!user || user.status !== "active") {
      deleteStoreSession(token);
      return res.status(401).json({ error: "Tài khoản không còn hoạt động." });
    }

    res.json({ success: true, user });
  });

  app.post("/api/auth/logout", (req, res) => {
    const token = typeof req.headers.authorization === "string"
      ? req.headers.authorization.replace(/^Bearer\s+/i, "").trim()
      : "";
    if (token) deleteStoreSession(token);
    res.json({ success: true, message: "Đã đăng xuất tài khoản thành công." });
  });

  function getAuthenticatedSession(req: express.Request) {
    const token = typeof req.headers.authorization === "string"
      ? req.headers.authorization.replace(/^Bearer\s+/i, "").trim()
      : "";
    if (!token) return null;

    const session = getStoreSession(token);
    if (!session) return null;

    const user = getStoreState().staffList.find((candidate) => candidate.email.toLowerCase() === session.email);
    return user?.status === "active" ? { token, user } : null;
  }

  app.get("/api/store/state", (req, res) => {
    if (!getAuthenticatedSession(req)) {
      return res.status(401).json({ error: "Bạn cần đăng nhập để truy cập dữ liệu cửa hàng." });
    }
    res.json({ success: true, state: getStoreState() });
  });

  app.post("/api/store/permissions/audit", (req, res) => {
    const session = getAuthenticatedSession(req);
    if (!session) return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
    if (session.user.role !== 'admin') return res.status(403).json({ error: "Chỉ Admin mới được thay đổi phân quyền." });

    const { action, changedRoles = [], changedModules = [] } = req.body || {};
    if (action !== 'update' && action !== 'reset') return res.status(400).json({ error: "Loại thay đổi phân quyền không hợp lệ." });
    const state = getStoreState();
    const entry = {
      id: `permission-audit-${Date.now()}`,
      actorId: session.user.id,
      actorName: session.user.name,
      action,
      changedRoles: Array.isArray(changedRoles) ? changedRoles : [],
      changedModules: Array.isArray(changedModules) ? changedModules : [],
      createdAt: new Date().toISOString(),
    } as const;
    state.permissionAuditHistory = [entry, ...state.permissionAuditHistory].slice(0, 500);
    replaceStoreState(state);
    res.json({ success: true, entry, history: state.permissionAuditHistory });
  });

  app.post("/api/store/staff/audit", (req, res) => {
    const session = getAuthenticatedSession(req);
    if (!session) return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
    if (session.user.role !== 'admin') return res.status(403).json({ error: "Chỉ Admin mới được ghi lịch sử quản lý nhân viên." });
    const { action, targetId, targetName, details } = req.body || {};
    const allowedActions = ['create', 'update', 'activate', 'deactivate', 'delete', 'permission_update', 'permission_reset', 'impersonate'];
    if (!allowedActions.includes(action)) return res.status(400).json({ error: "Thao tác nhân viên không hợp lệ." });
    try {
      const state = getStoreState();
      const entry = {
        id: `staff-audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        actorId: session.user.id,
        actorName: session.user.name,
        action,
        targetId,
        targetName,
        details,
        createdAt: new Date().toISOString(),
      };
      state.staffAuditHistory = [entry, ...state.staffAuditHistory].slice(0, 1000);
      replaceStoreState(state);
      res.json({ success: true, entry, history: state.staffAuditHistory });
    } catch (error) {
      console.error('Staff audit write failed:', error);
      res.status(500).json({ error: 'Không thể ghi lịch sử thao tác vào cơ sở dữ liệu.' });
    }
  });

  // Staff Management CRUD Endpoints (Admin only)
  app.post("/api/store/staff", (req, res) => {
    const session = getAuthenticatedSession(req);
    if (!session) return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
    if (session.user.role !== 'admin') return res.status(403).json({ error: "Chỉ Admin mới có quyền thêm nhân sự mới." });
    try {
      const result = addStoreStaff(req.body || {});
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Không thể thêm nhân sự." });
    }
  });

  app.put("/api/store/staff/:id", (req, res) => {
    const session = getAuthenticatedSession(req);
    if (!session) return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
    if (session.user.role !== 'admin') return res.status(403).json({ error: "Chỉ Admin mới có quyền cập nhật nhân sự." });
    try {
      const state = updateStoreStaff({ ...req.body, id: req.params.id });
      res.json({ success: true, state });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Không thể cập nhật nhân sự." });
    }
  });

  app.delete("/api/store/staff/:id", (req, res) => {
    const session = getAuthenticatedSession(req);
    if (!session) return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
    if (session.user.role !== 'admin') return res.status(403).json({ error: "Chỉ Admin mới có quyền xóa tài khoản nhân sự." });
    try {
      const state = deleteStoreStaff(req.params.id);
      res.json({ success: true, state });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Không thể xóa nhân sự." });
    }
  });

  // Product Management CRUD Endpoints (Admin & Manager only)
  app.post("/api/store/products", (req, res) => {
    const session = getAuthenticatedSession(req);
    if (!session) return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
    if (!['admin', 'manager'].includes(session.user.role)) {
      return res.status(403).json({ error: "Chỉ Quản trị viên (Admin) và Quản lý (Manager) mới có quyền thêm sản phẩm." });
    }
    try {
      const result = addStoreProduct(req.body || {});
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Không thể thêm sản phẩm." });
    }
  });

  app.put("/api/store/products/:id", (req, res) => {
    const session = getAuthenticatedSession(req);
    if (!session) return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
    if (!['admin', 'manager'].includes(session.user.role)) {
      return res.status(403).json({ error: "Chỉ Quản trị viên (Admin) và Quản lý (Manager) mới có quyền cập nhật sản phẩm." });
    }
    try {
      const state = updateStoreProduct({ ...req.body, id: req.params.id });
      res.json({ success: true, state });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Không thể cập nhật sản phẩm." });
    }
  });

  app.delete("/api/store/products/:id", (req, res) => {
    const session = getAuthenticatedSession(req);
    if (!session) return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
    if (!['admin', 'manager'].includes(session.user.role)) {
      return res.status(403).json({ error: "Chỉ Quản trị viên (Admin) và Quản lý (Manager) mới có quyền xóa sản phẩm." });
    }
    try {
      const state = deleteStoreProduct(req.params.id);
      res.json({ success: true, state });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Không thể xóa sản phẩm." });
    }
  });

  app.post("/api/store/real-mode/reset", (req, res) => {
    const session = getAuthenticatedSession(req);
    if (!session) return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
    if (session.user.role !== 'admin') return res.status(403).json({ error: "Chỉ Admin mới có thể chuyển cửa hàng sang dữ liệu thật." });
    res.json({ success: true, state: clearBusinessData() });
  });

  app.post("/api/store/checkout", (req, res) => {
    const session = getAuthenticatedSession(req);
    if (!session) return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });

    try {
      const result = checkoutStoreOrder({
        items: req.body?.items,
        customerId: req.body?.customerId,
        paymentMethod: req.body?.paymentMethod,
        voucherCode: req.body?.voucherCode,
        cashier: session.user.name,
      });
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(409).json({ error: error instanceof Error ? error.message : "Không thể hoàn tất thanh toán." });
    }
  });

  app.post("/api/store/restock", (req, res) => {
    const session = getAuthenticatedSession(req);
    if (!session) return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
    if (!['admin', 'manager', 'inventory_staff'].includes(session.user.role)) {
      return res.status(403).json({ error: "Bạn không có quyền nhập kho." });
    }

    try {
      const state = restockStoreProduct({
        productId: req.body?.productId,
        quantity: req.body?.quantity,
        branch: req.body?.branch || session.user.branch,
        receiveNow: req.body?.receiveNow === true,
      });
      res.json({ success: true, state });
    } catch (error) {
      res.status(409).json({ error: error instanceof Error ? error.message : "Không thể nhập kho." });
    }
  });

  app.post("/api/store/restock/:id/receive", (req, res) => {
    const session = getAuthenticatedSession(req);
    if (!session) return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
    if (!['admin', 'manager', 'inventory_staff'].includes(session.user.role)) return res.status(403).json({ error: "Bạn không có quyền nhận hàng." });
    try {
      res.json({ success: true, state: receiveRestockOrder(req.params.id) });
    } catch (error) {
      res.status(409).json({ error: error instanceof Error ? error.message : "Không thể nhận hàng." });
    }
  });

  app.post("/api/store/returns", (req, res) => {
    const session = getAuthenticatedSession(req);
    if (!session) return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
    if (!['admin', 'manager', 'cashier'].includes(session.user.role)) return res.status(403).json({ error: "Bạn không có quyền xử lý trả hàng." });
    try {
      res.json({ success: true, state: createReturnRecord({ orderId: req.body?.orderId, reason: req.body?.reason }) });
    } catch (error) {
      res.status(409).json({ error: error instanceof Error ? error.message : "Không thể tạo yêu cầu trả hàng." });
    }
  });

  app.post("/api/store/warranty-claims", (req, res) => {
    if (!getAuthenticatedSession(req)) return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
    try {
      res.json({ success: true, state: createWarrantyClaim({ orderId: req.body?.orderId, productId: req.body?.productId, issue: req.body?.issue }) });
    } catch (error) {
      res.status(409).json({ error: error instanceof Error ? error.message : "Không thể tạo yêu cầu bảo hành." });
    }
  });

  // AI Chat endpoint
  // Trạng thái chuỗi model Gemini: model đang dùng, model nào đã hết lượt và khi nào được dùng lại
  app.get("/api/ai/status", (req, res) => {
    const session = getAuthenticatedSession(req);
    if (!session) return res.status(401).json({ error: "Bạn cần đăng nhập để xem trạng thái AI." });
    res.json({ configured: !!process.env.GEMINI_API_KEY, ...getGeminiStatus() });
  });

  app.post("/api/ai/chat", async (req, res) => {
    const session = getAuthenticatedSession(req);
    if (!session) return res.status(401).json({ error: "Bạn cần đăng nhập để sử dụng AI." });

    try {
      const { message, imageAttachment, history } = req.body;
      const storeState = getStoreState();
      const products = storeState.products;
      const orders = storeState.orders;
      const customers = ['admin', 'manager'].includes(session.user.role) ? storeState.customers : [];
      const branches = [];
      if (!message && !imageAttachment) {
        return res.status(400).json({ error: "Message or image is required" });
      }

      const userText = message || "Phân tích hình ảnh này và cho tôi biết thông tin sản phẩm hoặc hóa đơn.";
      const productListSummary = products.length > 0
        ? products.map((p: any) => `- ${p.name} (Mã: ${p.code}, Danh mục: ${p.category}, Giá bán: ${p.price.toLocaleString('vi-VN')}đ, ${['admin', 'manager'].includes(session.user.role) ? `Giá vốn: ${p.costPrice?.toLocaleString('vi-VN')}đ, ` : ''}Tồn kho: ${p.stock} cái, Đã bán: ${p.soldCount || 0}, Trạng thái: ${p.status})`).join("\n")
        : "Chưa có sản phẩm thật nào trong kho. Không được tự tạo hoặc suy đoán sản phẩm.";
      const orderSummary = summarizeOrdersForAi(orders);

      const systemInstruction = `Bạn là Chuyên viên Tư vấn Bán hàng & Trợ lý Quản trị Kinh doanh Công nghệ cao cấp tại SmartShop (SmartSale AI).

💎 PHONG CÁCH & NHÂN CÁCH GIAO TIẾP (PERSONA & TONE):
1. Tự nhiên, linh hoạt, duyên dáng, thấu cảm và cực kỳ thông minh. Bạn trò chuyện như một chuyên gia công nghệ nhiệt tình, am hiểu sâu sắc và có tâm tại một showroom điện tử cao cấp, TUYỆT ĐỐI KHÔNG trả lời máy móc, khô khan hay dập khuôn như robot đọc database.
2. Tinh tế điều chỉnh cách xưng hô và văn phong:
   - Thân thiện, lịch sự: "Em/Mình/SmartShop" và "Anh/Chị/Bạn".
   - Luôn lắng nghe nhu cầu ẩn sau câu hỏi của người dùng (ví dụ: mua để đi học, làm văn phòng, chơi game, chụp ảnh, làm quà tặng người thân, hay quản lý cần số liệu kinh doanh).
   - Đặt câu hỏi gợi mở khéo léo để giúp khách dễ dàng chọn lựa chiếc máy ưng ý nhất.
3. Không trả lời dập khuôn 1 kiểu:
   - Tránh việc lúc nào cũng liệt kê gạch đầu dòng 4 mục cứng ngắc. Hãy dùng câu văn mềm mại, so sánh sinh động, phân tích ưu/nhược điểm thực tế (ví dụ: điểm mạnh về màn hình, camera, pin, chip, giá trị giữ giá, hay mẫu nào phù hợp hơn với nhu cầu cụ thể).
   - Khi người dùng chào hỏi hoặc trò chuyện ngoài lề: Trò chuyện vui vẻ, duyên dáng, tự nhiên dẫn dắt vào công nghệ hoặc hỗ trợ bán hàng.

📦 DỮ LIỆU KHO HÀNG THỰC TẾ CỦA SMARTSHOP:
${productListSummary}

📊 DỮ LIỆU BÁO CÁO KINH DOANH:
${orderSummary}

🎯 NGUYÊN TẮC TƯ VẤN & XỬ LÝ DỮ LIỆU:
1. Khi khách hỏi mua / tư vấn thiết bị:
   - Ưu tiên các sản phẩm đang có sẵn trong kho hàng SmartShop. Báo giá chính xác, thông tin tồn kho thực tế.
   - Gợi ý combo phụ kiện thông minh (ví dụ mua điện thoại gợi ý dán cường lực + củ sạc nhanh + ốp lưng hoặc tai nghe) để tối ưu trải nghiệm và giúp khách tiết kiệm chi phí.
   - Nếu khách hỏi sản phẩm chưa có trong kho: Hãy tư vấn kiến thức công nghệ thực tế về dòng sản phẩm đó, đồng thời khéo léo gợi ý các sản phẩm tương đương đang có sẵn tại SmartShop.
2. Khi chủ shop / thu ngân hỏi về doanh thu, tồn kho, đơn hàng:
   - Đưa ra phân tích số liệu thông minh, ngắn gọn, kèm nhận định thực tế (ví dụ mặt hàng nào đang bán chạy, mặt hàng nào sắp hết cần nhập gấp, chính sách khuyến mãi nên áp dụng).
3. Trình bày Markdown trực quan: Sử dụng in đậm, icon tinh tế, chia đoạn mạch lạc, dễ đọc trên cả điện thoại và máy tính.`;

      // Build multimodal or text contents
      const parts: any[] = [];
      if (imageAttachment && imageAttachment.startsWith("data:")) {
        const match = imageAttachment.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }
      parts.push({ text: userText });

      const contentsPayload = buildGeminiHistory(history, userText);
      const lastTurn = contentsPayload[contentsPayload.length - 1];
      if (lastTurn && lastTurn.role === "user") lastTurn.parts.push(...parts);
      else contentsPayload.push({ role: "user", parts });

      const geminiResult = await callGeminiWithTimeout({
        contents: contentsPayload,
        config: {
          systemInstruction,
          temperature: 0.75,
        },
        timeoutMs: 20000, // Gemini 3.6 Flash có bước suy luận (thinking), thường mất 7-10 giây
      });

      const replyText = geminiResult.text || "Tôi đã nhận được thông tin từ bạn và đang xử lý dữ liệu bán hàng.";
      
      // Find if a product should be attached
      const matchedProduct = findMatchingProduct(userText + " " + replyText, products);

      return res.json({ 
        reply: replyText,
        aiEngine: `Google Gemini (${geminiResult.modelUsed})`,
        productCard: matchedProduct ? {
          name: matchedProduct.name,
          price: matchedProduct.price,
          stock: matchedProduct.stock,
          image: matchedProduct.image,
          actionText: matchedProduct.stock > 0 ? "NHẬP VÀO GIỎ" : "ĐẶT HÀNG NHẬP KHO",
        } : undefined
      });
    } catch (err: any) {
      console.warn("[SmartShop AI] Primary Gemini call failed, using intelligent heuristic fallback:", err?.message || err);
      const fallbackState = getStoreState();
      const fallbackCustomers = ['admin', 'manager'].includes(session.user.role) ? fallbackState.customers : [];
      const userText = req.body?.message || "";
      const fallbackResult = generateSmartLocalResponse(userText, fallbackState.products, fallbackCustomers, [], fallbackState.orders);
      const matchedProduct = fallbackResult.matchedProduct || findMatchingProduct(userText + " " + fallbackResult.reply, fallbackState.products);

      return res.json({
        reply: fallbackResult.reply,
        aiEngine: "SmartShop Heuristic Engine (Offline)",
        productCard: matchedProduct ? {
          name: matchedProduct.name,
          price: matchedProduct.price,
          stock: matchedProduct.stock,
          image: matchedProduct.image,
          actionText: matchedProduct.stock > 0 ? "NHẬP VÀO GIỎ" : "ĐẶT HÀNG NHẬP KHO",
        } : undefined,
      });
    }
  });

  // AI Business Analyst API - Comprehensive Business Analytics
  app.post("/api/ai/analyze-business", async (req, res) => {
    const session = getAuthenticatedSession(req);
    if (!session) return res.status(401).json({ error: "Bạn cần đăng nhập để sử dụng AI Analyst." });
    if (!['admin', 'manager'].includes(session.user.role)) {
      return res.status(403).json({ error: "Chỉ Quản trị viên (Admin) và Quản lý (Manager) mới có quyền truy cập AI Business Analyst." });
    }

    try {
      const storeState = getStoreState();
      const products = storeState.products || [];
      const orders = storeState.orders || [];
      const customers = storeState.customers || [];

      const completedOrders = orders.filter((o: any) => o.status === 'completed');
      const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
      const totalStock = products.reduce((sum: number, p: any) => sum + Number(p.stock || 0), 0);
      const totalInventoryCost = products.reduce((sum: number, p: any) => sum + Number(p.stock || 0) * Number(p.costPrice || 0), 0);
      const lowStockCount = products.filter((p: any) => Number(p.stock || 0) <= 10).length;

      // 1. Comprehensive Pre-aggregation across 100% of database records
      const productSalesMap = new Map<string, { id: string; name: string; category: string; sold: number; revenue: number }>();
      for (const order of completedOrders) {
        for (const item of (order.items || [])) {
          const rawItem = item as any;
          const prodId = rawItem.product?.id || rawItem.productId;
          if (!prodId) continue;
          const current = productSalesMap.get(prodId) || {
            id: prodId,
            name: rawItem.product?.name || "Sản phẩm",
            category: rawItem.product?.category || "Chung",
            sold: 0,
            revenue: 0,
          };
          current.sold += Number(item.quantity || 1);
          current.revenue += Number(item.product?.price || 0) * Number(item.quantity || 1);
          productSalesMap.set(prodId, current);
        }
      }

      const allTopSellers = Array.from(productSalesMap.values())
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);

      const slowMovingItems = products
        .filter((p) => (p.soldCount || 0) === 0 && p.stock > 0)
        .map((p) => ({ name: p.name, stock: p.stock, costTiedUp: p.stock * (p.costPrice || 0) }))
        .sort((a, b) => b.costTiedUp - a.costTiedUp)
        .slice(0, 5);

      const criticalShortages = products
        .filter((p) => p.stock <= 5)
        .map((p) => ({ id: p.id, name: p.name, stock: p.stock, price: p.price }))
        .slice(0, 8);

      const highMarginItems = products
        .filter((p) => p.stock > 0 && p.price > 0 && p.costPrice > 0)
        .map((p) => ({
          id: p.id,
          name: p.name,
          marginPct: Math.round(((p.price - p.costPrice) / p.price) * 100),
          stock: p.stock,
          price: p.price,
        }))
        .sort((a, b) => b.marginPct - a.marginPct)
        .slice(0, 5);

      let analysisResult: any = null;
      let aiEngine = "Smart Analytics Heuristic Engine (Offline)";

      try {
        const prompt = `Bạn là Giám đốc Phân tích Kinh doanh & Bán lẻ AI (Senior AI Retail Business Analyst) cho SmartShop.
Hãy phân tích dữ liệu tổng hợp thực tế sau từ hệ thống:
1. TỔNG QUAN: ${products.length} mã sản phẩm, ${totalStock} cái trong kho, tổng vốn tồn kho: ${totalInventoryCost.toLocaleString('vi-VN')}đ, tổng doanh thu hoàn tất: ${totalRevenue.toLocaleString('vi-VN')}đ từ ${completedOrders.length} hóa đơn.
2. TOP BÁN CHẠY NHẤT: ${JSON.stringify(allTopSellers)}
3. HÀNG SẮP HẾT HOẶC ĐÃ HẾT (Tồn <= 5): ${JSON.stringify(criticalShortages)}
4. HÀNG CHẬM BÁN ĐỌNG VỐN CAO (Chưa bán được cái nào): ${JSON.stringify(slowMovingItems)}
5. SẢN PHẨM BIÊN LỢI NHUẬN CAO NHẤT: ${JSON.stringify(highMarginItems)}

HÃY PHÂN TÍCH CHUYÊN SÂU VÀ TRẢ VỀ DUY NHẤT 1 ĐỐI TƯỢNG JSON (KHÔNG KÈM KÝ TỰ KHÁC HOẶC BACKTICKS):
{
  "businessHealthScore": 85,
  "healthEvaluation": "Nhận xét tổng quan tình hình kinh doanh súc tích trong 1-2 câu",
  "keyInsights": {
    "crossSell": {
      "title": "Tiêu đề cơ hội bán chéo / combo",
      "description": "Chi tiết combo ghép cặp giữa 2 sản phẩm cụ thể có trong danh sách",
      "expectedRevenueIncrease": "+15-20% AOV",
      "primaryProductName": "Tên sản phẩm 1",
      "comboProductName": "Tên sản phẩm 2",
      "primaryProductId": "id sản phẩm 1",
      "comboProductId": "id sản phẩm 2"
    },
    "inventoryRisk": {
      "title": "Cảnh báo rủi ro tồn kho",
      "description": "Chi tiết mã hàng sắp hết hoặc hết hàng cần nhập",
      "criticalStock": 3,
      "productName": "Tên sản phẩm cảnh báo",
      "productId": "id sản phẩm",
      "urgency": "high"
    },
    "marginOptimization": {
      "title": "Tối ưu hóa giá & biên lợi nhuận",
      "description": "Chi tiết sản phẩm có biên lợi nhuận tốt hoặc cần điều chỉnh",
      "marginPercent": 32,
      "productName": "Tên sản phẩm",
      "productId": "id sản phẩm",
      "recommendation": "Khuyến nghị hành động cụ thể"
    },
    "salesForecast": {
      "title": "Dự báo doanh thu tuần tới",
      "description": "Nhận định xu hướng dựa trên lịch sử bán hàng",
      "projectedRevenueNextWeek": "50.000.000đ",
      "trend": "up"
    }
  },
  "executiveSummary": {
    "cashFlowAnalysis": "Phân tích dòng tiền vốn lưu động và tồn kho với số liệu thực",
    "workingCapitalStatus": "Đánh giá trạng thái vốn lưu động",
    "inventoryTurnoverRatio": "Đánh giá vòng quay hàng tồn kho"
  },
  "actionPlan7Days": [
    { "category": "Bổ sung tồn kho", "action": "Hành động cụ thể", "priority": "high" },
    { "category": "Thúc đẩy bán hàng", "action": "Hành động cụ thể", "priority": "medium" },
    { "category": "Vận hành quầy POS", "action": "Hành động cụ thể", "priority": "low" }
  ],
  "promotionalIdeas": [
    { "title": "Chiến dịch kích cầu", "targetProducts": "Sản phẩm cụ thể", "mechanism": "Giảm 10% khi mua kèm phụ kiện" },
    { "title": "Xả kho hàng chậm bán", "targetProducts": "Sản phẩm cụ thể", "mechanism": "Tặng voucher 50.000đ cho lần mua tiếp theo" }
  ]
}`;

        const geminiResult = await callGeminiWithTimeout({
          contents: prompt,
          config: {
            temperature: 0.3,
          },
          timeoutMs: 15000,
        });

        const rawText = geminiResult.text || "";
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0]);
          aiEngine = `Google Gemini (${geminiResult.modelUsed})`;
        }
      } catch (geminiError: any) {
        console.warn("[SmartShop AI Analyst] Gemini call failed, using heuristic engine:", geminiError?.message || geminiError);
      }

      if (!analysisResult) {
        analysisResult = generateHeuristicBusinessAnalysis(products, orders, customers);
      }

      res.json({
        success: true,
        data: analysisResult,
        aiEngine,
        timestamp: new Date().toISOString(),
        stats: {
          totalProducts: products.length,
          totalStock,
          totalInventoryCost,
          totalRevenue,
          completedOrdersCount: completedOrders.length,
          lowStockCount,
        },
      });
    } catch (error) {
      console.error("[SmartShop AI Analyst] Error generating analysis:", error);
      res.status(500).json({ error: "Không thể phân tích dữ liệu kinh doanh." });
    }
  });

  // Interactive AI Business Analyst Strategic Q&A
  app.post("/api/ai/analyst-query", async (req, res) => {
    const session = getAuthenticatedSession(req);
    if (!session) return res.status(401).json({ error: "Bạn cần đăng nhập để đặt câu hỏi cho AI Analyst." });
    if (!['admin', 'manager'].includes(session.user.role)) {
      return res.status(403).json({ error: "Chỉ Quản trị viên (Admin) và Quản lý (Manager) mới có quyền hỏi đáp chiến lược kinh doanh." });
    }

    const question = req.body?.question ? String(req.body.question).trim() : "";
    if (!question) return res.status(400).json({ error: "Vui lòng nhập câu hỏi phân tích kinh doanh." });

    try {
      const storeState = getStoreState();
      const products = storeState.products || [];
      const orders = storeState.orders || [];
      const completedOrders = orders.filter((o: any) => o.status === 'completed');
      const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);

      try {
        const prompt = `Bạn là Senior AI Retail Business Analyst chuyên nghiệp cho SmartShop (Cửa hàng thiết bị điện tử & công nghệ).
Dữ liệu cửa hàng hiện tại:
- Tổng số mặt hàng: ${products.length} mã sản phẩm.
- Tổng doanh thu đã ghi nhận: ${totalRevenue.toLocaleString('vi-VN')}đ (${completedOrders.length} đơn hoàn tất).
- Sản phẩm bán chạy hàng đầu: ${products.slice(0, 5).map((p: any) => `${p.name} (Đã bán: ${p.soldCount || 0}, Tồn: ${p.stock})`).join(", ")}
- Sản phẩm sắp hết hàng (tồn <= 5): ${products.filter((p: any) => p.stock <= 5).map((p: any) => `${p.name} (còn ${p.stock})`).join(", ") || "Không có"}

Chủ cửa hàng hỏi: "${question}"

Hãy đưa ra câu trả lời chiến lược, súc tích, thực tế, có số liệu và bước hành động cụ thể bằng định dạng Markdown rõ ràng, chuyên nghiệp.`;

        const geminiResult = await callGeminiWithTimeout({
          contents: prompt,
          config: {
            temperature: 0.5,
          },
          timeoutMs: 15000,
        });

        return res.json({
          success: true,
          answer: geminiResult.text || "AI đã phân tích dữ liệu nhưng chưa thể sinh phản hồi.",
          aiEngine: `Google Gemini (${geminiResult.modelUsed})`,
          timestamp: new Date().toISOString(),
        });
      } catch (geminiError: any) {
        console.warn("[SmartShop AI Analyst] Query failed, using heuristic answer:", geminiError?.message || geminiError);
      }

      const fallbackAnswer = generateHeuristicAnalystAnswer(question, products, orders);
      res.json({
        success: true,
        answer: fallbackAnswer,
        aiEngine: "Smart Analytics Heuristic Engine (Offline)",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[SmartShop AI Analyst] Query error:", error);
      res.status(500).json({ error: "Không thể trả lời câu hỏi phân tích." });
    }
  });

  // Visual Checkout API - AI Image & Product Recognition
  app.post("/api/ai/visual-checkout", async (req, res) => {
    const session = getAuthenticatedSession(req);
    if (!session) return res.status(401).json({ error: "Bạn cần đăng nhập để sử dụng AI." });

    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Image data is required" });
      }

      const productList = getStoreState().products || [];
      const ai = getGenAI();

      if (ai && typeof image === "string" && image.startsWith("data:")) {
        const match = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (match) {
          const productSummary = productList
            .map((p: any) => `ID: "${p.id}", Tên: "${p.name}", Mã/SKU: "${p.sku || p.code}", Danh mục: "${p.category}", Giá: ${p.price}đ, Tồn kho: ${p.stock}`)
            .join("\n");

          const prompt = `Bạn là hệ thống AI Visual Checkout tại quầy thu ngân cửa hàng điện tử & phụ kiện SmartShop.
Nhiệm vụ: Phân tích hình ảnh chụp từ camera quầy thu ngân, so sánh với danh mục sản phẩm của cửa hàng để tìm sản phẩm khớp nhất.

QUY TẮC CỰC KỲ QUAN TRỌNG:
1. Nếu hình ảnh không rõ ràng, là đồ vật cá nhân, tường, khuôn mặt, thẻ ngân hàng, hoặc không khớp với sản phẩm nào trong danh mục, BẮT BUỘC trả về "matchedProductId": "" và confidence: 0.1.
2. KHÔNG ĐƯỢC đoán mò hoặc tự ý gán cho một sản phẩm ngẫu nhiên.
3. Chỉ gán matchedProductId khi bạn nhận diện được sản phẩm hoặc bao bì/logo/nhãn hiệu trùng khớp rõ ràng (confidence >= 0.65).

DANH MỤC SẢN PHẨM HIỆN CÓ CỦA CỬA HÀNG:
${productSummary || "Chưa có danh mục sản phẩm cụ thể."}

HÃY PHÂN TÍCH VÀ TRẢ VỀ DUY NHẤT MỘT ĐỐI TƯỢNG JSON (KHÔNG KÈM MARKDOWN HOẶC BACKTICKS):
{
  "matchedProductId": "ID của sản phẩm trong danh mục nếu khớp hoặc chuỗi rỗng",
  "productName": "Tên sản phẩm được nhận diện hoặc chuỗi rỗng",
  "confidence": 0.85,
  "category": "Danh mục sản phẩm",
  "description": "Lý do nhận diện hoặc mô tả chi tiết đặc điểm nhận biết",
  "barcode": "Mã vạch nhìn thấy nếu có hoặc null",
  "alternativeMatches": [
    { "productId": "id", "productName": "tên", "confidence": 0.6 }
  ]
}`;

          try {
            const geminiResult = await callGeminiWithTimeout({
              contents: {
                parts: [
                  {
                    inlineData: {
                      mimeType: match[1],
                      data: match[2],
                    },
                  },
                  { text: prompt },
                ],
              },
              config: {
                temperature: 0.1,
              },
              timeoutMs: 15000,
            });

            const rawText = geminiResult.text || "";
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              let targetProduct = null;

              if (parsed.matchedProductId) {
                targetProduct = productList.find((p: any) => p.id === parsed.matchedProductId);
              }
              if (!targetProduct && parsed.productName && parsed.productName.trim() !== "") {
                const searchName = parsed.productName.toLowerCase();
                targetProduct = productList.find((p: any) =>
                  p.name.toLowerCase().includes(searchName) ||
                  searchName.includes(p.name.toLowerCase())
                );
              }

              const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0;

              if (targetProduct && confidence >= 0.5) {
                return res.json({
                  success: true,
                  matchedProduct: targetProduct,
                  confidence: confidence,
                  description: parsed.description || `Nhận diện thành công: ${targetProduct.name}`,
                  barcode: parsed.barcode || targetProduct.code || null,
                  alternativeMatches: Array.isArray(parsed.alternativeMatches) ? parsed.alternativeMatches : [],
                  aiEngine: `Google Gemini Vision (${geminiResult.modelUsed})`,
                });
              } else {
                return res.json({
                  success: true,
                  matchedProduct: null,
                  confidence: confidence < 0.5 ? confidence : 0,
                  description: parsed.description || "Không nhận diện được sản phẩm nào trong kho từ hình ảnh đã chụp.",
                  barcode: null,
                  alternativeMatches: [],
                  aiEngine: `Google Gemini Vision (${geminiResult.modelUsed})`,
                });
              }
            }
          } catch (geminiError: any) {
            console.warn("[SmartShop AI Visual Checkout] Gemini Vision failed:", geminiError?.message || geminiError);
          }
        }
      }

      // Safe fallback when Gemini Vision is unavailable or fails:
      // NEVER blindly return productList[0] with fake high confidence!
      return res.json({
        success: true,
        matchedProduct: null,
        confidence: 0,
        description: "Hệ thống AI thị giác tạm thời không thể nhận diện sản phẩm này. Vui lòng quét mã vạch bằng máy quét hoặc tìm kiếm sản phẩm theo tên.",
        alternativeMatches: [],
        aiEngine: "SmartShop Vision Engine (Offline/Fallback)",
      });
    } catch (err: any) {
      console.error("[SmartShop AI Visual Checkout] Error:", err);
      return res.status(500).json({
        success: false,
        error: "Lỗi trong quá trình xử lý hình ảnh nhận diện sản phẩm.",
        matchedProduct: null,
        confidence: 0,
      });
    }
  });

  function extractBudgetFromText(text: string): number | null {
    const lower = text.toLowerCase();

    // Check "dưới 15 triệu", "tầm 10tr", "khoảng 20 củ", "dưới 500k", "<= 15000000"
    const millionMatch = lower.match(/(?:dưới|tầm|khoảng|<=|nhỏ hơn|tối đa|budget|giá|ngân sách)?\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr|củ|m)\b/i);
    if (millionMatch) {
      const num = parseFloat(millionMatch[1].replace(',', '.'));
      if (!isNaN(num) && num > 0) return Math.round(num * 1000000);
    }

    const thousandMatch = lower.match(/(?:dưới|tầm|khoảng|<=|nhỏ hơn|tối đa|budget|giá|ngân sách)?\s*(\d+(?:[.,]\d+)?)\s*(k|nghìn|ngàn)\b/i);
    if (thousandMatch) {
      const num = parseFloat(thousandMatch[1].replace(',', '.'));
      if (!isNaN(num) && num > 0) return Math.round(num * 1000);
    }

    const rawVndMatch = lower.match(/(?:dưới|tầm|khoảng|<=|nhỏ hơn|tối đa)?\s*(\d{1,3}(?:[.,]\d{3})+)\s*(?:đ|vnd)?/i);
    if (rawVndMatch) {
      const num = parseInt(rawVndMatch[1].replace(/[.,]/g, ''), 10);
      if (!isNaN(num) && num > 0) return num;
    }

    return null;
  }

  function findMatchingProduct(text: string, productsList?: any[]): any | null {
    const list: any[] = (Array.isArray(productsList) && productsList.length > 0)
      ? productsList
      : (getStoreState().products || []);

    if (!list || list.length === 0) return null;

    const lower = text.toLowerCase();
    const budget = extractBudgetFromText(lower);

    // Keyword detection
    const isPhone = lower.includes("điện thoại") || lower.includes("dien thoai") || lower.includes("phone") || lower.includes("smartphone") || lower.includes("iphone") || lower.includes("samsung") || lower.includes("galaxy");
    const isLaptop = lower.includes("laptop") || lower.includes("macbook") || lower.includes("máy tính") || lower.includes("may tinh");
    const isAudio = lower.includes("tai nghe") || lower.includes("headphone") || lower.includes("airpods") || lower.includes("loa") || lower.includes("sony") || lower.includes("wh-1000xm5");
    const isWatch = lower.includes("đồng hồ") || lower.includes("dong ho") || lower.includes("watch") || lower.includes("series 9");
    const isAccessory = lower.includes("phụ kiện") || lower.includes("phu kien") || lower.includes("sạc") || lower.includes("cáp") || lower.includes("ốp") || lower.includes("chuột") || lower.includes("bàn phím");

    // If budget is specified
    if (budget !== null && budget > 0) {
      let filtered = list.filter((p: any) => Number(p.price || 0) <= budget && Number(p.price || 0) > 0);
      if (isPhone) filtered = filtered.filter((p: any) => /điện thoại|phone|galaxy|iphone|samsung/i.test(p.category || "") || /galaxy|iphone|samsung/i.test(p.name || ""));
      else if (isLaptop) filtered = filtered.filter((p: any) => /laptop|macbook|máy tính/i.test(p.category || "") || /macbook|thinkpad|dell|asus/i.test(p.name || ""));
      else if (isAudio) filtered = filtered.filter((p: any) => /tai nghe|âm thanh|audio/i.test(p.category || "") || /airpods|sony|wh-|tai nghe/i.test(p.name || ""));
      else if (isWatch) filtered = filtered.filter((p: any) => /đồng hồ|watch/i.test(p.category || "") || /watch/i.test(p.name || ""));
      else if (isAccessory) filtered = filtered.filter((p: any) => /phụ kiện|accessory/i.test(p.category || "") || /sạc|cáp|chuột/i.test(p.name || ""));

      if (filtered.length > 0) {
        // Sort by price descending to get best product matching budget, preferring in-stock
        filtered.sort((a: any, b: any) => {
          if ((b.stock > 0) !== (a.stock > 0)) return b.stock > 0 ? 1 : -1;
          return Number(b.price || 0) - Number(a.price || 0);
        });
        return filtered[0];
      }
    }

    // Direct exact or partial name / SKU matching
    for (const p of list) {
      const pNameLower = (p.name || "").toLowerCase();
      const pCodeLower = (p.code || p.sku || "").toLowerCase();
      if (pCodeLower && lower.includes(pCodeLower)) return p;
      if (pNameLower && lower.includes(pNameLower)) return p;
    }

    // Specific electronic alias matching
    if (lower.includes("galaxy") || lower.includes("a55") || (lower.includes("samsung") && !lower.includes("tai nghe"))) {
      const match = list.find((p: any) => /galaxy|a55|samsung/i.test(p.name));
      if (match) return match;
    }
    if (lower.includes("iphone") || lower.includes("15 pro")) {
      const match = list.find((p: any) => /iphone/i.test(p.name));
      if (match) return match;
    }
    if (lower.includes("macbook")) {
      const match = list.find((p: any) => /macbook/i.test(p.name));
      if (match) return match;
    }
    if (lower.includes("airpods")) {
      const match = list.find((p: any) => /airpods/i.test(p.name));
      if (match) return match;
    }
    if (lower.includes("wh-1000xm5") || (lower.includes("sony") && lower.includes("tai nghe"))) {
      const match = list.find((p: any) => /wh-1000xm5|sony/i.test(p.name));
      if (match) return match;
    }
    if (lower.includes("watch") || lower.includes("đồng hồ")) {
      const match = list.find((p: any) => /watch/i.test(p.name));
      if (match) return match;
    }

    return null;
  }

  function summarizeOrdersForAi(ordersList: any[]) {
    const completedOrders = (Array.isArray(ordersList) ? ordersList : []).filter((order) => order.status === 'completed');
    const todayKey = new Date().toLocaleDateString('en-CA');
    const todayOrders = completedOrders.filter((order) => String(order.createdAt || '').slice(0, 10) === todayKey);
    const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const allRevenue = completedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    return `Hôm nay (${todayKey}): ${todayOrders.length} đơn hoàn tất, doanh thu ${todayRevenue.toLocaleString('vi-VN')}đ.
Tổng đơn hoàn tất trong hệ thống: ${completedOrders.length}, tổng doanh thu: ${allRevenue.toLocaleString('vi-VN')}đ.
${todayOrders.length > 0 ? todayOrders.map((order) => `- ${order.code}: ${Number(order.total || 0).toLocaleString('vi-VN')}đ, ${order.items?.length || 0} dòng sản phẩm`).join('\n') : 'Chưa có đơn hoàn tất trong ngày hiện tại.'}`;
  }

  function generateSmartLocalResponse(
    userText: string,
    productsList?: any[],
    customersList?: any[],
    branchesList?: any[],
    ordersList?: any[]
  ): { reply: string; matchedProduct?: any } {
    const lower = userText.toLowerCase().trim();
    const products = Array.isArray(productsList) ? productsList : (getStoreState().products || []);
    const customers = Array.isArray(customersList) ? customersList : [];
    const completedOrders = (Array.isArray(ordersList) ? ordersList : []).filter((order: any) => order.status === 'completed');
    const todayKey = new Date().toLocaleDateString('en-CA');
    const todayOrders = completedOrders.filter((order: any) => String(order.createdAt || '').slice(0, 10) === todayKey);
    const todayRevenue = todayOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);
    const allRevenue = completedOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);

    // 1. Social Greetings & Friendly Small Talk
    if (/^(chào|xin chào|hi|hello|alo|ad ơi|shop ơi|em ơi|anh ơi|có ai không|bạn là ai|ai đó)/i.test(lower) || lower === "chào" || lower === "hi") {
      return {
        reply: `Dạ em chào anh/chị ạ! Rất vui được đồng hành cùng anh/chị tại **SmartShop**. 😊

Em là **Trợ lý Công nghệ & Quản trị SmartSale AI**. Anh/chị đang cần em hỗ trợ gì hôm nay ạ:
- 📱 **Tư vấn chọn máy:** Tìm smartphone, laptop, tai nghe hay phụ kiện phù hợp theo ngân sách và nhu cầu (học tập, làm việc, chụp ảnh hay chơi game)?
- 📊 **Kiểm tra kinh doanh:** Xem doanh thu, đơn hàng, khách VIP hay cảnh báo hàng sắp hết trong kho?

Anh/chị cứ chia sẻ tự nhiên nhé, em sẵn sàng tư vấn chi tiết ngay ạ!`,
      };
    }

    // 2. Revenue & Sales Queries
    if (lower.includes("doanh thu") || lower.includes("hôm nay") || lower.includes("bán được") || lower.includes("doanh số")) {
      return {
        reply: todayOrders.length > 0
          ? `📊 **Tình hình Doanh thu SmartShop Hôm nay (${todayKey}):**\n\n` +
            `Hôm nay cửa hàng đã ghi nhận **${todayOrders.length} đơn hoàn tất**, mang về tổng doanh thu **${todayRevenue.toLocaleString('vi-VN')}đ**.\n` +
            `Tính chung toàn bộ lịch sử hệ thống, chúng ta đã đạt **${allRevenue.toLocaleString('vi-VN')}đ** với **${completedOrders.length} đơn hàng** thành công.\n\n` +
            `💡 *Gợi ý cho thu ngân & quản lý:* Các khung giờ cao điểm buổi chiều/tối thường có lượng khách mua phụ kiện tăng cao, hãy chủ động tư vấn combo sạc nhanh và dán màn hình để gia tăng thêm giá trị trên mỗi đơn hàng nhé!`
          : `📊 **Báo cáo Doanh thu Hôm nay (${todayKey}):**\n\n` +
            `Hôm nay cửa hàng chưa phát sinh đơn hàng hoàn tất mới. Tổng doanh thu lũy kế toàn hệ thống hiện đạt **${allRevenue.toLocaleString('vi-VN')}đ** từ **${completedOrders.length} đơn hoàn tất** trước đó.\n\n` +
            `💪 Chúc đội ngũ bán hàng hôm nay bùng nổ doanh số! Em luôn sẵn sàng hỗ trợ tra cứu giá và tạo đơn thanh toán nhanh tại quầy POS.`,
      };
    }

    // 3. Inventory & Stock Alerts
    if (lower.includes("tồn kho") || lower.includes("hết hàng") || lower.includes("còn hàng") || lower.includes("nhập hàng") || lower.includes("sắp hết")) {
      const lowStock = products.filter((p: any) => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 5).slice(0, 8);
      const outOfStock = products.filter((p: any) => Number(p.stock || 0) === 0).slice(0, 8);
      const totalUnits = products.reduce((sum: number, p: any) => sum + Number(p.stock || 0), 0);

      return {
        reply: products.length === 0
          ? '📦 Kho hàng hiện chưa có dữ liệu sản phẩm. Bạn có thể vào mục "Sản phẩm" để thêm mới mặt hàng.'
          : `📦 **Báo cáo Tồn kho & Cảnh báo Hàng hóa tức thời:**\n\n` +
            `- **Tổng lượng máy & phụ kiện trong kho:** Hiện có **${totalUnits.toLocaleString('vi-VN')} thiết bị** (${products.length} danh mục sản phẩm).\n` +
            `- ⚠️ **Cảnh báo hàng sắp hết (tồn kho ≤ 5):** ${lowStock.length > 0 ? lowStock.map((p: any) => `**${p.name}** (còn ${p.stock} máy)`).join(', ') : 'Tất cả mặt hàng đều ở mức an toàn.'}\n` +
            `- 🚨 **Đã hết hàng (tồn 0):** ${outOfStock.length > 0 ? outOfStock.map((p: any) => `**${p.name}**`).join(', ') : 'Không có mặt hàng nào bị đứt kho.'}\n\n` +
            `💡 *Lời khuyên quản lý:* Anh/chị có thể vào trực tiếp tab **"Nhập hàng"** để lập phiếu nhập hàng ngay, tránh gián đoạn các đơn bán chạy tại quầy POS nhé!`,
        matchedProduct: lowStock[0] || outOfStock[0] || undefined,
      };
    }

    // 4. Customer & VIP Queries
    if (lower.includes("khách hàng") || lower.includes("vip") || lower.includes("thành viên")) {
      const vipCustomers = customers.filter((c: any) => (c.totalSpent || 0) > 20000000 || c.loyaltyTier === 'VIP');
      return {
        reply: customers.length > 0
          ? `👥 **Chăm sóc Khách hàng & Thành viên VIP SmartShop:**\n\n` +
            `- **Tổng số khách đã lưu hồ sơ:** **${customers.length} khách hàng**.\n` +
            `- **Hạng VIP / Thân thiết:** **${vipCustomers.length} thành viên** (doanh số tích lũy trên 20 triệu).\n` +
            `- **Đặc quyền VIP đề xuất:** Giảm ngay 5% hóa đơn tiếp theo, tặng dán cường lực miễn phí trọn đời máy và ưu tiên chính sách bảo hành 1-đổi-1.\n\n` +
            `Anh/chị có thể tra cứu nhanh lịch sử mua hàng của từng khách ngay trên quầy POS khi tạo hóa đơn.`
          : 'Hiện hệ thống chưa ghi nhận hồ sơ khách hàng nào. Thu ngân có thể thêm nhanh thông tin khách hàng mới trực tiếp tại màn hình Bán hàng POS.',
      };
    }

    // 5. Cross-sell / Combo Queries
    if (lower.includes("bán kèm") || lower.includes("combo") || lower.includes("cross-sell") || lower.includes("upsell") || lower.includes("mua kèm")) {
      const accessory = products.find((p: any) => /phụ kiện|tai nghe|sạc|airpods/i.test(p.category || "") || /airpods|sạc|tai nghe/i.test(p.name || ""));
      const flagship = products.find((p: any) => /iphone|galaxy|macbook/i.test(p.name || ""));

      return {
        reply: `💡 **Bí quyết Tư vấn Combo Bán chéo (Cross-sell) Hiệu quả cao:**\n\n` +
          `1. **Kịch bản ghép combo thông minh:**\n` +
          `   - Khi khách hàng chốt ${flagship ? `**${flagship.name}**` : 'điện thoại hoặc laptop'}, hãy khéo léo gợi ý: *"Dạ máy mới chưa kèm củ sạc nhanh và tai nghe chống ồn, hôm nay shop đang có ưu đãi giảm 10% khi mua kèm phụ kiện, em lấy luôn cho mình trải nghiệm trọn vẹn nhé!"*\n` +
          `${accessory ? `   - Sản phẩm bán kèm vàng trong kho: **${accessory.name}** (Giá: **${Number(accessory.price || 0).toLocaleString('vi-VN')}đ**).\n` : ''}` +
          `2. **Lợi ích kép:**\n` +
          `   - Khách hàng được phục vụ chu đáo, đầy đủ phụ kiện bảo vệ máy ngay khi mở hộp.\n` +
          `   - Cửa hàng tăng ngay giá trị đơn hàng trung bình (AOV) và đẩy nhanh vòng quay tồn kho phụ kiện có biên lợi nhuận cao.`,
        matchedProduct: accessory || flagship || undefined,
      };
    }

    // 6. Specific Needs / Personas (Gaming, Photography, Student, Work)
    const isStudent = lower.includes("học sinh") || lower.includes("sinh viên") || lower.includes("học tập") || lower.includes("giá rẻ");
    const isGaming = lower.includes("chơi game") || lower.includes("gaming") || lower.includes("game");
    const isCamera = lower.includes("chụp ảnh") || lower.includes("quay phim") || lower.includes("chụp hình") || lower.includes("camera") || lower.includes("sống ảo");
    const isOffice = lower.includes("văn phòng") || lower.includes("công việc") || lower.includes("làm việc") || lower.includes("pin trâu");

    const matchedProduct = findMatchingProduct(userText, products);
    const budget = extractBudgetFromText(lower);

    if (matchedProduct) {
      const inStock = Number(matchedProduct.stock || 0) > 0;
      const formattedPrice = Number(matchedProduct.price || 0).toLocaleString('vi-VN') + 'đ';

      let personalizedIntro = `Dạ chào bạn! Nếu bạn đang cân nhắc`;
      if (budget) {
        personalizedIntro = `Dạ tuyệt vời! Với ngân sách dưới **${budget.toLocaleString('vi-VN')}đ**, bạn đang ở tầm giá có rất nhiều lựa chọn chất lượng. Trong kho của SmartShop thì chiếc máy này chính là **"chân ái"** sáng giá nhất:`;
      } else if (isStudent) {
        personalizedIntro = `Dạ với nhu cầu học tập của các bạn học sinh, sinh viên (cần máy bền, pin khỏe, giá hợp lý), em xin đề xuất chiếc máy cực kỳ thực dụng này:`;
      } else if (isGaming) {
        personalizedIntro = `Dạ nếu bạn cần một chiếc máy hiệu năng mạnh mẽ để chiến game mượt mà, màn hình tần số quét cao thì em xin giới thiệu ngay em máy này:`;
      } else if (isCamera) {
        personalizedIntro = `Dạ mê chụp ảnh và quay video sống ảo thì bạn không thể bỏ qua "ngôi sao" camera này trong kho của shop:`;
      } else if (isOffice) {
        personalizedIntro = `Dạ với nhu cầu làm việc văn phòng, cần máy sang trọng, pin dùng cả ngày dài và hỗ trợ đa nhiệm mượt mà, mẫu máy này là gợi ý hàng đầu:`;
      } else {
        personalizedIntro = `Dạ em đã kiểm tra kho và tìm thấy một mẫu máy cực kỳ phù hợp với nhu cầu của bạn:`;
      }

      return {
        reply: `${personalizedIntro}\n\n` +
          `🌟 **${matchedProduct.name}**\n` +
          `- 🏷️ **Mức giá ưu đãi tại shop:** **${formattedPrice}**\n` +
          `- 📦 **Tình trạng:** ${inStock ? `Đang có sẵn **${matchedProduct.stock} máy** tại cửa hàng (giao ngay)` : '⚠️ Tạm thời hết hàng sẵn, shop hỗ trợ đặt nhập kho ưu tiên trong 24h'}\n` +
          `- 📂 **Phân khúc:** ${matchedProduct.category || 'Thiết bị công nghệ chính hãng'}\n\n` +
          `💎 **Vì sao chiếc máy này rất đáng tiền:**\n` +
          `- Thiết kế thời thượng, cầm đầm tay, màn hình sắc nét cho trải nghiệm thị giác mượt mà.\n` +
          `- Cấu hình tối ưu tốt cho mọi tác vụ thường nhật từ lướt web, học tập đến giải trí.\n` +
          `- Hưởng trọn gói **Bảo hành 12 tháng chính hãng**, cam kết 1-đổi-1 trong 30 ngày nếu phát sinh lỗi nhà sản xuất.\n` +
          `- Hỗ trợ thanh toán linh hoạt: Tiền mặt, Quẹt thẻ, hoặc quét mã VietQR tự động tại quầy POS.\n\n` +
          `💬 *Bạn có muốn em tư vấn thêm về màu sắc yêu thích hoặc các gói phụ kiện bảo vệ đi kèm (sạc nhanh, ốp lưng, tai nghe) không ạ?*`,
        matchedProduct,
      };
    }

    // 7. General Technology Advice / Natural Fallback
    return {
      reply: `Dạ em luôn sẵn sàng hỗ trợ anh/chị đây ạ! 😊\n\n` +
        `Để em tư vấn đúng gu và sát nhất với nhu cầu, anh/chị có thể chia sẻ thêm cho em một chút thông tin nhé:\n` +
        `- 🎯 **Nhu cầu sử dụng chính:** Anh/chị dùng để làm việc, học tập, chụp ảnh du lịch hay chơi game giải trí?\n` +
        `- 💰 **Mức ngân sách dự kiến:** Anh/chị muốn tìm máy trong tầm giá nào (ví dụ: *dưới 10 triệu*, *tầm 15 triệu*, hay *phân khúc cao cấp trên 30 triệu*)?\n` +
        `- 🍏 **Thương hiệu yêu thích:** Anh/chị đang quen dùng Apple iPhone, Samsung Galaxy, MacBook hay các dòng máy khác ạ?\n\n` +
        `Chỉ cần anh/chị nhắn cho em biết mong muốn, em sẽ gợi ý ngay chiếc máy "chuẩn chỉnh" nhất kèm ưu đãi hiện có tại SmartShop nhé!`,
    };
  }

  function generateHeuristicBusinessAnalysis(productsList: any[], ordersList: any[], customersList: any[]) {
    const products = Array.isArray(productsList) ? productsList : [];
    const orders = Array.isArray(ordersList) ? ordersList : [];
    const completedOrders = orders.filter((o: any) => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
    const totalInventoryCost = products.reduce((sum: number, p: any) => sum + Number(p.stock || 0) * Number(p.costPrice || 0), 0);
    const lowStock = products.filter((p: any) => Number(p.stock || 0) <= 10).sort((a: any, b: any) => a.stock - b.stock);
    const outOfStock = products.filter((p: any) => Number(p.stock || 0) === 0);
    const topSeller = [...products].sort((a: any, b: any) => (b.soldCount || 0) - (a.soldCount || 0))[0] || products[0];
    const complementaryProd = products.find((p: any) => p.id !== topSeller?.id && p.stock > 0) || products[1] || topSeller;

    const topMarginProd = [...products].sort((a: any, b: any) =>
      ((b.price - b.costPrice) / Math.max(b.price, 1)) - ((a.price - a.costPrice) / Math.max(a.price, 1))
    )[0];

    const marginPct = topMarginProd
      ? Math.round(((topMarginProd.price - topMarginProd.costPrice) / Math.max(topMarginProd.price, 1)) * 100)
      : 25;

    // Calculate dynamic health score
    let score = 86;
    if (outOfStock.length > 0) score -= Math.min(15, outOfStock.length * 4);
    if (lowStock.length > 3) score -= 6;
    if (completedOrders.length > 5) score += 6;
    if (totalRevenue > 50000000) score += 4;
    score = Math.max(45, Math.min(96, score));

    const healthEvaluation = score >= 85
      ? "Hoạt động kinh doanh ổn định và tích cực. Vốn lưu động được phân bổ hợp lý, cần tiếp tục phát huy các gói bán kèm."
      : score >= 70
      ? "Hoạt động đạt mức khá. Cần chú trọng cảnh báo hàng thiếu hụt và xử lý các mặt hàng chậm luân chuyển."
      : "Cảnh báo vận hành: Tồn kho thiếu cân đối hoặc tỷ lệ hàng sắp đứt tồn cao, cần tái cơ cấu kế hoạch nhập hàng.";

    const criticalProd = lowStock[0] || outOfStock[0];

    return {
      businessHealthScore: score,
      healthEvaluation,
      keyInsights: {
        crossSell: {
          title: topSeller && complementaryProd ? `Combo bán chạy: ${topSeller.name} + ${complementaryProd.name}` : "Combo kích cầu phụ kiện công nghệ",
          description: topSeller && complementaryProd
            ? `Khách hàng quan tâm ${topSeller.name} có xu hướng mua kèm ${complementaryProd.name}. Ghép combo giảm nhẹ 5-8% để đẩy mạnh doanh số trung bình/đơn.`
            : "Ghép cặp các thiết bị chính với phụ kiện bảo vệ và sạc nhanh để gia tăng biên lợi nhuận.",
          expectedRevenueIncrease: "+18% đến +25% AOV",
          primaryProductName: topSeller?.name,
          comboProductName: complementaryProd?.name,
          primaryProductId: topSeller?.id,
          comboProductId: complementaryProd?.id,
        },
        inventoryRisk: {
          title: criticalProd ? `Nguy cơ đứt hàng: ${criticalProd.name}` : "Tồn kho trong tầm kiểm soát",
          description: criticalProd
            ? `${criticalProd.name} hiện chỉ còn ${criticalProd.stock} cái trong kho. Tốc độ xuất kho cho thấy rủi ro thiếu hàng trong các ca bán cao điểm tới.`
            : "Toàn bộ danh mục đều duy trì mức tồn an toàn trên 10 đơn vị sản phẩm.",
          criticalStock: criticalProd ? criticalProd.stock : 0,
          productName: criticalProd?.name,
          productId: criticalProd?.id,
          urgency: (criticalProd && criticalProd.stock <= 3 ? "high" : "medium") as "high" | "medium" | "low",
        },
        marginOptimization: {
          title: topMarginProd ? `Sản phẩm biên lợi nhuận cao: ${topMarginProd.name}` : "Tối ưu hóa giá bán",
          description: topMarginProd
            ? `${topMarginProd.name} đạt tỷ suất biên lợi nhuận gộp ${marginPct}%. Đề xuất ưu tiên vị trí hiển thị và huấn luyện thu ngân tư vấn mã hàng này.`
            : "Rà soát lại giá nhập và chiết khấu nhà cung cấp để nâng tỷ suất lợi nhuận trung bình.",
          marginPercent: marginPct,
          productName: topMarginProd?.name,
          productId: topMarginProd?.id,
          recommendation: "Đẩy mạnh trưng bày tại khu vực trung tâm cửa hàng và trang chủ website.",
        },
        salesForecast: {
          title: "Dự báo dòng tiền & doanh số tuần tới",
          description: completedOrders.length > 0
            ? `Dựa trên ${completedOrders.length} giao dịch gần nhất với tổng doanh thu ${totalRevenue.toLocaleString('vi-VN')}đ, tốc độ thanh toán duy trì nhịp tăng trưởng ổn định.`
            : "Hệ thống đang tích lũy dữ liệu đơn hàng ban đầu để thiết lập biểu đồ dự báo xu hướng.",
          projectedRevenueNextWeek: totalRevenue > 0 ? `${Math.round(totalRevenue * 1.25).toLocaleString('vi-VN')}đ` : "Đang tính toán...",
          trend: (completedOrders.length > 2 ? "up" : "stable") as "up" | "stable" | "down",
        },
      },
      executiveSummary: {
        cashFlowAnalysis: `Giá trị vốn hàng tồn hiện hữu đạt ${totalInventoryCost.toLocaleString('vi-VN')}đ trên tổng số ${products.length} mã sản phẩm. Dòng tiền bán hàng ghi nhận ${totalRevenue.toLocaleString('vi-VN')}đ.`,
        workingCapitalStatus: totalInventoryCost > 50000000 ? "Vốn lưu động tập trung nhiều ở nhóm sản phẩm giá trị cao." : "Cấu trúc vốn tồn kho gọn gàng, rủi ro đọng vốn thấp.",
        inventoryTurnoverRatio: completedOrders.length > 5 ? "Tốc độ luân chuyển hàng hóa đạt ngưỡng tối ưu ngành bán lẻ điện tử." : "Cần thêm chiến dịch kích cầu để gia tăng vòng quay vốn.",
      },
      actionPlan7Days: [
        {
          category: "Bổ sung tồn kho",
          action: criticalProd ? `Lập đơn đặt hàng nhập kho bổ sung cho ${criticalProd.name} (${criticalProd.stock} cái).` : "Kiểm kê định kỳ các mã hàng chủ lực.",
          priority: "high" as const,
        },
        {
          category: "Chương trình Combo",
          action: topSeller && complementaryProd ? `Tạo mã giảm giá combo kết hợp ${topSeller.name} và ${complementaryProd.name}.` : "Thiết lập combo phụ kiện tại quầy thu ngân.",
          priority: "medium" as const,
        },
        {
          category: "Trưng bày & Bán hàng",
          action: topMarginProd ? `Ưu tiên tư vấn ${topMarginProd.name} để tối đa hóa lợi nhuận ca bán hàng.` : "Đào tạo nhân viên giới thiệu ưu đãi VietQR.",
          priority: "medium" as const,
        },
        {
          category: "Thanh toán POS",
          action: "Khuyến khích khách hàng quét VietQR tĩnh tại quầy để rút ngắn thời gian xếp hàng dưới 15 giây.",
          priority: "low" as const,
        },
      ],
      promotionalIdeas: [
        {
          title: "Combo Tiết Kiệm Công Nghệ",
          targetProducts: topSeller?.name || "Thiết bị chính",
          mechanism: "Giảm ngay 10% cho phụ kiện khi mua kèm máy chính trong cùng 1 hóa đơn.",
        },
        {
          title: "Khách hàng thân thiết hoàn xu",
          targetProducts: "Toàn bộ danh mục điện tử",
          mechanism: "Tích điểm 5% cho thành viên thanh toán qua chuyển khoản ngân hàng tự động.",
        },
      ],
    };
  }

  function generateHeuristicAnalystAnswer(question: string, products: any[], orders: any[]) {
    const lower = question.toLowerCase();
    const completedOrders = orders.filter((o: any) => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
    const lowStock = products.filter((p: any) => Number(p.stock || 0) <= 10);
    const topSeller = [...products].sort((a: any, b: any) => (b.soldCount || 0) - (a.soldCount || 0))[0];

    if (lower.includes("doanh thu") || lower.includes("tăng") || lower.includes("bán hàng")) {
      return `### 💡 Đề xuất Tăng trưởng Doanh thu & Tối ưu Bán hàng:
1. **Thúc đẩy Giá trị Đơn hàng Trung bình (AOV)**:
   - Hiện tổng doanh thu ghi nhận: **${totalRevenue.toLocaleString('vi-VN')}đ** từ **${completedOrders.length} đơn hoàn tất**.
   - Hãy thiết lập chính sách bán kèm phụ kiện với sản phẩm chủ lực **${topSeller ? topSeller.name : 'các dòng điện thoại/laptop'}**.
2. **Kích cầu nhóm sản phẩm tồn kho**:
   - Hiện có **${lowStock.length} mã hàng** có mức tồn dưới 10 cái và cần cân đối lại dòng tiền.
3. **Tận dụng kênh thanh toán VietQR**:
   - Khách thanh toán quét mã nhanh giúp giảm tỷ lệ bỏ giỏ tại quầy lên đến 25%.`;
    }

    if (lower.includes("tồn kho") || lower.includes("nhập hàng") || lower.includes("hết hàng")) {
      return `### 📦 Chiến lược Tồn kho & Quản trị Rủi ro:
1. **Các mặt hàng cấp bách**:
${lowStock.slice(0, 5).map((p: any) => `   - **${p.name}**: Còn ${p.stock} cái (Mã: ${p.code || p.id}).`).join('\n') || '   - Tất cả mặt hàng đều có tồn kho an toàn.'}
2. **Khuyến nghị hành động**:
   - Tạo ngay phiếu nhập hàng dự phòng cho các mã có mức tồn dưới 5 cái.
   - Với các mặt hàng bán chậm, cân nhắc xả tồn bằng cách tặng kèm hoặc chiết khấu bậc thang.`;
    }

    return `### 📊 Phân tích Chiến lược Tổng thể từ AI Analyst:
Dựa trên dữ liệu thực tế gồm **${products.length} mã sản phẩm** và **${completedOrders.length} đơn hoàn tất**:
1. **Sản phẩm dẫn đầu**: **${topSeller ? topSeller.name : 'Đang cập nhật'}** (đã bán ${topSeller?.soldCount || 0} sản phẩm).
2. **Dòng tiền**: Tổng doanh thu đã thanh toán đạt **${totalRevenue.toLocaleString('vi-VN')}đ**.
3. **Kế hoạch ưu tiên**: Bổ sung hàng cho các sản phẩm bán chạy và tăng tốc độ xử lý đơn hàng tại quầy POS.`;
  }

  // Vite middleware cho môi trường Development hoặc Static File cho Production
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn("[SmartShop Dev] Không thể nạp Vite middleware:", viteErr);
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SmartSale AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
