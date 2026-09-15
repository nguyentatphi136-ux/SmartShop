export type HeliosTab =
  | 'dashboard'
  | 'portfolio'
  | 'analysis'
  | 'market'
  | 'community'
  | 'settings'
  | 'support';

export interface StockAsset {
  id: string;
  symbol: string;
  name: string;
  exchange: string; // 'NYSE' | 'NASDAQ'
  price: number;
  changeValue: number;
  changePercent: number;
  isPositive: boolean;
  unitsHeld?: number;
  holdingValue?: number;
  logoType: 'apple' | 'amazon' | 'microsoft' | 'nvidia' | 'spotify' | 'google' | 'tesla' | 'meta';
  category: 'most_viewed' | 'gain' | 'lose';
  marketCap?: string;
  volume?: string;
  dayHigh?: number;
  dayLow?: number;
  peRatio?: number;
  sparkline?: number[];
  analystRating?: 'Strong Buy' | 'Buy' | 'Hold' | 'Moderate Buy';
  description?: string;
}

export interface PerformancePoint {
  month: string;
  value: number;
  dateStr: string;
  change: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  totalHolding: number;
  timeframe: string;
  currency: string;
  cashBalance: number;
}

export interface AiInsightMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
  insightType?: 'bullish' | 'rebalance' | 'warning' | 'strategy';
  stockMention?: string;
}

export interface TransactionOrder {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  units: number;
  pricePerUnit: number;
  totalAmount: number;
  date: string;
  status: 'Executed' | 'Pending';
}

// Legacy types preserved for system stability
export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  image: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  soldCount?: number;
  brand?: string;
  sku?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tier: 'Chuẩn' | 'VIP' | 'VVIP';
  discountPercent: number;
  rewardPoints: number;
  totalSpent: number;
}

export interface Order {
  id: string;
  code: string;
  createdAt: string;
  customer?: Customer;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'qr_code' | 'card';
  status: 'completed' | 'pending' | 'cancelled';
  cashier: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  productCard?: {
    name: string;
    price: number;
    stock: number;
    image: string;
    actionText?: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  timeCategory: 'today' | 'yesterday' | 'week_ago';
  messages: ChatMessage[];
}

export interface WarehouseBranch {
  id: string;
  name: string;
  address: string;
  manager: string;
  phone: string;
  inventoryCount: number;
  inventoryValue: number;
}

export interface RestockOrder {
  id: string;
  code: string;
  createdAt: string;
  product: Product;
  quantity: number;
  totalCost: number;
  branch: string;
  status: 'completed' | 'in_transit' | 'pending';
}

export interface ReturnRecord {
  id: string;
  orderId: string;
  createdAt: string;
  reason: string;
  total: number;
  status: 'pending_refund' | 'refunded' | 'rejected';
}

export interface WarrantyClaim {
  id: string;
  orderId: string;
  productId: string;
  createdAt: string;
  issue: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'cashier' | 'inventory_staff';
  status: 'active' | 'inactive';
  branch: string;
  avatar?: string;
}

export interface PermissionAuditEntry {
  id: string;
  actorId: string;
  actorName: string;
  action: 'update' | 'reset';
  changedRoles: string[];
  changedModules: string[];
  createdAt: string;
}

export interface StaffAuditEntry {
  id: string;
  actorId: string;
  actorName: string;
  action: 'create' | 'update' | 'activate' | 'deactivate' | 'delete' | 'permission_update' | 'permission_reset' | 'impersonate';
  targetId?: string;
  targetName?: string;
  details?: string;
  createdAt: string;
}

export type MainTab =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'customers'
  | 'invoices'
  | 'restock'
  | 'inventory'
  | 'revenue-report'
  | 'analytics-report'
  | 'ai-assistant'
  | 'ai-analyst'
  | 'users-permissions'
  | 'settings'
  | 'support';

export interface RealtimeActivity {
  id: string;
  type: 'order' | 'restock' | 'stock_warning' | 'payment' | 'ai_insight';
  title: string;
  description: string;
  timestamp: string;
  createdAtMs: number;
  amount?: number;
  channel?: 'Cửa hàng POS' | 'Shopee Mall' | 'TikTok Shop' | 'Lazada' | 'Website Online';
  status?: 'success' | 'pending' | 'warning';
}
