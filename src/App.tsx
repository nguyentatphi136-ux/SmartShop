import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MainTab,
  Product,
  Customer,
  CartItem,
  Order,
  RestockOrder,
  StaffUser,
  ChatSession,
  ChatMessage,
  RealtimeActivity,
  PermissionAuditEntry,
  StaffAuditEntry,
} from './types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_RESTOCK_ORDERS,
  INITIAL_STAFF,
  INITIAL_CHAT_SESSIONS,
} from './data/initialData';
import { soundManager } from './utils/audioChime';
import { formatCurrency } from './utils/formatters';
import { useLanguage } from './utils/i18n';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { DashboardScreen } from './components/DashboardScreen';
import { PosScreen } from './components/PosScreen';
import { ProductsScreen } from './components/ProductsScreen';
import { CustomersScreen } from './components/CustomersScreen';
import { InvoicesScreen } from './components/InvoicesScreen';
import { InventoryBranchScreen } from './components/InventoryBranchScreen';
import { RevenueReportScreen, AnalyticsReportScreen } from './components/ReportsScreen';
import { AiAssistantScreen } from './components/AiAssistantScreen';
import { AiAnalystScreen } from './components/AiAnalystScreen';
import { UsersPermissionsScreen } from './components/UsersPermissionsScreen';
import {
  AddEditProductModal,
  CustomerSelectModal,
  CheckoutReceiptModal,
  RestockModal,
  ReportModal,
  UpgradeProModal,
  RealDataManagerModal,
} from './components/Modals';
import { MobileCompanionScanner } from './components/MobileCompanionScanner';
import { LoginScreen } from './components/LoginScreen';
import {
  canUserAccessTab,
  canUserAccessModule,
  getRoleDetails,
  getStoredRolePermissions,
  saveRolePermissions,
  resetRolePermissionsToDefault,
  RolePermissionsMatrix,
  RoleType,
} from './utils/permissions';
import { ShieldAlert, Lock, ArrowLeft, ArrowRight, UserCheck, Shield } from 'lucide-react';

