import { MainTab, StaffUser } from '../types';

export type RoleType = 'admin' | 'manager' | 'cashier' | 'inventory_staff';

export interface PermissionModuleDef {
  key: string;
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  tabMapping?: MainTab;
  category: 'pos' | 'operations' | 'reports' | 'ai' | 'system';
}

export const PERMISSION_MODULES: PermissionModuleDef[] = [
  {
    key: 'pos_checkout',
    nameVi: 'Bán hàng & Thu ngân POS',
    nameEn: 'POS & Sales Checkout',
    descriptionVi: 'Tạo đơn hàng mới, quét mã vạch, thanh toán tiền mặt/chuyển khoản',
    tabMapping: 'pos',
    category: 'pos',
  },
  {
    key: 'products_view',
    nameVi: 'Xem Danh mục Sản phẩm & Giá bán',
    nameEn: 'View Product Catalog & Prices',
    descriptionVi: 'Tra cứu danh sách sản phẩm, giá bán, vị trí tồn kho',
    tabMapping: 'products',
    category: 'operations',
  },
  {
    key: 'products_manage',
    nameVi: 'Thêm, Sửa, Xóa Sản phẩm & Giá vốn',
    nameEn: 'Manage Products & Cost Prices',
    descriptionVi: 'Tạo sản phẩm mới, sửa giá bán, cập nhật giá vốn, xóa hàng',
    category: 'operations',
  },
  {
    key: 'customers_manage',
    nameVi: 'Quản lý Khách hàng & Tích điểm',
    nameEn: 'Customer Management & VIP Loyalty',
    descriptionVi: 'Tra cứu khách hàng, thêm mới khách hàng, chiết khấu hạng VIP/VVIP',
    tabMapping: 'customers',
    category: 'operations',
  },
  {
    key: 'invoices_manage',
    nameVi: 'Lịch sử Đơn hàng & In lại Hóa đơn',
    nameEn: 'Invoice History & Receipt Reprint',
    descriptionVi: 'Xem lịch sử hóa đơn bán hàng, tra cứu phiếu, in lại bill cho khách',
    tabMapping: 'invoices',
    category: 'operations',
  },
  {
    key: 'restock_manage',
    nameVi: 'Tạo & Duyệt Đơn Nhập kho',
    nameEn: 'Create & Approve Restock Orders',
    descriptionVi: 'Tạo đơn nhập hàng nhà cung cấp, duyệt xác nhận hàng về kho',
    tabMapping: 'restock',
    category: 'operations',
  },
  {
    key: 'inventory_check',
    nameVi: 'Kiểm kê Tồn kho & Cảnh báo hết hàng',
    nameEn: 'Inventory Valuation & Low Stock Alerts',
    descriptionVi: 'Theo dõi định giá kho, kiểm kê chênh lệch hàng, xử lý cảnh báo tồn',
    tabMapping: 'inventory',
    category: 'operations',
  },
  {
    key: 'revenue_reports',
    nameVi: 'Báo cáo Doanh thu & Lợi nhuận',
    nameEn: 'Revenue & Profit Reports',
    descriptionVi: 'Xem biểu đồ doanh thu, lãi ròng, tỷ suất lợi nhuận và dòng tiền',
    tabMapping: 'revenue-report',
    category: 'reports',
  },
  {
    key: 'analytics_reports',
    nameVi: 'Báo cáo Phân tích Chuyên sâu',
    nameEn: 'Deep Business Analytics',
    descriptionVi: 'Phân tích doanh số theo nhóm ngành, tốc độ quay vòng hàng hóa',
    tabMapping: 'analytics-report',
    category: 'reports',
  },
  {
    key: 'ai_assistant',
    nameVi: 'Trợ lý AI & Chatbot bán hàng',
    nameEn: 'AI Copilot & Sales Chatbot',
    descriptionVi: 'Hỏi đáp số liệu, tìm sản phẩm nhanh, tư vấn chốt đơn cho nhân viên',
    tabMapping: 'ai-assistant',
    category: 'ai',
  },
  {
    key: 'ai_analyst',
    nameVi: 'Chuyên gia AI Phân tích Chiến lược',
    nameEn: 'AI Strategic Business Analyst',
    descriptionVi: 'Dự báo xu hướng mua hàng, đề xuất combo tăng doanh số, tối ưu giá',
    tabMapping: 'ai-analyst',
    category: 'ai',
  },
  {
    key: 'users_permissions',
    nameVi: 'Quản trị Nhân sự & Phân quyền (RBAC)',
    nameEn: 'Staff Management & Role Permissions',
    descriptionVi: 'Thêm tài khoản nhân viên, cấu hình ma trận phân quyền, khóa truy cập',
    tabMapping: 'users-permissions',
    category: 'system',
  },
  {
    key: 'settings_manage',
    nameVi: 'Cài đặt Cửa hàng & Dữ liệu Thực tế',
    nameEn: 'Store Settings & Real Data Management',
    descriptionVi: 'Cấu hình thông tin cửa hàng, xóa đơn mẫu, nhập xuất file Excel',
    tabMapping: 'settings',
    category: 'system',
  },
];

