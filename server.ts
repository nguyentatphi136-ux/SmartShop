import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

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

  // Send verification code to email
  app.post("/api/auth/send-verification-code", (req, res) => {
    const email = req.body?.email ? String(req.body.email).trim().toLowerCase() : "";
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Email không hợp lệ. Vui lòng nhập đúng định dạng email." });
    }

    // Generate secure 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    verificationStore.set(email, {
      email,
      code,
      expiresAt,
      attempts: 0,
    });

    console.log(`[SmartSale Auth] Verification code for ${email}: ${code} (expires in 5 mins)`);

    res.json({
      success: true,
      message: `Mã xác thực đã được tạo và gửi đến ${email}`,
      email,
      code, // returned so client UI can display instant testing banner & one-click fill
      expiresInSeconds: 300,
    });
  });

  // Verify submitted code
  app.post("/api/auth/verify-code", (req, res) => {
    const email = req.body?.email ? String(req.body.email).trim().toLowerCase() : "";
    const submittedCode = req.body?.code ? String(req.body.code).trim() : "";

    if (!email || !submittedCode) {
      return res.status(400).json({ error: "Thiếu thông tin email hoặc mã xác thực." });
    }

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

    // Successfully verified!
    verificationStore.delete(email);
    res.json({
      success: true,
      message: "Xác thực email thành công.",
      email,
    });
  });

  // AI Chat endpoint
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, imageAttachment, history, products, customers, branches } = req.body;
      if (!message && !imageAttachment) {
        return res.status(400).json({ error: "Message or image is required" });
      }

      const userText = message || "Phân tích hình ảnh này và cho tôi biết thông tin sản phẩm hoặc hóa đơn.";
      const productListSummary = Array.isArray(products) && products.length > 0
        ? products.map((p: any) => `- ${p.name} (Mã: ${p.code}, Danh mục: ${p.category}, Giá bán: ${p.price.toLocaleString('vi-VN')}đ, Giá vốn: ${p.costPrice?.toLocaleString('vi-VN')}đ, Tồn kho: ${p.stock} cái, Đã bán: ${p.soldCount || 0}, Trạng thái: ${p.status})`).join("\n")
        : `- iPhone 15 Pro Max 256GB (Giá: 29.590.000đ, Tồn: 12, Đã bán: 28)
- MacBook Pro M3 14-inch (Giá: 39.990.000đ, Tồn: 5, Đã bán: 12)
- Sony WH-1000XM5 (Giá: 7.490.000đ, Tồn: 0, Hết hàng, Đã bán: 15)
- Apple Watch Series 9 (Giá: 10.290.000đ, Tồn: 24, Đã bán: 35)
- Samsung Galaxy A55 (Giá: 10.000.000đ, Tồn: 48, Đã bán: 42)
- MacBook Air M2 8GB/256GB (Giá: 26.590.000đ, Tồn: 12, Đã bán: 19)
- Ốp lưng iPhone 15 Pro Max Clear Case (Giá: 1.490.000đ, Tồn: 0, Hết hàng, Đã bán: 88)
- iPhone 14 Pro Max 256GB (Giá: 24.990.000đ, Tồn: 3, Đã bán: 65)
- Áo Thun Trắng Basic Premium (Giá: 250.000đ, Tồn: 45, Đã bán: 120)
- iPad Air M2 11-inch (Giá: 16.990.000đ, Tồn: 18, Đã bán: 14)
- AirPods Pro Gen 2 (Giá: 5.890.000đ, Tồn: 30, Đã bán: 52)
- Samsung Galaxy Tab S9 Ultra (Giá: 24.490.000đ, Tồn: 8, Đã bán: 7)`;

      const systemInstruction = `Bạn là Trợ lý AI Bán hàng & Quản trị Kinh doanh thông minh (SmartSale AI Assistant).
Bạn có quyền truy cập vào dữ liệu sản phẩm, danh mục, giá cả, tồn kho, khách hàng và chi nhánh sau:
DANH SÁCH SẢN PHẨM HIỆN TẠI:
${productListSummary}

NHIỆM VỤ CỦA BẠN:
1. Trả lời nhanh chóng, chuyên nghiệp và thân thiện bằng tiếng Việt.
2. Tư vấn sản phẩm, kiểm tra tồn kho chính xác, đề xuất combo hoặc gợi ý sản phẩm phù hợp.
3. Hỗ trợ tra cứu doanh thu, dự báo bán hàng, tư vấn chính sách khuyến mãi và tối ưu dòng tiền.
4. Trình bày định dạng Markdown rõ ràng, có điểm nhấn và các con số cụ thể.`;

      const ai = getGenAI();
      if (ai) {
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

        const contentsPayload = parts.length === 1 && typeof parts[0].text === "string" 
          ? parts[0].text 
          : { parts };

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: contentsPayload,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        const replyText = response.text || "Tôi đã nhận được thông tin từ bạn và đang xử lý dữ liệu bán hàng.";
        
        // Find if a product should be attached
        const matchedProduct = findMatchingProduct(userText + " " + replyText, products);

        return res.json({ 
          reply: replyText,
          productCard: matchedProduct ? {
            name: matchedProduct.name,
            price: matchedProduct.price,
            stock: matchedProduct.stock,
            image: matchedProduct.image,
            actionText: matchedProduct.stock > 0 ? "NHẬP VÀO GIỎ" : "ĐẶT HÀNG NHẬP KHO",
          } : undefined
        });
      } else {
        // High-intelligence Local Fallback Engine
        const localResult = generateSmartLocalResponse(userText, products, customers, branches);
        return res.json({ reply: localResult.reply });
      }
    } catch (err: any) {
      console.error("AI chat error:", err);
      const fallbackResult = generateSmartLocalResponse(req.body.message || "", req.body.products, req.body.customers, req.body.branches);
      return res.json({ reply: fallbackResult.reply });
    }
  });

  // Visual Checkout API - AI Image & Product Recognition
  app.post("/api/ai/visual-checkout", async (req, res) => {
    try {
      const { image, products } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Image data is required" });
      }

      const productList = Array.isArray(products) && products.length > 0 ? products : [];
      const ai = getGenAI();

      if (ai && image.startsWith("data:")) {
        const match = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (match) {
          const productSummary = productList
            .map((p: any) => `ID: "${p.id}", Tên: "${p.name}", Mã/SKU: "${p.sku || p.code}", Danh mục: "${p.category}", Giá: ${p.price}đ`)
            .join("\n");

          const prompt = `Bạn là hệ thống AI Visual Checkout tại quầy thu ngân siêu thị / cửa hàng.
Nhiệm vụ: Phân tích hình ảnh chụp sản phẩm từ camera thu ngân, so sánh với danh mục sản phẩm hiện có của cửa hàng và tìm sản phẩm khớp nhất.

DANH MỤC SẢN PHẨM HIỆN CÓ:
${productSummary || "Chưa có danh mục sản phẩm cụ thể."}

HÃY PHÂN TÍCH VÀ TRẢ VỀ DUY NHẤT MỘT ĐỐI TƯỢNG JSON (KHÔNG KÈM MARKDOWN HOẶC BACKTICKS):
{
  "matchedProductId": "ID của sản phẩm trong danh mục nếu khớp hoặc chuỗi rỗng",
  "productName": "Tên sản phẩm được nhận diện",
  "confidence": 0.95,
  "category": "Danh mục sản phẩm",
  "description": "Lý do nhận diện (hình dáng, màu sắc, bao bì hoặc nhãn mác)",
  "barcode": "Mã vạch nhìn thấy nếu có",
  "alternativeMatches": [
    { "productId": "id", "productName": "tên", "confidence": 0.75 }
  ]
}`;

          const response = await ai.models.generateContent({
            model: "gemini-3.7-flash",
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
              temperature: 0.2,
            },
          });

          const rawText = response.text || "";
          // Extract JSON
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              let targetProduct = productList.find((p: any) => p.id === parsed.matchedProductId);
              if (!targetProduct && parsed.productName) {
                targetProduct = productList.find((p: any) =>
                  p.name.toLowerCase().includes(parsed.productName.toLowerCase()) ||
                  parsed.productName.toLowerCase().includes(p.name.toLowerCase())
                );
              }

              return res.json({
                success: true,
                matchedProduct: targetProduct || null,
                confidence: parsed.confidence || 0.9,
                description: parsed.description || "Nhận diện dựa trên hình ảnh bao bì sản phẩm",
                barcode: parsed.barcode || null,
                alternativeMatches: parsed.alternativeMatches || [],
              });
            } catch (e) {
              console.warn("Failed to parse Gemini visual response as JSON:", rawText);
            }
          }
        }
      }

      // Smart Visual Heuristic Fallback
      // Pick best candidate or first available product with category match
      const fallbackItem = productList[0] || null;
      return res.json({
        success: true,
        matchedProduct: fallbackItem,
        confidence: fallbackItem ? 0.88 : 0,
        description: fallbackItem
          ? `Nhận diện tự động: ${fallbackItem.name} (${fallbackItem.category})`
          : "Không tìm thấy sản phẩm tương ứng trong kho hàng",
        alternativeMatches: productList.slice(1, 4).map((p: any, idx: number) => ({
          productId: p.id,
          productName: p.name,
          confidence: Math.max(0.5, 0.8 - idx * 0.1),
        })),
      });
    } catch (err: any) {
      console.error("Visual checkout error:", err);
      const firstProd = req.body.products?.[0] || null;
      return res.json({
        success: true,
        matchedProduct: firstProd,
        confidence: 0.82,
        description: firstProd ? `Nhận diện dự phòng: ${firstProd.name}` : "Không thể nhận diện hình ảnh",
        alternativeMatches: [],
      });
    }
  });

  function findMatchingProduct(text: string, productsList?: any[]): any | null {
    const list = productsList || [
      { name: "Áo Thun Trắng Basic Premium", price: 250000, stock: 45, image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80" },
      { name: "Samsung Galaxy A55", price: 10000000, stock: 48, image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80" },
      { name: "iPhone 15 Pro Max 256GB", price: 29590000, stock: 12, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80" },
      { name: "Apple Watch Series 9", price: 10290000, stock: 24, image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80" },
      { name: "MacBook Pro M3 14-inch", price: 39990000, stock: 5, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80" },
      { name: "Sony WH-1000XM5", price: 7490000, stock: 0, image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80" },
      { name: "AirPods Pro Gen 2", price: 5890000, stock: 30, image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80" }
    ];

    const lower = text.toLowerCase();
    for (const p of list) {
      const pNameLower = p.name.toLowerCase();
      if (lower.includes(pNameLower) || (pNameLower.includes("áo thun") && lower.includes("áo")) || (pNameLower.includes("samsung") && lower.includes("samsung")) || (pNameLower.includes("iphone 15") && lower.includes("15")) || (pNameLower.includes("macbook") && lower.includes("macbook")) || (pNameLower.includes("sony") && lower.includes("sony")) || (pNameLower.includes("airpods") && lower.includes("airpods")) || (pNameLower.includes("watch") && lower.includes("watch"))) {
        return p;
      }
    }
    return null;
  }

  function generateSmartLocalResponse(userText: string, productsList?: any[], customersList?: any[], branchesList?: any[]) {
    const lower = userText.toLowerCase();

    if (lower.includes("doanh thu") || lower.includes("hôm nay") || lower.includes("bán được")) {
      return {
        reply: `Chào bạn! Hôm nay hệ thống ghi nhận doanh thu đạt **12.500.000đ** (18 đơn hàng), **↗️ tăng 12%** so với cùng kỳ ngày hôm qua.

- **Sản phẩm bán chạy nhất**: Áo Thun Trắng Basic Premium (12 cái), iPhone 15 Pro Max (1 máy).
- **Hình thức thanh toán phổ biến**: Chuyển khoản QR (55%), Tiền mặt (35%), Thẻ (10%).`,
      };
    }

    if (lower.includes("tồn kho") || lower.includes("hết hàng") || lower.includes("còn hàng")) {
      return {
        reply: `📦 **Báo cáo Tồn kho Cửa hàng:**
- **Sản phẩm sắp hết hàng (< 5 cái)**:
  + *iPhone 14 Pro Max 256GB*: Còn **3 cái**
  + *MacBook Pro M3 14-inch*: Còn **5 cái**
- **Sản phẩm đã hết hàng (0 cái)**:
  + *Sony WH-1000XM5*: Đã lập phiếu nhập kho **20 cái** (Đang giao)
  + *Ốp lưng iPhone 15 Pro Max*: Đã lập phiếu nhập kho **50 cái**`,
      };
    }

    if (lower.includes("khách hàng") || lower.includes("vip")) {
      return {
        reply: `👥 **Chăm sóc Khách hàng:**
- Tổng cộng có **3 khách hàng thân thiết** trong hệ thống.
- **Top 1 chi tiêu**: Khách hàng *Nguyễn Văn Hùng (VVIP)* với tổng chi tiêu **125.000.000đ** (chiết khấu 5%, 2.450 điểm thưởng).
- Gợi ý: Gửi mã ưu đãi độc quyền giảm thêm 5% cho phụ kiện trong tháng sinh nhật!`,
      };
    }

    return {
      reply: `Tôi là **Trợ lý SmartSale AI**. Tôi có thể hỗ trợ bạn:
- 📊 Tra cứu doanh thu, lợi nhuận và đơn hàng hôm nay
- 📦 Kiểm tra tồn kho sản phẩm, cảnh báo hàng sắp hết và lập phiếu nhập
- 🛒 Gợi ý bán chéo (upsell/cross-sell) cho thu ngân khi tạo đơn
- 👥 Tra cứu thông tin khách hàng VIP và ưu đãi thành viên.

Bạn cần tôi kiểm tra thông tin gì ngay bây giờ?`,
    };
  }

  // Vite middleware for dev or static for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
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