const INITIAL_ACTIVITIES: RealtimeActivity[] = [
  {
    id: 'act-1',
    type: 'order',
    title: 'Đơn hàng mới trực tuyến',
    description: 'Samsung Galaxy S24 Ultra vừa được thanh toán VietQR.',
    timestamp: new Date(Date.now() - 35000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    createdAtMs: Date.now() - 35000,
    amount: 27990000,
    channel: 'Shopee Mall',
    status: 'success',
  },
  {
    id: 'act-2',
    type: 'order',
    title: 'Đơn POS tại quầy',
    description: 'Khách hàng VIP Nguyễn Văn A thanh toán thẻ Visa.',
    timestamp: new Date(Date.now() - 95000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    createdAtMs: Date.now() - 95000,
    amount: 14500000,
    channel: 'Cửa hàng POS',
    status: 'success',
  },
  {
    id: 'act-3',
    type: 'stock_warning',
    title: 'Cảnh báo tồn kho tối thiểu',
    description: 'MacBook Pro M3 14 inch chỉ còn 5 chiếc trong kho Quận 1.',
    timestamp: new Date(Date.now() - 240000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    createdAtMs: Date.now() - 240000,
    channel: 'Cửa hàng POS',
    status: 'warning',
  },
  {
    id: 'act-4',
    type: 'ai_insight',
    title: 'SmartSale AI Dự báo Doanh thu',
    description: 'Doanh số hôm nay tăng 14.8% so với cùng giờ hôm qua.',
    timestamp: new Date(Date.now() - 600000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    createdAtMs: Date.now() - 600000,
    channel: 'Website Online',
    status: 'success',
  },
];

export function App() {
  const { language, t, formatCurr } = useLanguage();
  // Navigation & theme state
  const [currentTab, setCurrentTab] = useState<MainTab>('dashboard');

  useEffect(() => {
    if ((currentTab as string) === 'restock') setCurrentTab('inventory');
  }, [currentTab]);
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('smartsale_dark_mode') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; sub?: string } | null>(null);

  const showToast = useCallback((text: string, sub?: string) => {
    setToastMessage({ text, sub });
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Core Data State (Persistent with localStorage for real single-store operations)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('smartsale_products_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PRODUCTS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem('smartsale_customers_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CUSTOMERS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('smartsale_orders_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ORDERS;
  });

  const [restockOrders, setRestockOrders] = useState<RestockOrder[]>(() => {
    try {
      const saved = localStorage.getItem('smartsale_restock_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_RESTOCK_ORDERS;
  });

  const [staffList, setStaffList] = useState<StaffUser[]>(() => {
    try {
      const saved = localStorage.getItem('smartsale_staff_list_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_STAFF;
  });

  useEffect(() => {
    try {
      localStorage.setItem('smartsale_staff_list_v2', JSON.stringify(staffList));
    } catch (e) {}
  }, [staffList]);

  // Role-Based Access Control (RBAC) Permissions Matrix
  const [rolePermissions, setRolePermissions] = useState<RolePermissionsMatrix>(() => {
    return getStoredRolePermissions();
  });
  const [permissionAuditHistory, setPermissionAuditHistory] = useState<PermissionAuditEntry[]>([]);
  const [staffAuditHistory, setStaffAuditHistory] = useState<StaffAuditEntry[]>([]);

  const recordStaffAudit = async (action: StaffAuditEntry['action'], target?: StaffUser, details?: string) => {
    const token = localStorage.getItem('smartsale_session_token');
    if (!token) {
      showToast('Không thể lưu lịch sử nhân viên', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      return;
    }
    try {
      const response = await fetch('/api/store/staff/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, targetId: target?.id, targetName: target?.name, details }),
      });
      const data = await response.json();
      if (response.ok && data.success) setStaffAuditHistory(data.history);
      else showToast('Không thể lưu lịch sử nhân viên', data.error || 'Vui lòng thử lại');
    } catch (error) {
      console.error('Staff audit persistence failed:', error);
      showToast('Không thể kết nối máy chủ audit', 'Lịch sử thao tác nhân viên chưa được lưu');
    }
  };

  const recordPermissionAudit = async (action: 'update' | 'reset', previous: RolePermissionsMatrix, next: RolePermissionsMatrix) => {
    const changedRoles = (Object.keys(next) as RoleType[]).filter((role) => JSON.stringify(previous[role]) !== JSON.stringify(next[role]));
    const changedModules = Array.from(new Set(changedRoles.flatMap((role) =>
      Object.keys(next[role]).filter((module) => previous[role][module] !== next[role][module])
    )));
    const token = localStorage.getItem('smartsale_session_token');
    if (!token) return;
    try {
      const response = await fetch('/api/store/permissions/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, changedRoles, changedModules }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPermissionAuditHistory(data.history);
      } else {
        showToast('Không thể lưu lịch sử phân quyền', data.error || 'Vui lòng đăng nhập lại và thử lại');
      }
    } catch (error) {
      console.error('Permission audit persistence failed:', error);
      showToast('Không thể kết nối máy chủ audit', 'Lịch sử chưa được lưu');
    }
  };

  const handleUpdateRolePermissions = (matrix: RolePermissionsMatrix) => {
    const previous = rolePermissions;
    setRolePermissions(matrix);
    saveRolePermissions(matrix);
    void recordPermissionAudit('update', previous, matrix);
    void recordStaffAudit('permission_update', undefined, 'Cập nhật ma trận phân quyền');
    showToast('Đã cập nhật phân quyền', 'Ma trận quyền hạn mới đã có hiệu lực trên toàn hệ thống');
  };

  const handleResetRolePermissions = () => {
    const previous = rolePermissions;
    const defaultMatrix = resetRolePermissionsToDefault();
    setRolePermissions(defaultMatrix);
    void recordPermissionAudit('reset', previous, defaultMatrix);
    void recordStaffAudit('permission_reset', undefined, 'Khôi phục ma trận phân quyền mặc định');
    showToast('Đã khôi phục phân quyền mặc định', 'Tất cả vai trò đã quay về quyền hạn ban đầu');
  };

  // Impersonation / Test Role mode for Store Admin
  const [originalAdminUser, setOriginalAdminUser] = useState<StaffUser | null>(null);

  const handleImpersonateStaff = (staff: StaffUser) => {
    if (!originalAdminUser && currentUser?.role === 'admin') {
      setOriginalAdminUser(currentUser);
    }
    setCurrentUser(staff);
    void recordStaffAudit('impersonate', staff, 'Bắt đầu trải nghiệm thử vai trò');
    if (!canUserAccessTab(staff, currentTab, rolePermissions)) {
      if (staff.role === 'cashier') {
        setCurrentTab('pos');
      } else if (staff.role === 'inventory_staff') {
        setCurrentTab('inventory');
      } else {
        setCurrentTab('dashboard');
      }
    }
    showToast(
      `Đang trải nghiệm vai trò: ${staff.name}`,
      `Vai trò: ${getRoleDetails(staff.role, language).label}`
    );
  };

  const handleExitImpersonation = () => {
    if (originalAdminUser) {
      setCurrentUser(originalAdminUser);
      setOriginalAdminUser(null);
      showToast('Đã quay lại tài khoản Chủ cửa hàng (Admin)');
    }
  };

  const handleSwitchRoleToTest = (role: RoleType) => {
    if (currentUser?.role === role) return;

    if (role === 'admin') {
      handleExitImpersonation();
      return;
    }

    const targetStaff = staffList.find((s) => s.role === role);
    if (targetStaff) {
      handleImpersonateStaff(targetStaff);
    } else {
      const virtualStaff: StaffUser = {
        id: `virtual-${role}`,
        name: `Nhân sự ${getRoleDetails(role, language).shortLabel}`,
        email: `${role}@smartsale.vn`,
        phone: '0901234567',
        role,
        status: 'active',
        branch: 'Chi nhánh Quận 1',
      };
      handleImpersonateStaff(virtualStaff);
    }
  };

  const requestStoreMutation = async (path: string, method: 'POST' | 'PATCH' | 'DELETE' | 'PUT', body?: unknown) => {
    const token = localStorage.getItem('smartsale_session_token');
    if (!token) throw new Error('Phiên đăng nhập đã hết hạn.');
    const response = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || 'Không thể cập nhật dữ liệu.');
    return data;
  };

  // Staff CRUD Handlers
  const handleAddStaff = async (newStaffData: Omit<StaffUser, 'id'>) => {
    try {
      const data = await requestStoreMutation('/api/store/staff', 'POST', newStaffData);
      const newStaff: StaffUser = data.staff;
      setStaffList(data.state.staffList);
      void recordStaffAudit('create', newStaff, `Tạo tài khoản với vai trò ${newStaff.role}`);
      showToast(
        `Đã thêm nhân viên: ${newStaff.name}`,
        `Vai trò: ${getRoleDetails(newStaff.role, language).label}`
      );
    } catch (error) {
      showToast('Không thể tạo nhân sự', error instanceof Error ? error.message : 'Vui lòng thử lại');
    }
  };

  const handleUpdateStaff = async (updatedStaff: StaffUser) => {
    const previousStaff = staffList.find((staff) => staff.id === updatedStaff.id);
    try {
      const data = await requestStoreMutation(`/api/store/staff/${updatedStaff.id}`, 'PUT', updatedStaff);
      setStaffList(data.state.staffList);
      const action = previousStaff?.status !== updatedStaff.status
        ? updatedStaff.status === 'active' ? 'activate' : 'deactivate'
        : 'update';
      void recordStaffAudit(action, updatedStaff, `Cập nhật nhân sự${previousStaff?.role !== updatedStaff.role ? `, đổi vai trò từ ${previousStaff?.role} sang ${updatedStaff.role}` : ''}`);
      if (currentUser?.id === updatedStaff.id) {
        setCurrentUser(updatedStaff);
        try {
          localStorage.setItem('smartsale_auth_user', JSON.stringify(updatedStaff));
        } catch (e) {}
      }
      showToast(`Đã cập nhật nhân sự: ${updatedStaff.name}`);
    } catch (error) {
      showToast('Không thể cập nhật nhân sự', error instanceof Error ? error.message : 'Vui lòng thử lại');
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    const staffToDelete = staffList.find((s) => s.id === staffId);
    try {
      const data = await requestStoreMutation(`/api/store/staff/${staffId}`, 'DELETE');
      setStaffList(data.state.staffList);
      void recordStaffAudit('delete', staffToDelete, 'Xóa tài khoản nhân viên');
      showToast(`Đã xóa tài khoản: ${staffToDelete?.name || staffId}`);
    } catch (error) {
      showToast('Không thể xóa nhân sự', error instanceof Error ? error.message : 'Vui lòng thử lại');
    }
  };

  // Authentication State (Email login with OTP Verification)
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('smartsale_session_token');
    if (!token) {
      setIsAuthChecking(false);
      return;
    }

    fetch('/api/auth/session', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('Session expired');
        const data = await response.json();
        setCurrentUser(data.user);
        localStorage.setItem('smartsale_auth_user', JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem('smartsale_session_token');
        localStorage.removeItem('smartsale_auth_user');
        setCurrentUser(null);
      })
      .finally(() => setIsAuthChecking(false));
  }, []);

  useEffect(() => {
    if (isAuthChecking || !currentUser) return;

    const token = localStorage.getItem('smartsale_session_token');
    if (!token) return;

    fetch('/api/store/state', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('Không thể tải dữ liệu cửa hàng');
        const data = await response.json();
        setProducts(data.state.products);
        setCustomers(data.state.customers);
        setOrders(data.state.orders);
        setRestockOrders(data.state.restockOrders);
        setStaffList(data.state.staffList);
        setPermissionAuditHistory(data.state.permissionAuditHistory || []);
        setStaffAuditHistory(data.state.staffAuditHistory || []);
      })
      .catch((error) => {
        console.error('Store state loading failed:', error);
      });
  }, [currentUser, isAuthChecking]);

  const handleLogout = useCallback(() => {
    const token = localStorage.getItem('smartsale_session_token');
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    try {
      localStorage.removeItem('smartsale_auth_user');
      localStorage.removeItem('smartsale_session_token');
    } catch (e) {}
    setCurrentUser(null);
    setOriginalAdminUser(null);
    showToast('Đã đăng xuất tài khoản thành công', 'Vui lòng đăng nhập lại khi cần sử dụng');
  }, [showToast]);

  // Check if opened via Phone Companion Scanner QR Code (e.g. ?scannerSession=POS-8888)
  const [mobileScannerSession, setMobileScannerSession] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('scannerSession') || params.get('session');
    }
    return null;
  });

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('smartsale_products_v2', JSON.stringify(products));
    } catch (e) {}
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('smartsale_customers_v2', JSON.stringify(customers));
    } catch (e) {}
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem('smartsale_orders_v2', JSON.stringify(orders));
    } catch (e) {}
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('smartsale_restock_v2', JSON.stringify(restockOrders));
    } catch (e) {}
  }, [restockOrders]);

  useEffect(() => {
    try {
      localStorage.setItem('smartsale_dark_mode', String(isDark));
    } catch (e) {}
  }, [isDark]);

  // Real-time Engine State
  const [realtimeActivities, setRealtimeActivities] = useState<RealtimeActivity[]>([]);
  const [isAutoStreamActive, setIsAutoStreamActive] = useState<boolean>(false);
  const [streamIntervalSeconds, setStreamIntervalSeconds] = useState<number>(20);
  const [latestActivity, setLatestActivity] = useState<RealtimeActivity | null>(null);

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // AI Assistant Chat State
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(INITIAL_CHAT_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>(INITIAL_CHAT_SESSIONS[0].id);

  // Modals state
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCustomerSelectModalOpen, setIsCustomerSelectModalOpen] = useState<boolean>(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState<boolean>(false);
  const [restockProductId, setRestockProductId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [isRealDataModalOpen, setIsRealDataModalOpen] = useState<boolean>(false);
  const [lastCheckoutOrder, setLastCheckoutOrder] = useState<{
    cart: CartItem[];
    customer: Customer | null;
    paymentMethod: string;
    total: number;
  } | null>(null);

  // SmartShop runs only with real store data.
  const dataMode = 'real' as const;

  // Real Data Handlers
  const handleClearSampleOrders = async () => {
    const token = localStorage.getItem('smartsale_session_token');
    if (!token) {
      showToast('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại');
      return;
    }

    try {
      const response = await fetch('/api/store/real-mode/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Không thể xóa dữ liệu mẫu.');
      setProducts(data.state.products);
      setCustomers(data.state.customers);
      setOrders(data.state.orders);
      setRestockOrders(data.state.restockOrders);
      setSelectedCustomer(null);
      setCart([]);
      setRealtimeActivities([]);
      setLatestActivity(null);
      showToast('Đã chuyển sang dữ liệu thật', 'Toàn bộ sản phẩm, khách hàng, đơn hàng và phiếu nhập mẫu đã được xóa');
    } catch (error) {
      showToast('Không thể chuyển sang dữ liệu thật', error instanceof Error ? error.message : 'Vui lòng thử lại');
    }
  };

  const handleSetDataMode = async (
    newMode: 'demo' | 'real',
    option?: 'clear_orders' | 'blank_store' | 'keep'
  ) => {
    if (newMode === 'real') await handleClearSampleOrders();
  };

  const handleResetStoreToEmpty = async () => {
    await handleClearSampleOrders();
    setCustomers([]);
    setCart([]);
    setRealtimeActivities([]);
    setLatestActivity(null);
    showToast(
      language === 'vi' ? 'Đã dọn kho sạch sẽ' : 'Store cleared',
      language === 'vi' ? 'Bạn có thể tự do nhập danh sách sản phẩm thật của mình' : 'You can now import your real product list'
    );
  };

  const handleImportProducts = (importedProducts: Product[]) => {
    setProducts(importedProducts);
    showToast(
      language === 'vi' ? 'Đã nhập danh sách sản phẩm thật' : 'Products imported',
      `${importedProducts.length} ${language === 'vi' ? 'sản phẩm đã cập nhật vào kho hàng' : 'products updated to inventory'}`
    );
  };

  const handleRestoreSampleData = () => {
    showToast('Dữ liệu mẫu đã bị vô hiệu hóa', 'SmartShop chỉ sử dụng dữ liệu thật');
  };

  // Sync dark mode class with HTML
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Realtime Order Generator Function
  const generateSimulatedRealtimeOrder = useCallback(() => {
    // Pick 1-2 random products with stock
    const availableProducts = products.filter((p) => p.stock > 0);
    if (availableProducts.length === 0) return;

    const randomProd = availableProducts[Math.floor(Math.random() * availableProducts.length)];
    const qty = Math.min(randomProd.stock, Math.floor(Math.random() * 2) + 1);
    const orderTotal = randomProd.price * qty;

    const channels: ('Shopee Mall' | 'TikTok Shop' | 'Lazada' | 'Website Online' | 'Cửa hàng POS')[] = [
      'Shopee Mall',
      'TikTok Shop',
      'Lazada',
      'Website Online',
      'Cửa hàng POS',
    ];
    const randomChannel = channels[Math.floor(Math.random() * channels.length)];

    const randomNames = [
      'Trần Minh Hoàng',
      'Lê Thị Thu Thảo',
      'Phạm Quốc Bảo',
      'Hoàng Ngọc Ánh',
      'Đặng Thanh Tùng',
      'Vũ Mai Phương',
    ];
    const buyerName = randomNames[Math.floor(Math.random() * randomNames.length)];

    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const orderCode = `HD-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create Order Object
    const newOrder: Order = {
      id: `ord-rt-${Date.now()}`,
      code: orderCode,
      createdAt: now.toISOString().replace('T', ' ').substring(0, 16),
      customer: {
        id: `cust-rt-${Date.now()}`,
        name: buyerName,
        phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
        tier: 'Chuẩn',
        discountPercent: 0,
        rewardPoints: Math.round(orderTotal / 10000),
        totalSpent: orderTotal,
      },
      items: [{ product: randomProd, quantity: qty }],
      subtotal: orderTotal,
      discount: 0,
      total: orderTotal,
      paymentMethod: randomChannel === 'Cửa hàng POS' ? 'cash' : 'qr_code',
      status: 'completed',
      cashier: `Hệ thống (${randomChannel})`,
    };

    // Deduct stock
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === randomProd.id) {
          const newStock = Math.max(0, p.stock - qty);
          return {
            ...p,
            stock: newStock,
            soldCount: (p.soldCount || 0) + qty,
            status: newStock === 0 ? 'out_of_stock' : newStock <= 5 ? 'low_stock' : 'in_stock',
          };
        }
        return p;
      })
    );

    // Add to Orders
    setOrders((prev) => [newOrder, ...prev]);

    // Create Activity Item
    const newActivity: RealtimeActivity = {
      id: `act-${Date.now()}`,
      type: 'order',
      title: `Đơn hàng #${orderCode} (${randomChannel})`,
      description: `${buyerName} vừa mua ${qty}x ${randomProd.name}`,
      timestamp: timeStr,
      createdAtMs: Date.now(),
      amount: orderTotal,
      channel: randomChannel,
      status: 'success',
    };

    setRealtimeActivities((prev) => [newActivity, ...prev.slice(0, 25)]);
    setLatestActivity(newActivity);

    // Audio chime & Toast
    soundManager.playCashRegisterChime();
    showToast(
      `⚡ Đơn mới #${orderCode} (${randomChannel})`,
      `${qty}x ${randomProd.name} • +${formatCurrency(orderTotal)}`
    );
  }, [products]);

  // Real-time Stream Interval Effect
  useEffect(() => {
    if (!isAutoStreamActive) return;

    const interval = setInterval(() => {
      generateSimulatedRealtimeOrder();
    }, streamIntervalSeconds * 1000);

    return () => clearInterval(interval);
  }, [isAutoStreamActive, streamIntervalSeconds, generateSimulatedRealtimeOrder]);

  // POS Handlers
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      showToast(`⚠️ Sản phẩm "${product.name}" hiện đang hết hàng trong kho!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`⚠️ Đã đạt số lượng tồn kho tối đa (${product.stock} cái)`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    showToast(`🛒 Đã thêm vào giỏ`, `${product.name} (Tồn kho: ${product.stock})`);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) {
              showToast(`⚠️ Tồn kho chỉ còn ${item.product.stock} cái!`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleCheckout = async (paymentMethod: string, voucherCode: string, total: number) => {
    if (cart.length === 0) return;

    const token = localStorage.getItem('smartsale_session_token');
    if (!token) {
      showToast('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại trước khi thanh toán');
      return;
    }

    try {
      const response = await fetch('/api/store/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: cart.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
          customerId: selectedCustomer?.id,
          paymentMethod:
            paymentMethod === 'qr'
              ? 'qr_code'
              : paymentMethod === 'transfer'
              ? 'bank_transfer'
              : paymentMethod === 'card'
              ? 'card'
              : 'cash',
          voucherCode,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Không thể hoàn tất thanh toán.');

      setProducts(data.state.products);
      setCustomers(data.state.customers);
      setOrders(data.state.orders);
      const newOrder: Order = data.order;
      const now = new Date();

      const activity: RealtimeActivity = {
        id: `act-${Date.now()}`,
        type: 'order',
        title: `Thanh toán thành công #${newOrder.code}`,
        description: `${selectedCustomer ? selectedCustomer.name : 'Khách lẻ'} • ${cart.length} món`,
        timestamp: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        createdAtMs: Date.now(),
        amount: newOrder.total,
        channel: 'Cửa hàng POS',
        status: 'success',
      };
      setRealtimeActivities((prev) => [activity, ...prev.slice(0, 25)]);
      setLatestActivity(activity);

      setLastCheckoutOrder({
        cart: [...cart],
        customer: selectedCustomer,
        paymentMethod,
        total: newOrder.total,
      });

      setCart([]);
      soundManager.playCashRegisterChime();
      showToast(`✅ Hoàn tất đơn hàng #${newOrder.code}`, `Doanh thu +${formatCurrency(newOrder.total)}`);
    } catch (error) {
      showToast('Không thể hoàn tất thanh toán', error instanceof Error ? error.message : 'Vui lòng thử lại');
    }
  };

  // Product Management Handlers
  const handleSaveProduct = async (productData: Partial<Product>) => {
    const token = localStorage.getItem('smartsale_session_token');
    if (!token) {
      showToast('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại');
      return;
    }

    try {
      if (editingProduct) {
        const res = await fetch(`/api/store/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(productData),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Không thể cập nhật sản phẩm.');
        setProducts(data.state.products);
        showToast('Đã cập nhật sản phẩm', productData.name || editingProduct.name);
      } else {
        const res = await fetch('/api/store/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(productData),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Không thể thêm sản phẩm.');
        setProducts(data.state.products);
        showToast('Đã thêm sản phẩm mới', data.product?.name || productData.name || 'Sản phẩm mới');
      }
    } catch (err: any) {
      console.error('Save product failed:', err);
      showToast('Lỗi lưu sản phẩm', err.message || 'Không thể lưu sản phẩm vào hệ thống.');
    } finally {
      setIsAddProductModalOpen(false);
      setEditingProduct(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const token = localStorage.getItem('smartsale_session_token');
    if (!token) {
      showToast('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại trước khi xóa sản phẩm');
      return;
    }

    try {
      const res = await fetch(`/api/store/products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể xóa sản phẩm khỏi máy chủ.');
      }
      setProducts(data.state.products);
      showToast('Đã xóa sản phẩm thành công', 'Dữ liệu đã được cập nhật vĩnh viễn trong hệ thống');
    } catch (err: any) {
      console.error('Delete product failed:', err);
      showToast('Không thể xóa sản phẩm', err.message || 'Vui lòng kiểm tra lại quyền hạn hoặc kết nối.');
    }
  };

  // Restock Handlers
  const handleConfirmRestock = async (productId: string, amount: number) => {
    const token = localStorage.getItem('smartsale_session_token');
    if (!token) {
      showToast('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại trước khi nhập kho');
      return;
    }

    try {
      const response = await fetch('/api/store/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, quantity: amount, branch: 'Chi nhánh Quận 1 - Hồ Chí Minh (Kho chính)' }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Không thể nhập kho.');

      const targetProd = data.state.products.find((product: Product) => product.id === productId);
      setProducts(data.state.products);
      setRestockOrders(data.state.restockOrders);
      const now = new Date();
      const act: RealtimeActivity = {
        id: `act-restock-${Date.now()}`,
        type: 'restock',
        title: 'Nhập kho thành công',
        description: `Đã nhập +${amount} chiếc ${targetProd?.name || productId} vào kho Quận 1`,
        timestamp: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        createdAtMs: Date.now(),
        channel: 'Cửa hàng POS',
        status: 'success',
      };
      setRealtimeActivities((prev) => [act, ...prev.slice(0, 25)]);
      setLatestActivity(act);
      showToast(`✅ Đã nhập +${amount} sản phẩm`, targetProd?.name || productId);
    } catch (error) {
      showToast('Không thể nhập kho', error instanceof Error ? error.message : 'Vui lòng thử lại');
    }
  };

  // AI Chat Handlers
  const handleSendMessage = async (text: string, imageAttachment?: string) => {
    const activeSession = chatSessions.find((s) => s.id === activeSessionId) || chatSessions[0];

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    // Optimistically append user message
    const updatedMessages = [...activeSession.messages, userMessage];
    setChatSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              title: s.messages.length === 0 ? text.substring(0, 30) + '...' : s.title,
              messages: updatedMessages,
            }
          : s
      )
    );

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('smartsale_session_token') || ''}`,
        },
        body: JSON.stringify({
          message: text,
          imageAttachment,
          history: updatedMessages,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.reply) {
        throw new Error(data.error || 'Trợ lý AI không thể xử lý yêu cầu.');
      }
      const aiReply: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'Hệ thống đã ghi nhận yêu cầu của bạn.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        productCard: data.productCard,
      };

      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? { ...s, messages: [...s.messages, aiReply] }
            : s
        )
      );
    } catch (err) {
      console.error('AI chat failed:', err);
      const fallbackAi: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: 'Hiện tại kết nối AI đang bận. Bạn có thể sử dụng các chức năng Bán hàng POS và Quản lý kho bình thường.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? { ...s, messages: [...s.messages, fallbackAi] }
            : s
        )
      );
    }
  };

  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'Hội thoại AI mới...',
      timeCategory: 'today',
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'ai',
          text: 'Xin chào! Tôi là Trợ lý SmartSale AI. Tôi có thể hỗ trợ kiểm tra tồn kho thời gian thực, tư vấn sản phẩm, tra cứu doanh thu hoặc dự báo đơn hàng cho bạn ngay bây giờ!',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };
    setChatSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleAddToCartFromAI = (productName: string, price: number) => {
    const match = products.find(
      (p) => p.name.toLowerCase().includes(productName.toLowerCase()) || productName.toLowerCase().includes(p.name.toLowerCase())
    );
    if (match) {
      handleAddToCart(match);
    } else {
      showToast(`Đã nhận diện sản phẩm`, `${productName} (${formatCurrency(price)})`);
    }
  };

  const cartTotalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // If loaded via mobile phone scanner QR code, render dedicated high-performance Mobile Companion Scanner
  if (mobileScannerSession) {
    return (
      <MobileCompanionScanner
        sessionId={mobileScannerSession}
        onExitToApp={() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('scannerSession');
          url.searchParams.delete('session');
          window.history.replaceState({}, '', url.pathname);
          setMobileScannerSession(null);
        }}
      />
    );
  }

  // Authentication check: If user is not logged in, render LoginScreen with Email & OTP verification
  if (isAuthChecking) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950" />;
  }

  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(
            'Đăng nhập thành công!',
            `Chào mừng ${user.name} (${user.email}) quay trở lại`
          );
        }}
        staffList={staffList}
        isDark={isDark}
        onToggleDarkMode={() => setIsDark(!isDark)}
      />
    );
  }

  return (
    <div
      id="smartsale-app-root"
      className={`min-h-screen font-sans antialiased transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Real-time Floating Toast Notification */}
      {toastMessage && (
        <div
          id="global-toast"
          className="fixed bottom-6 right-6 z-50 py-3 px-5 rounded-2xl bg-slate-900/95 text-white shadow-2xl backdrop-blur-md border border-slate-700 animate-in fade-in slide-in-from-bottom-3 max-w-sm"
        >
          <p className="text-xs font-bold text-emerald-400">{toastMessage.text}</p>
          {toastMessage.sub && (
            <p className="text-[11px] text-slate-300 mt-0.5">{toastMessage.sub}</p>
          )}
        </div>
      )}

      {/* Impersonation Banner for Testing Roles */}
      {originalAdminUser && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-md relative z-40">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-amber-600/30 text-amber-950">👁️ Chế độ Thử nghiệm Vai trò</span>
            <span>
              Đang trải nghiệm hệ thống với quyền của: <strong>{currentUser?.name}</strong> (
              {getRoleDetails(currentUser?.role || 'cashier', language).label})
            </span>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="px-3 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            Quay lại tài khoản Chủ cửa hàng (Admin)
          </button>
        </div>
      )}

      {/* Main Responsive Layout */}
      <div className="flex h-screen overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          onOpenSettingsModal={() => setCurrentTab('settings')}
          isDark={isDark}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          currentUser={currentUser}
          onLogout={handleLogout}
          rolePermissions={rolePermissions}
          onRestrictedClick={(label) => {
            const roleInfo = getRoleDetails(currentUser?.role || 'admin', language);
            showToast(
              'Quyền truy cập bị giới hạn',
              `Tài khoản "${currentUser?.name}" (${roleInfo.shortLabel}) không có quyền mở "${label}".`
            );
          }}
        />

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Persistent Role Testing / Impersonation Top Banner */}
          {originalAdminUser && (
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-4 py-2 flex items-center justify-between text-xs font-semibold shadow-md z-30 flex-wrap gap-2 border-b border-amber-600">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-slate-950 text-amber-400 font-extrabold text-[10px] tracking-wider uppercase">
                  Chế độ thử vai trò
                </span>
                <span className="text-slate-950 font-medium">
                  Đang trải nghiệm: <strong>{currentUser?.name}</strong> ({getRoleDetails(currentUser?.role || 'admin', language).label})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExitImpersonation}
                  className="px-3 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  ✕ Thoát & Về lại Admin ({originalAdminUser.name})
                </button>
              </div>
            </div>
          )}

          {/* TopBar with Realtime Clock and Activity Feed */}
          <TopBar
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            searchQuery={globalSearchQuery}
            onSearchChange={setGlobalSearchQuery}
            isDark={isDark}
            onToggleDarkMode={() => setIsDark(!isDark)}
            onNewSaleClick={() => {
              if (canUserAccessTab(currentUser, 'pos', rolePermissions)) {
                setCurrentTab('pos');
              } else {
                showToast(
                  language === 'vi' ? 'Quyền truy cập bị giới hạn' : 'Access Restricted',
                  language === 'vi'
                    ? `Tài khoản (${getRoleDetails(currentUser?.role || 'admin', language).shortLabel}) không có quyền mở Bán hàng & Thu ngân POS.`
                    : 'Your role does not have permission to open POS Sales.'
                );
              }
            }}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            realtimeActivities={realtimeActivities}
            onOpenRealDataManager={() => setIsRealDataModalOpen(true)}
            currentUser={currentUser}
            onLogout={handleLogout}
            dataMode={dataMode}
            originalAdminUser={originalAdminUser}
            onExitImpersonation={handleExitImpersonation}
            onSwitchRole={handleSwitchRoleToTest}
          />

          {/* Dynamic Scrollable Screen Container with RBAC Route Guard */}
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
            {!canUserAccessTab(currentUser, currentTab, rolePermissions) ? (
              <div className="max-w-2xl mx-auto my-10 p-6 sm:p-8 rounded-3xl border text-center space-y-6 animate-in fade-in zoom-in-95 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/10">
                  <ShieldAlert className="w-8 h-8" />
                </div>

                <div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mb-2 ${
                      getRoleDetails(currentUser?.role || 'admin', language).badgeColor
                    }`}
                  >
                    {getRoleDetails(currentUser?.role || 'admin', language).label}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    Quyền truy cập bị giới hạn (Access Restricted)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                    Tài khoản <strong>{currentUser?.name}</strong> ({currentUser?.email}) không được cấp quyền truy cập chức năng này theo Ma trận Phân quyền hệ thống.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-left text-xs max-w-md mx-auto space-y-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    Phạm vi trách nhiệm của bạn:
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    {getRoleDetails(currentUser?.role || 'admin', language).description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  {currentUser?.role === 'cashier' && (
                    <button
                      onClick={() => setCurrentTab('pos')}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>Về màn hình Thu ngân (POS)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {currentUser?.role === 'inventory_staff' && (
                    <button
                      onClick={() => setCurrentTab('inventory')}
                      className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>Về Quản lý Kho hàng</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setCurrentTab('dashboard')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Về Bảng điều khiển (Dashboard)
                  </button>

                  {originalAdminUser && (
                    <button
                      onClick={handleExitImpersonation}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-md hover:opacity-90 transition-all cursor-pointer"
                    >
                      Quay lại quyền Admin
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
            {currentTab === 'dashboard' && (
              <DashboardScreen
                products={products}
                orders={orders}
                realtimeActivities={realtimeActivities}
                isAutoStreamActive={isAutoStreamActive}
                onToggleAutoStream={() => setIsAutoStreamActive(!isAutoStreamActive)}
                streamIntervalSeconds={streamIntervalSeconds}
                onChangeInterval={setStreamIntervalSeconds}
                onTriggerInstantOrder={generateSimulatedRealtimeOrder}
                latestActivity={latestActivity}
                onTabChange={setCurrentTab}
                onOpenRestockModal={(prodId) => {
                  setRestockProductId(prodId || null);
                  setIsRestockModalOpen(true);
                }}
                onOpenReportModal={() => setIsReportModalOpen(true)}
                onOpenRealDataManager={() => setIsRealDataModalOpen(true)}
                isDark={isDark}
                dataMode={dataMode}
              />
            )}

            {currentTab === 'pos' && (
              <PosScreen
                products={products}
                cart={cart}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveFromCart={handleRemoveFromCart}
                onClearCart={handleClearCart}
                selectedCustomer={selectedCustomer}
                onSelectCustomerClick={() => setIsCustomerSelectModalOpen(true)}
                onCheckout={handleCheckout}
                searchQuery={globalSearchQuery}
                onSearchChange={setGlobalSearchQuery}
                isDark={isDark}
              />
            )}

            {currentTab === 'products' && (
              <ProductsScreen
                products={products}
                onAddProductClick={() => {
                  setEditingProduct(null);
                  setIsAddProductModalOpen(true);
                }}
                onEditProductClick={(prod) => {
                  setEditingProduct(prod);
                  setIsAddProductModalOpen(true);
                }}
                onDeleteProduct={handleDeleteProduct}
                onOpenRestockModal={(prodId) => {
                  setRestockProductId(prodId || null);
                  setIsRestockModalOpen(true);
                }}
                onOpenRealDataManager={() => setIsRealDataModalOpen(true)}
                isDark={isDark}
                canManageProducts={canUserAccessModule(currentUser, 'products_manage', rolePermissions)}
              />
            )}

            {currentTab === 'customers' && (
              <CustomersScreen
                customers={customers}
                onSelectCustomer={(cust) => {
                  setSelectedCustomer(cust);
                  showToast(`Đã chọn khách hàng`, `${cust.name} (${cust.tier})`);
                }}
                onAddCustomer={() => setIsCustomerSelectModalOpen(true)}
                isDark={isDark}
              />
            )}

            {currentTab === 'invoices' && (
              <InvoicesScreen
                orders={orders}
                onReprintReceipt={(order) => {
                  setLastCheckoutOrder({
                    cart: order.items,
                    customer: order.customer || null,
                    paymentMethod: order.paymentMethod,
                    total: order.total,
                  });
                }}
                isDark={isDark}
              />
            )}

            {currentTab === 'inventory' && (
              <InventoryBranchScreen
                products={products}
                restockOrders={restockOrders}
                onOpenRestockModal={(prodId) => {
                  setRestockProductId(prodId || null);
                  setIsRestockModalOpen(true);
                }}
                onReceiveOrder={async (ordId) => {
                  try {
                    const data = await requestStoreMutation(`/api/store/restock/${ordId}/receive`, 'POST');
                    setProducts(data.state.products);
                    setRestockOrders(data.state.restockOrders);
                    showToast('Đã nhận hàng vào kho thành công!');
                  } catch (error) {
                    showToast('Không thể nhận hàng', error instanceof Error ? error.message : 'Vui lòng thử lại');
                  }
                }}
                isDark={isDark}
              />
            )}

            {currentTab === 'revenue-report' && (
              <RevenueReportScreen products={products} orders={orders} isDark={isDark} />
            )}

            {currentTab === 'analytics-report' && (
              <AnalyticsReportScreen products={products} orders={orders} isDark={isDark} />
            )}

            {currentTab === 'ai-assistant' && (
              <AiAssistantScreen
                sessions={chatSessions}
                activeSessionId={activeSessionId}
                onSelectSession={setActiveSessionId}
                onNewSession={handleNewSession}
                onSendMessage={handleSendMessage}
                onAddToCartFromAI={handleAddToCartFromAI}
                isDark={isDark}
              />
            )}

            {currentTab === 'ai-analyst' && (
              <AiAnalystScreen
                products={products}
                orders={orders}
                token={localStorage.getItem('smartsale_session_token')}
                onOpenRestockModal={(productId) => {
                  setRestockProductId(productId || null);
                  setIsRestockModalOpen(true);
                }}
                isDark={isDark}
              />
            )}

            {currentTab === 'users-permissions' && (
              <UsersPermissionsScreen
                staffList={staffList}
                onAddStaff={handleAddStaff}
                onUpdateStaff={handleUpdateStaff}
                onDeleteStaff={handleDeleteStaff}
                onImpersonateStaff={handleImpersonateStaff}
                currentUser={currentUser}
                rolePermissions={rolePermissions}
                onUpdateRolePermissions={handleUpdateRolePermissions}
                onResetRolePermissions={handleResetRolePermissions}
                permissionAuditHistory={permissionAuditHistory}
                staffAuditHistory={staffAuditHistory}
                isDark={isDark}
              />
            )}

            {currentTab === 'settings' && (
              <div className="max-w-3xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.navSettings}</h1>

                {/* Real Data Management Card */}
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} space-y-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{language === 'vi' ? 'Quản lý Dữ liệu Thực tế Cửa hàng' : 'Store Real Data Management'}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {language === 'vi' ? '1 Chi nhánh duy nhất' : 'Single Store'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {language === 'vi'
                          ? 'Dọn dẹp các đơn hàng mẫu thử nghiệm, nhập danh mục sản phẩm thật, hoặc khôi phục dữ liệu demo.'
                          : 'Clear mock demo transactions, import your actual product catalog, or restore default state.'}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsRealDataModalOpen(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-500/20 transition-all"
                    >
                      {language === 'vi' ? 'Mở Bảng điều khiển Dữ liệu' : 'Open Data Manager'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-400 text-[11px] block">{language === 'vi' ? 'Sản phẩm trong kho' : 'Stock Products'}</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">{products.length} {language === 'vi' ? 'mặt hàng' : 'items'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-400 text-[11px] block">{language === 'vi' ? 'Tổng đơn bán ra' : 'Recorded Orders'}</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">{orders.length} {language === 'vi' ? 'đơn hàng' : 'orders'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-400 text-[11px] block">{language === 'vi' ? 'Khách hàng lưu trữ' : 'Customer Profiles'}</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">{customers.length} {language === 'vi' ? 'khách hàng' : 'customers'}</span>
                    </div>
                  </div>
                </div>

                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} space-y-4`}>
                  <h3 className="font-semibold text-base">{language === 'vi' ? 'Thông tin Cửa hàng' : 'Store Information'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-500 mb-1">{language === 'vi' ? 'Tên cửa hàng' : 'Store Name'}</label>
                      <input
                        type="text"
                        defaultValue="SmartSale AI Store"
                        className={`w-full p-2.5 rounded-xl border outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">{language === 'vi' ? 'Số điện thoại hotline' : 'Hotline Number'}</label>
                      <input
                        type="text"
                        defaultValue="028 3822 9999"
                        className={`w-full p-2.5 rounded-xl border outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-slate-500 mb-1">{language === 'vi' ? 'Địa chỉ cửa hàng & kho' : 'Store & Warehouse Address'}</label>
                      <input
                        type="text"
                        defaultValue="68 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
                        className={`w-full p-2.5 rounded-xl border outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={() => showToast(language === 'vi' ? 'Đã lưu cấu hình cửa hàng thành công!' : 'Store settings saved successfully!')}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-500/20"
                    >
                      {t.saveChanges}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentTab === 'support' && (
              <div className="max-w-2xl mx-auto text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 mx-auto flex items-center justify-center text-2xl font-bold">
                  💬
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {language === 'vi' ? 'Trung tâm Trợ giúp 24/7' : '24/7 Help Center'}
                </h2>
                <p className="text-sm text-slate-500">
                  {language === 'vi'
                    ? 'Đội ngũ kỹ thuật SmartSale AI luôn sẵn sàng hỗ trợ bạn qua Hotline 1900 6868 hoặc Live Chat AI.'
                    : 'SmartSale AI technical support is always ready to assist you via Hotline 1900 6868 or Live AI Chat.'}
                </p>
                <button
                  onClick={() => setCurrentTab('ai-assistant')}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  {language === 'vi' ? 'Mở Trợ lý AI ngay' : 'Open AI Assistant'}
                </button>
              </div>
            )}
            </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        cartCount={cartTotalItemsCount}
        isDark={isDark}
      />

      {/* MODALS */}
      {/* 1. Add / Edit Product Modal */}
      <AddEditProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => {
          setIsAddProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        initialProduct={editingProduct}
        isDark={isDark}
      />

      {/* 2. Select / Add Customer Modal */}
      <CustomerSelectModal
        isOpen={isCustomerSelectModalOpen}
        onClose={() => setIsCustomerSelectModalOpen(false)}
        customers={customers}
        selectedCustomer={selectedCustomer}
        onSelectCustomer={(c) => {
          setSelectedCustomer(c);
          setIsCustomerSelectModalOpen(false);
          if (c) showToast(`Đã chọn khách hàng`, `${c.name} (${c.tier})`);
        }}
        onAddNewCustomer={(newC) => {
          setCustomers((prev) => [newC, ...prev]);
          setSelectedCustomer(newC);
          setIsCustomerSelectModalOpen(false);
          showToast(`Đã tạo khách hàng mới`, newC.name);
        }}
        isDark={isDark}
      />

      {/* 3. Checkout Receipt Modal */}
      {lastCheckoutOrder && (
        <CheckoutReceiptModal
          isOpen={lastCheckoutOrder !== null}
          onClose={() => setLastCheckoutOrder(null)}
          cart={lastCheckoutOrder.cart}
          customer={lastCheckoutOrder.customer}
          paymentMethod={lastCheckoutOrder.paymentMethod}
          total={lastCheckoutOrder.total}
          isDark={isDark}
        />
      )}

      {/* 4. Restock Modal */}
      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => {
          setIsRestockModalOpen(false);
          setRestockProductId(null);
        }}
        products={products}
        initialProductId={restockProductId}
        onConfirmRestock={handleConfirmRestock}
        isDark={isDark}
      />

      {/* 5. Report Quick Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        isDark={isDark}
      />

      {/* 6. Upgrade Pro Modal */}
      <UpgradeProModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        isDark={isDark}
      />

      {/* 7. Real Data Manager Modal */}
      <RealDataManagerModal
        isOpen={isRealDataModalOpen}
        onClose={() => setIsRealDataModalOpen(false)}
        products={products}
        orders={orders}
        dataMode={dataMode}
        onNavigateToPos={() => {
          setIsRealDataModalOpen(false);
          setCurrentTab('pos');
        }}
        onClearSampleOrders={handleClearSampleOrders}
        onResetStoreBlank={handleResetStoreToEmpty}
        onImportProducts={handleImportProducts}
        onRestoreSampleData={handleRestoreSampleData}
        onOpenAddProduct={() => {
          setEditingProduct(null);
          setIsAddProductModalOpen(true);
        }}
        isAutoStreamActive={isAutoStreamActive}
        isDark={isDark}
      />
    </div>
  );
}

export default App;