export type RolePermissionsMatrix = Record<RoleType, Record<string, boolean>>;

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionsMatrix = {
  admin: {
    pos_checkout: true,
    products_view: true,
    products_manage: true,
    customers_manage: true,
    invoices_manage: true,
    restock_manage: true,
    inventory_check: true,
    revenue_reports: true,
    analytics_reports: true,
    ai_assistant: true,
    ai_analyst: true,
    users_permissions: true,
    settings_manage: true,
  },
  manager: {
    pos_checkout: true,
    products_view: true,
    products_manage: true,
    customers_manage: true,
    invoices_manage: true,
    restock_manage: true,
    inventory_check: true,
    revenue_reports: true,
    analytics_reports: true,
    ai_assistant: true,
    ai_analyst: true,
    users_permissions: false, // Only Admin can manage RBAC
    settings_manage: true,
  },
  cashier: {
    pos_checkout: true,
    products_view: true, // Can view prices to consult customers
    products_manage: false, // Cannot edit prices or delete products
    customers_manage: true, // Can look up & add customers
    invoices_manage: true, // Can view invoices and reprint receipts
    restock_manage: false, // Cannot access restock orders
    inventory_check: false, // Cannot access inventory valuation
    revenue_reports: false, // Confidential finance data
    analytics_reports: false, // Confidential analytics
    ai_assistant: true, // Can use AI assistant to look up items
    ai_analyst: false, // High level business strategy
    users_permissions: false,
    settings_manage: false,
  },
  inventory_staff: {
    pos_checkout: false, // Not handling checkout counter
    products_view: true,
    products_manage: true, // Can update inventory items
    customers_manage: false,
    invoices_manage: false,
    restock_manage: true, // Primary duty: Restock
    inventory_check: true, // Primary duty: Inventory counts
    revenue_reports: false, // Confidential finance data
    analytics_reports: false,
    ai_assistant: true, // Can ask about inventory
    ai_analyst: true, // Can see stock forecasts
    users_permissions: false,
    settings_manage: false,
  },
};

const STORAGE_KEY_PERMISSIONS = 'smartsale_role_permissions_v1';

export function getStoredRolePermissions(): RolePermissionsMatrix {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PERMISSIONS);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with default to guarantee all keys exist
      return {
        admin: { ...DEFAULT_ROLE_PERMISSIONS.admin, ...(parsed.admin || {}) },
        manager: { ...DEFAULT_ROLE_PERMISSIONS.manager, ...(parsed.manager || {}) },
        cashier: { ...DEFAULT_ROLE_PERMISSIONS.cashier, ...(parsed.cashier || {}) },
        inventory_staff: { ...DEFAULT_ROLE_PERMISSIONS.inventory_staff, ...(parsed.inventory_staff || {}) },
      };
    }
  } catch (e) {
    console.error('Error loading stored permissions:', e);
  }
  return DEFAULT_ROLE_PERMISSIONS;
}

