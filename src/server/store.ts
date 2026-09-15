import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import {
  CartItem,
  Customer,
  Order,
  Product,
  PermissionAuditEntry,
  RestockOrder,
  ReturnRecord,
  StaffAuditEntry,
  StaffUser,
  WarrantyClaim,
} from '../types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_RESTOCK_ORDERS,
  INITIAL_STAFF,
} from '../data/initialData';

export interface StoreState {
  products: Product[];
  customers: Customer[];
  orders: Order[];
  restockOrders: RestockOrder[];
  staffList: StaffUser[];
  returns: ReturnRecord[];
  warrantyClaims: WarrantyClaim[];
  permissionAuditHistory: PermissionAuditEntry[];
  staffAuditHistory: StaffAuditEntry[];
}

const databasePath = path.join(process.cwd(), 'data', 'smartshop.sqlite');
fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const database = new Database(databasePath);
database.pragma('journal_mode = WAL');
database.exec(`
  CREATE TABLE IF NOT EXISTS store_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_sessions (
    token TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    user_agent TEXT,
    ip_address TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions (expires_at);
  CREATE INDEX IF NOT EXISTS idx_sessions_email ON user_sessions (email);
`);

const seedState: StoreState = {
  products: INITIAL_PRODUCTS,
  customers: INITIAL_CUSTOMERS,
  orders: INITIAL_ORDERS,
  restockOrders: INITIAL_RESTOCK_ORDERS,
  staffList: INITIAL_STAFF,
  returns: [],
  warrantyClaims: [],
  permissionAuditHistory: [],
  staffAuditHistory: [],
};

const existingState = database.prepare('SELECT payload FROM store_state WHERE id = 1').get() as
  | { payload: string }
  | undefined;

if (!existingState) {
  database
    .prepare('INSERT INTO store_state (id, payload, updated_at) VALUES (1, ?, ?)')
    .run(JSON.stringify(seedState), new Date().toISOString());
}

export function getStoreState(): StoreState {
  const row = database.prepare('SELECT payload FROM store_state WHERE id = 1').get() as { payload: string };
  const parsed = JSON.parse(row.payload) as Partial<StoreState>;
  return {
    ...seedState,
    ...parsed,
    returns: parsed.returns || [],
    warrantyClaims: parsed.warrantyClaims || [],
    permissionAuditHistory: parsed.permissionAuditHistory || [],
    staffAuditHistory: parsed.staffAuditHistory || [],
  };
}

export function replaceStoreState(state: StoreState): StoreState {
  const payload = JSON.stringify(state);
  const update = database.transaction(() => {
    database
      .prepare('UPDATE store_state SET payload = ?, updated_at = ? WHERE id = 1')
      .run(payload, new Date().toISOString());
  });
  update();
  return state;
}

export function clearBusinessData(): StoreState {
  const state = getStoreState();
  state.products = [];
  state.customers = [];
  state.orders = [];
  state.restockOrders = [];
  state.returns = [];
  state.warrantyClaims = [];
  return replaceStoreState(state);
}