export function saveRolePermissions(matrix: RolePermissionsMatrix): void {
  try {
    localStorage.setItem(STORAGE_KEY_PERMISSIONS, JSON.stringify(matrix));
  } catch (e) {
    console.error('Error saving role permissions:', e);
  }
}

export function resetRolePermissionsToDefault(): RolePermissionsMatrix {
  try {
    localStorage.removeItem(STORAGE_KEY_PERMISSIONS);
  } catch (e) {}
  return DEFAULT_ROLE_PERMISSIONS;
}

export function canUserAccessModule(
  user: StaffUser | null | undefined,
  moduleKey: string,
  customMatrix?: RolePermissionsMatrix
): boolean {
  if (!user) return false;
  if (user.status === 'inactive') return false;
  if (user.role === 'admin') return true;

  const matrix = customMatrix || getStoredRolePermissions();
  const rolePerms = matrix[user.role];
  if (!rolePerms) return false;

  return !!rolePerms[moduleKey];
}

export function canUserAccessTab(
  user: StaffUser | null | undefined,
  tab: MainTab,
  customMatrix?: RolePermissionsMatrix
): boolean {
  if (!user) return false;
  if (user.status === 'inactive') return false;
  if (user.role === 'admin') return true;

  // Always allow dashboard for all active staff (it shows role-appropriate metrics)
  if (tab === 'dashboard') return true;
  if (tab === 'support') return true;

  const mapping: Record<MainTab, string> = {
    dashboard: '',
    pos: 'pos_checkout',
    products: 'products_view',
    customers: 'customers_manage',
    invoices: 'invoices_manage',
    restock: 'restock_manage',
    inventory: 'inventory_check',
    'revenue-report': 'revenue_reports',
    'analytics-report': 'analytics_reports',
    'ai-assistant': 'ai_assistant',
    'ai-analyst': 'ai_analyst',
    'users-permissions': 'users_permissions',
    settings: 'settings_manage',
    support: '',
  };

  const moduleKey = mapping[tab];
  if (!moduleKey) return true;

  return canUserAccessModule(user, moduleKey, customMatrix);
}

export function getRoleDetails(role: RoleType, lang: 'vi' | 'en' = 'vi') {
  switch (role) {
    case 'admin':
      return {
        label: lang === 'vi' ? 'Chủ cửa hàng (Admin)' : 'Store Owner (Admin)',
        shortLabel: lang === 'vi' ? 'Chủ cửa hàng' : 'Admin',
        badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        description: lang === 'vi'
          ? 'Toàn quyền tối cao: Quản lý doanh thu, nhân sự, bảng giá, kho hàng và cấu hình hệ thống'
          : 'Full root access to all store revenue, staff permissions, catalog & settings',
      };
    case 'manager':
      return {
        label: lang === 'vi' ? 'Quản lý cửa hàng (Manager)' : 'Store Manager',
        shortLabel: lang === 'vi' ? 'Quản lý' : 'Manager',
        badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        description: lang === 'vi'
          ? 'Điều hành bán hàng, xem báo cáo doanh thu, nhập hàng và quản lý sản phẩm'
          : 'Store management, revenue reports, restock orders and product catalog',
      };
    case 'cashier':
      return {
        label: lang === 'vi' ? 'Thu ngân POS (Cashier)' : 'POS Cashier',
        shortLabel: lang === 'vi' ? 'Thu ngân' : 'Cashier',
        badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        description: lang === 'vi'
          ? 'Bán hàng tại quầy, tra cứu hóa đơn, tích điểm thành viên (không xem báo cáo tài chính mật)'
          : 'Point of Sale billing, customer lookups, receipt reprints',
      };
    case 'inventory_staff':
      return {
        label: lang === 'vi' ? 'Nhân viên Kho (Inventory)' : 'Inventory Staff',
        shortLabel: lang === 'vi' ? 'Nhân viên kho' : 'Inventory',
        badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        description: lang === 'vi'
          ? 'Tạo đơn nhập hàng, kiểm kê chênh lệch kho, quản lý danh mục hàng hóa'
          : 'Stock in/out management, inventory counts, catalog adjustments',
      };
  }
}