export function checkoutStoreOrder(input: {
  items: Array<{ productId: string; quantity: number }>;
  customerId?: string;
  paymentMethod: Order['paymentMethod'];
  voucherCode?: string;
  cashier: string;
}) {
  const transaction = database.transaction(() => {
    const state = getStoreState();
    const items: CartItem[] = [];
    const quantities = new Map<string, number>();

    if (!['cash', 'bank_transfer', 'qr_code', 'card'].includes(input.paymentMethod)) {
      throw new Error('Phương thức thanh toán không hợp lệ.');
    }

    for (const requestedItem of input.items) {
      const quantity = Number(requestedItem.quantity);
      quantities.set(requestedItem.productId, (quantities.get(requestedItem.productId) || 0) + quantity);
    }

    for (const [productId, quantity] of quantities) {
      const product = state.products.find((candidate) => candidate.id === productId);
      if (!product || !Number.isInteger(quantity) || quantity <= 0) {
        throw new Error('Sản phẩm hoặc số lượng không hợp lệ.');
      }
      if (product.stock < quantity) {
        throw new Error(`Sản phẩm "${product.name}" chỉ còn ${product.stock} sản phẩm.`);
      }
      items.push({ product: { ...product }, quantity });
    }

    if (items.length === 0) throw new Error('Giỏ hàng không được để trống.');

    const customer = input.customerId
      ? state.customers.find((candidate) => candidate.id === input.customerId)
      : undefined;
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    let customerDiscount = 0;
    if (customer) {
      for (const item of items) {
        if (item.product.category === 'Phụ kiện' || customer.tier === 'VVIP') {
          customerDiscount += Math.round(item.product.price * item.quantity * (customer.discountPercent / 100));
        }
      }
    }

    const voucherCode = input.voucherCode?.trim().toUpperCase();
    const voucherDiscount = voucherCode === 'SMART10'
      ? Math.round(subtotal * 0.1)
      : voucherCode === 'GIAM500'
      ? 500000
      : voucherCode === 'CHAOBAN'
      ? 200000
      : 0;
    const discount = Math.min(subtotal, customerDiscount + voucherDiscount);
    const total = subtotal - discount;
    const now = new Date();
    const order: Order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      code: `HD-${Date.now().toString().slice(-8)}`,
      createdAt: now.toISOString().replace('T', ' ').substring(0, 16),
      customer,
      items,
      subtotal,
      discount,
      total,
      paymentMethod: input.paymentMethod,
      status: 'completed',
      cashier: input.cashier,
    };

    state.products = state.products.map((product) => {
      const item = items.find((candidate) => candidate.product.id === product.id);
      if (!item) return product;
      const stock = product.stock - item.quantity;
      return {
        ...product,
        stock,
        soldCount: (product.soldCount || 0) + item.quantity,
        status: stock === 0 ? 'out_of_stock' : stock <= 5 ? 'low_stock' : 'in_stock',
      };
    });
    state.orders = [order, ...state.orders];
    if (customer) {
      state.customers = state.customers.map((candidate) => candidate.id === customer.id
        ? { ...candidate, totalSpent: candidate.totalSpent + total, rewardPoints: candidate.rewardPoints + Math.round(total / 10000) }
        : candidate);
    }

    replaceStoreState(state);
    return { state, order };
  });
  return transaction();
}

export function createReturnRecord(input: { orderId: string; reason: string }) {
  const transaction = database.transaction(() => {
    const state = getStoreState();
    const order = state.orders.find((candidate) => candidate.id === input.orderId);
    if (!order || order.status !== 'completed') throw new Error('Chỉ có thể trả các hóa đơn đã hoàn tất.');
    if (state.returns.some((record) => record.orderId === input.orderId && record.status !== 'rejected')) {
      throw new Error('Hóa đơn này đã có yêu cầu trả hàng.');
    }
    if (!input.reason?.trim()) throw new Error('Vui lòng nhập lý do trả hàng.');

    state.products = state.products.map((product) => {
      const item = order.items.find((candidate) => candidate.product.id === product.id);
      if (!item) return product;
      const stock = product.stock + item.quantity;
      return { ...product, stock, soldCount: Math.max(0, (product.soldCount || 0) - item.quantity), status: stock <= 5 ? 'low_stock' : 'in_stock' };
    });
    state.orders = state.orders.map((candidate) => candidate.id === order.id ? { ...candidate, status: 'cancelled' } : candidate);
    if (order.customer) {
      state.customers = state.customers.map((customer) => customer.id === order.customer?.id
        ? { ...customer, totalSpent: Math.max(0, customer.totalSpent - order.total), rewardPoints: Math.max(0, customer.rewardPoints - Math.round(order.total / 10000)) }
        : customer);
    }
    state.returns = [{
      id: `return-${Date.now()}`,
      orderId: order.id,
      createdAt: new Date().toISOString(),
      reason: input.reason.trim(),
      total: order.total,
      status: 'pending_refund',
    }, ...state.returns];
    replaceStoreState(state);
    return state;
  });
  return transaction();
}

export function createWarrantyClaim(input: { orderId: string; productId: string; issue: string }) {
  const transaction = database.transaction(() => {
    const state = getStoreState();
    const order = state.orders.find((candidate) => candidate.id === input.orderId);
    if (!order || !order.items.some((item) => item.product.id === input.productId)) throw new Error('Sản phẩm không thuộc hóa đơn này.');
    if (!input.issue?.trim()) throw new Error('Vui lòng mô tả lỗi sản phẩm.');
    const claim: WarrantyClaim = {
      id: `warranty-${Date.now()}`,
      orderId: input.orderId,
      productId: input.productId,
      createdAt: new Date().toISOString(),
      issue: input.issue.trim(),
      status: 'pending',
    };
    state.warrantyClaims = [claim, ...state.warrantyClaims];
    replaceStoreState(state);
    return state;
  });
  return transaction();
}

export function restockStoreProduct(input: { productId: string; quantity: number; branch: string }) {
  const transaction = database.transaction(() => {
    const state = getStoreState();
    const quantity = Number(input.quantity);
    const product = state.products.find((candidate) => candidate.id === input.productId);
    if (!product || !Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Sản phẩm hoặc số lượng nhập không hợp lệ.');
    }

    state.restockOrders = [{
      id: `restock-${Date.now()}`,
      code: `PNK-${Date.now().toString().slice(-8)}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      product: { ...product },
      quantity,
      totalCost: quantity * product.costPrice,
      branch: input.branch,
      status: 'in_transit',
    }, ...state.restockOrders];
    replaceStoreState(state);
    return state;
  });
  return transaction();
}

export function receiveRestockOrder(restockOrderId: string) {
  const transaction = database.transaction(() => {
    const state = getStoreState();
    const restockOrder = state.restockOrders.find((candidate) => candidate.id === restockOrderId);
    if (!restockOrder) throw new Error('Không tìm thấy phiếu nhập kho.');
    if (restockOrder.status === 'completed') throw new Error('Phiếu nhập kho đã được nhận trước đó.');
    state.products = state.products.map((product) => {
      if (product.id !== restockOrder.product.id) return product;
      const stock = product.stock + restockOrder.quantity;
      return { ...product, stock, status: stock <= 5 ? 'low_stock' : 'in_stock' };
    });
    const receivedProduct = state.products.find((product) => product.id === restockOrder.product.id) || restockOrder.product;
    state.restockOrders = state.restockOrders.map((candidate) => candidate.id === restockOrderId
      ? { ...candidate, product: receivedProduct, status: 'completed' }
      : candidate);
    replaceStoreState(state);
    return state;
  });
  return transaction();
}

export function addStoreStaff(staffData: Omit<StaffUser, 'id'>): { state: StoreState; staff: StaffUser } {
  const transaction = database.transaction(() => {
    const state = getStoreState();
    const cleanEmail = String(staffData.email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Địa chỉ email không hợp lệ.');
    }
    if (state.staffList.some((s) => s.email.toLowerCase() === cleanEmail)) {
      throw new Error(`Email "${cleanEmail}" đã được sử dụng bởi một nhân sự khác!`);
    }

    const newStaff: StaffUser = {
      ...staffData,
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      email: cleanEmail,
      name: staffData.name?.trim() || 'Nhân viên mới',
      phone: staffData.phone?.trim() || '',
      role: staffData.role || 'cashier',
      status: staffData.status || 'active',
      branch: staffData.branch?.trim() || 'Cửa hàng chính',
    };

    state.staffList = [...state.staffList, newStaff];
    replaceStoreState(state);
    return { state, staff: newStaff };
  });
  return transaction();
}

export function updateStoreStaff(updatedStaff: StaffUser): StoreState {
  const transaction = database.transaction(() => {
    const state = getStoreState();
    const targetIndex = state.staffList.findIndex((s) => s.id === updatedStaff.id);
    if (targetIndex === -1) {
      throw new Error('Không tìm thấy tài khoản nhân viên cần cập nhật.');
    }

    const cleanEmail = String(updatedStaff.email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Địa chỉ email không hợp lệ.');
    }

    // Check if new email conflicts with another staff member
    const existingWithEmail = state.staffList.find(
      (s) => s.id !== updatedStaff.id && s.email.toLowerCase() === cleanEmail
    );
    if (existingWithEmail) {
      throw new Error(`Email "${cleanEmail}" đã được sử dụng bởi nhân sự "${existingWithEmail.name}".`);
    }

    state.staffList = state.staffList.map((s) =>
      s.id === updatedStaff.id
        ? {
            ...s,
            ...updatedStaff,
            email: cleanEmail,
          }
        : s
    );

    replaceStoreState(state);
    return state;
  });
  return transaction();
}

export function deleteStoreStaff(staffId: string): StoreState {
  const transaction = database.transaction(() => {
    const state = getStoreState();
    const target = state.staffList.find((s) => s.id === staffId);
    if (!target) {
      throw new Error('Không tìm thấy tài khoản nhân sự để xóa.');
    }

    // Safety guard: Cannot delete the last active admin
    if (
      target.role === 'admin' &&
      state.staffList.filter((s) => s.role === 'admin' && s.status === 'active').length <= 1
    ) {
      throw new Error('Không thể xóa tài khoản Admin đang hoạt động duy nhất của hệ thống.');
    }

    state.staffList = state.staffList.filter((s) => s.id !== staffId);
    replaceStoreState(state);
    return state;
  });
  return transaction();
}

export function addStoreProduct(productData: Partial<Product>): { state: StoreState; product: Product } {
  const transaction = database.transaction(() => {
    const state = getStoreState();
    const newProduct: Product = {
      id: productData.id || `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: productData.name?.trim() || 'Sản phẩm mới',
      code: productData.code?.trim() || `SP-${Math.floor(1000 + Math.random() * 9000)}`,
      sku: productData.sku?.trim() || productData.code?.trim() || `SKU-${Date.now()}`,
      category: productData.category?.trim() || 'Điện thoại',
      price: Number(productData.price) || 0,
      costPrice: Number(productData.costPrice) || Math.round((Number(productData.price) || 0) * 0.8),
      stock: Number(productData.stock) || 0,
      image: productData.image || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80',
      status: (Number(productData.stock) || 0) === 0 ? 'out_of_stock' : (Number(productData.stock) || 0) <= 5 ? 'low_stock' : 'in_stock',
      soldCount: 0,
    };
    state.products = [newProduct, ...state.products];
    replaceStoreState(state);
    return { state, product: newProduct };
  });
  return transaction();
}

export function updateStoreProduct(productData: Partial<Product> & { id: string }): StoreState {
  const transaction = database.transaction(() => {
    const state = getStoreState();
    const targetIndex = state.products.findIndex((p) => p.id === productData.id);
    if (targetIndex === -1) {
      throw new Error('Không tìm thấy sản phẩm cần cập nhật.');
    }
    const current = state.products[targetIndex];
    const newStock = productData.stock !== undefined ? Number(productData.stock) : current.stock;
    const updated: Product = {
      ...current,
      ...productData,
      stock: newStock,
      status: newStock === 0 ? 'out_of_stock' : newStock <= 5 ? 'low_stock' : 'in_stock',
    };
    state.products = state.products.map((p) => (p.id === productData.id ? updated : p));
    replaceStoreState(state);
    return state;
  });
  return transaction();
}

export function deleteStoreProduct(productId: string): StoreState {
  const transaction = database.transaction(() => {
    const state = getStoreState();
    const target = state.products.find((p) => p.id === productId);
    if (!target) {
      throw new Error('Không tìm thấy sản phẩm cần xóa.');
    }
    state.products = state.products.filter((p) => p.id !== productId);
    replaceStoreState(state);
    return state;
  });
  return transaction();
}

// ==========================================
// SQLITE PERSISTENT USER SESSIONS
// ==========================================
export interface UserSessionRecord {
  token: string;
  email: string;
  expiresAt: number;
  createdAt: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export function createStoreSession(
  token: string,
  email: string,
  expiresAt: number,
  userAgent?: string,
  ipAddress?: string
): void {
  database
    .prepare(`
      INSERT OR REPLACE INTO user_sessions (token, email, expires_at, created_at, user_agent, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(
      token,
      email.toLowerCase().trim(),
      expiresAt,
      new Date().toISOString(),
      userAgent || null,
      ipAddress || null
    );
}

export function getStoreSession(token: string): { token: string; email: string; expiresAt: number } | null {
  if (!token || typeof token !== 'string') return null;
  const row = database
    .prepare(`
      SELECT token, email, expires_at as expiresAt
      FROM user_sessions
      WHERE token = ?
    `)
    .get(token) as { token: string; email: string; expiresAt: number } | undefined;

  if (!row) return null;
  if (Date.now() > row.expiresAt) {
    deleteStoreSession(token);
    return null;
  }
  return row;
}

export function deleteStoreSession(token: string): void {
  if (!token || typeof token !== 'string') return;
  database.prepare('DELETE FROM user_sessions WHERE token = ?').run(token);
}

export function cleanExpiredStoreSessions(): number {
  const result = database.prepare('DELETE FROM user_sessions WHERE expires_at < ?').run(Date.now());
  return result.changes;
}


