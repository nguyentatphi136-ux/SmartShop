import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'vi' | 'en';

export interface Translations {
  // Common & Navigation
  appName: string;
  posName: string;
  realtimeSync: string;
  realtimeSyncOnline: string;
  live: string;
  searchPlaceholderPos: string;
  searchPlaceholderGeneral: string;
  newSale: string;
  notifications: string;
  realtimeNotifications: string;
  close: string;
  cancel: string;
  confirm: string;
  save: string;
  saveChanges: string;
  delete: string;
  edit: string;
  actions: string;
  status: string;
  all: string;
  today: string;
  yesterday: string;
  pastWeek: string;
  thisWeek: string;
  thisMonth: string;
  thisYear: string;
  last7Days: string;
  thisQuarter: string;
  themeToggle: string;
  managerRole: string;
  checkLatency: string;
  switchLang: string;
  exportData: string;
  exportExcel: string;
  downloadPdf: string;
  print: string;
  filter: string;
  refresh: string;
  viewAll: string;
  loading: string;
  success: string;
  error: string;
  warning: string;

  // Realtime Live Bar & Feeds
  liveChannelTitle: string;
  liveStatusConnected: string;
  liveStreamActive: string;
  liveStreamPaused: string;
  interval10s: string;
  interval20s: string;
  interval45s: string;
  intervalLabel: string;
  pauseStream: string;
  resumeStream: string;
  triggerInstantOrder: string;
  muteSound: string;
  unmuteSound: string;
  realtimeOrdersToday: string;
  realtimeRevenueToday: string;
  latestEvent: string;
  noRecentEvent: string;
  activityFeedTitle: string;
  activityFeedSubtitle: string;
  allFilter: string;
  ordersFilter: string;
  inventoryFilter: string;
  aiInsightsFilter: string;
  noActivitiesFound: string;
  statusPaid: string;

  // Sidebar Groups & Items
  navDashboard: string;
  navPos: string;
  navProducts: string;
  navInventory: string;
  navCustomers: string;
  navInvoices: string;
  navRestock: string;
  navRevenueReport: string;
  navAnalyticsReport: string;
  navAiAssistant: string;
  navAiAnalyst: string;
  navUsersPermissions: string;
  navSettings: string;
  navSupport: string;
  upgradePro: string;
  upgradeDesc: string;
  mainMenuSection: string;
  operationsSection: string;
  analyticsSection: string;
  systemSection: string;

  // Dashboard Screen
  dashboardTitle: string;
  dashboardSubtitle: string;
  todayRevenue: string;
  todayOrders: string;
  lowStockAlert: string;
  vipCustomers: string;
  inventoryValuation: string;
  comparedToYesterday: string;
  justNow: string;
  itemsNeedRestock: string;
  newMembers: string;
  salesChartTitle: string;
  salesChartSubtitle: string;
  hourlyRevenue: string;
  categorySales: string;
  topSellingProducts: string;
  topSellingSubtitle: string;
  realtimeActivityStream: string;
  realtimeActivitySubtitle: string;
  allChannels: string;
  quickActions: string;
  createOrderAction: string;
  importStockAction: string;
  addCustomerAction: string;
  exportReportAction: string;
  chartPeriod7days: string;
  chartPeriod30days: string;
  viewDetails: string;
  restockNow: string;

  // POS Screen
  allCategories: string;
  catPhones: string;
  catLaptops: string;
  catTablets: string;
  catAccessories: string;
  catFashion: string;
  smartSearchProd: string;
  cartTitle: string;
  posCartTitle: string;
  itemsUnit: string;
  selectCustomer: string;
  cartEmpty: string;
  discountCode: string;
  customerSelect: string;
  changeCustomer: string;
  guestCustomer: string;
  memberTier: string;
  rewardPoints: string;
  discountVip: string;
  itemsInCart: string;
  emptyCart: string;
  emptyCartPrompt: string;
  subtotal: string;
  discount: string;
  discountVoucher: string;
  voucherPlaceholder: string;
  applyVoucher: string;
  voucherSuccess: string;
  voucherInvalid: string;
  totalPayable: string;
  paymentMethod: string;
  cash: string;
  cashPayment: string;
  qrVietQR: string;
  qrPayment: string;
  card: string;
  cardPayment: string;
  cardPos: string;
  bankTransfer: string;
  quickCheckout: string;
  checkout: string;
  addToCart: string;
  clearCart: string;
  stockLeft: string;
  sold: string;
  viewCartMobile: string;
  backToProducts: string;
  customerPay: string;
  changeMoney: string;
  exactCash: string;

  // Products Screen
  productsTitle: string;
  productsSubtitle: string;
  productListTitle: string;
  productListSubtitle: string;
  addNewProduct: string;
  addProduct: string;
  importAction: string;
  exportAction: string;
  searchProduct: string;
  searchProductPlaceholder: string;
  productCode: string;
  productName: string;
  productCategory: string;
  productPrice: string;
  productCost: string;
  productStock: string;
  productStatus: string;
  noMatchingProducts: string;
  category: string;
  price: string;
  costPrice: string;
  stock: string;
  stockStatusInStock: string;
  stockStatusIn: string;
  stockStatusLow: string;
  stockStatusOut: string;
  stockStatusAll: string;
  productSku: string;
  sku: string;
  editProduct: string;
  deleteProduct: string;
  deleteConfirm: string;
  restockProduct: string;
  productTotalCount: string;
  enterProductDetails: string;
  initialStock: string;
  imageLink: string;

  // Customers Screen
  customersTitle: string;
  customersSubtitle: string;
  customerListTitle: string;
  customerListSubtitle: string;
  addNewCustomer: string;
  addCustomer: string;
  searchCustomer: string;
  searchCustomerPlaceholder: string;
  customerName: string;
  customerPhone: string;
  customerTier: string;
  tierStandard: string;
  tierVip: string;
  tierVvip: string;
  tierLabel: string;
  allTiers: string;
  tierDiscount: string;
  totalSpent: string;
  totalCustomerSpent: string;
  vvipVipTiers: string;
  customerTotalSpent: string;
  customerPoints: string;
  customerHistory: string;
  selectForPos: string;
  selectPosCustomer: string;
  loyaltyCustomer: string;
  selectCustomerForDiscount: string;
  walkInNoPoints: string;
  phone: string;
  tier: string;
  back: string;
  createAndSelect: string;

  // Invoices Screen
  invoicesTitle: string;
  invoicesSubtitle: string;
  searchInvoice: string;
  searchInvoicePlaceholder: string;
  invoiceCode: string;
  createdAt: string;
  cashier: string;
  channel: string;
  paymentType: string;
  totalAmount: string;
  totalPayment: string;
  invoiceStatus: string;
  reprintReceipt: string;
  reprintInvoice: string;
  invoiceDetail: string;
  completedOrder: string;
  statusCompleted: string;
  statusPending: string;
  statusCancelled: string;

  // Inventory & Restock Screen
  inventoryTitle: string;
  inventorySubtitle: string;
  totalProductsCount: string;
  totalStockUnits: string;
  totalStockCount: string;
  totalStockValue: string;
  lowStockWarning: string;
  outOfStockCount: string;
  detailedInventoryTable: string;
  searchStockPlaceholder: string;
  outOfStockAlert: string;
  lowStockAlertCount: string;
  branchWarehouse: string;
  branchQ1: string;
  branchQ7: string;
  branchHanoi: string;
  branchDaNang: string;
  branch: string;
  restockTitle: string;
  restockSubtitle: string;
  createRestockOrder: string;
  restockCode: string;
  supplier: string;
  quantityRestocked: string;
  totalCostPrice: string;
  receiveStockBtn: string;
  receivedStockStatus: string;
  totalRestockValue: string;
  paidToSuppliers: string;
  inTransitOrders: string;
  shippingToWarehouse: string;
  productsNeedRestock: string;
  belowSafetyThreshold: string;
  searchRestockPlaceholder: string;
  allStatuses: string;
  inTransit: string;
  completed: string;
  timestamp: string;
  product: string;
  quantity: string;
  totalCost: string;
  receivingBranch: string;
  receivedInWarehouse: string;
  shippingInTransit: string;
  receiveGoods: string;
  reorder: string;

  // Reports Screen
  revenueReportTitle: string;
  revenueReportSubtitle: string;
  weeklyRevenue: string;
  grossProfit: string;
  netRevenue: string;
  netRevenueToday: string;
  estimatedProfit: string;
  averageOrderValue: string;
  costOfGoodsSold: string;
  profitMargin: string;
  revenueProfitChart: string;
  last7DaysSubtitle: string;
  revenue: string;
  profit: string;
  categoryRevenueShare: string;
  categoryShareSubtitle: string;
  topProfitProducts: string;
  topProfitSubtitle: string;
  analyticsTitle: string;
  analyticsSubtitle: string;
  revenueByPaymentMethod: string;
  revenueByChannel: string;
  customerDemographics: string;
  aiDemandForecast: string;
  topBranch: string;

  // AI Assistant & Analyst Screen
  aiAssistantTitle: string;
  aiAssistantSubtitle: string;
  aiSubtitle: string;
  aiAnalystTitle: string;
  aiAnalystSubtitle: string;
  growthOpportunity: string;
  crossSellTitle: string;
  crossSellDesc: string;
  expectedRevenue: string;
  createComboNow: string;
  macbookStockRisk: string;
  macbookStockDesc: string;
  orderStockNow: string;
  priceMarginOptimization: string;
  tshirtElasticity: string;
  tshirtElasticityDesc: string;
  perfectOptimization: string;
  executiveAiReport: string;
  highLevelRecommendations: string;
  cashFlowAnalysis: string;
  next7DaysActions: string;
  newAiChat: string;
  newChat: string;
  quickSuggestions: string;
  aiPromptPlaceholder: string;
  aiInputPlaceholder: string;
  aiSend: string;
  aiThinking: string;
  aiChipRevenue: string;
  aiChipStock: string;
  aiChipBestseller: string;
  aiChipRestockAdvice: string;
  aiAddCartSuggestion: string;
  aiForecastDemand: string;
  aiPredictedGrowth: string;
  aiReorderRecommendation: string;

  // Users & Permissions Screen
  usersTitle: string;
  usersSubtitle: string;
  addNewStaff: string;
  addStaff: string;
  staffName: string;
  staffMember: string;
  contact: string;
  systemRole: string;
  searchStaffPlaceholder: string;
  allRoles: string;
  staffEmail: string;
  staffRole: string;
  adminRole: string;
  roleAdmin: string;
  roleManager: string;
  roleCashier: string;
  cashierRole: string;
  roleWarehouse: string;
  inventoryStaffRole: string;
  staffStatus: string;
  activeStatus: string;
  active: string;
  inactiveStatus: string;
  editPermissions: string;
  rbacMatrixTitle: string;
  rbacMatrixSubtitle: string;
  functionalModule: string;

  // Modals & Receipts
  receiptTitle: string;
  paymentSuccess: string;
  orderCode: string;
  customer: string;
  walkInCustomer: string;
  method: string;
  totalUpper: string;
  scanVietQr: string;
  printReceipt: string;
  doneNewOrder: string;
  restockOrderModalTitle: string;
  restockOrderModalSubtitle: string;
  currentStock: string;
  productToRestock: string;
  restockQuantity: string;
  estimatedCost: string;
  totalOrderValue: string;
  confirmRestock: string;
  upgradeSubtitle: string;
  upgradePerk1: string;
  upgradePerk2: string;
  upgradePerk3: string;
  perMonth: string;
  upgradeNow: string;
}

export const translations: Record<Language, Translations> = {
  vi: {
    // Common & Navigation
    appName: 'SmartSale AI',
    posName: 'SmartSale POS',
    realtimeSync: 'Thời gian thực',
    realtimeSyncOnline: 'Đồng bộ Live: Đang kết nối',
    live: 'LIVE',
    searchPlaceholderPos: 'Tìm nhanh sản phẩm, barcode, SKU...',
    searchPlaceholderGeneral: 'Tìm kiếm sản phẩm, đơn hàng, khách...',
    newSale: 'Bán hàng',
    notifications: 'Thông báo thời gian thực',
    realtimeNotifications: 'Thông báo Thời gian thực',
    close: 'Đóng',
    cancel: 'Hủy bỏ',
    confirm: 'Xác nhận',
    save: 'Lưu',
    saveChanges: 'Lưu thay đổi',
    delete: 'Xóa',
    edit: 'Sửa',
    actions: 'Thao tác',
    status: 'Trạng thái',
    all: 'Tất cả',
    today: 'Hôm nay',
    yesterday: 'Hôm qua',
    pastWeek: 'Tuần trước',
    thisWeek: 'Tuần này',
    thisMonth: 'Tháng này',
    thisYear: 'Năm nay',
    last7Days: '7 ngày qua',
    thisQuarter: 'Quý này',
    themeToggle: 'Chuyển giao diện sáng / tối',
    managerRole: 'Cửa hàng trưởng • Chi nhánh Q.1',
    checkLatency: 'Kiểm tra độ trễ mạng (0ms)',
    switchLang: 'Đổi ngôn ngữ',
    exportData: 'Xuất dữ liệu',
    exportExcel: 'Xuất Excel',
    downloadPdf: 'Tải file PDF',
    print: 'In ấn',
    filter: 'Bộ lọc',
    refresh: 'Làm mới',
    viewAll: 'Xem tất cả',
    loading: 'Đang tải...',
    success: 'Thành công',
    error: 'Lỗi',
    warning: 'Cảnh báo',

    // Realtime Live Bar & Feeds
    liveChannelTitle: 'Đồng bộ Đa Kênh Thời Gian Thực',
    liveStatusConnected: 'Đang kết nối Realtime WebSocket',
    liveStreamActive: 'Tự động nhận đơn: Bật',
    liveStreamPaused: 'Tự động nhận đơn: Tạm dừng',
    interval10s: '10s / đơn',
    interval20s: '20s / đơn',
    interval45s: '45s / đơn',
    intervalLabel: 'Tần suất:',
    pauseStream: 'Tạm dừng',
    resumeStream: 'Bật Stream',
    triggerInstantOrder: '+ Đơn phát sinh',
    muteSound: 'Tắt chuông đơn hàng',
    unmuteSound: 'Bật chuông đơn hàng',
    realtimeOrdersToday: 'Đơn hôm nay',
    realtimeRevenueToday: 'Doanh thu Live',
    latestEvent: 'Sự kiện gần nhất:',
    noRecentEvent: 'Chưa có sự kiện',
    activityFeedTitle: 'Luồng hoạt động đa kênh trực tiếp',
    activityFeedSubtitle: 'Đồng bộ hóa đơn hàng tức thì từ POS, Shopee, TikTok Shop & Kho hàng',
    allFilter: 'Tất cả',
    ordersFilter: 'Đơn hàng mới',
    inventoryFilter: 'Cảnh báo kho',
    aiInsightsFilter: 'AI Phân tích',
    noActivitiesFound: 'Chưa có hoạt động nào trong bộ lọc này.',
    statusPaid: 'Đã thanh toán',

    // Sidebar Groups & Items
    navDashboard: 'Tổng quan',
    navPos: 'Bán hàng (POS)',
    navProducts: 'Sản phẩm',
    navInventory: 'Tồn kho & Chi nhánh',
    navCustomers: 'Khách hàng',
    navInvoices: 'Hóa đơn & Đơn hàng',
    navRestock: 'Nhập hàng',
    navRevenueReport: 'Báo cáo doanh thu',
    navAnalyticsReport: 'Phân tích đa kênh',
    navAiAssistant: 'Trợ lý AI Copilot',
    navAiAnalyst: 'AI Business Analyst',
    navUsersPermissions: 'Nhân viên & Phân quyền',
    navSettings: 'Cài đặt hệ thống',
    navSupport: 'Trung tâm trợ giúp',
    upgradePro: 'Nâng cấp Pro',
    upgradeDesc: 'Mở khóa tính năng AI & Đa chi nhánh',
    mainMenuSection: 'CHÍNH',
    operationsSection: 'QUẢN LÝ',
    analyticsSection: 'BÁO CÁO',
    systemSection: 'HỆ THỐNG',

    // Dashboard Screen
    dashboardTitle: 'Trung tâm Quản trị Bán lẻ Thông minh',
    dashboardSubtitle: 'Hệ thống vận hành đa kênh tích hợp AI và đồng bộ thời gian thực',
    todayRevenue: 'Doanh thu hôm nay',
    todayOrders: 'Đơn hàng hôm nay',
    lowStockAlert: 'Cảnh báo sắp hết hàng',
    vipCustomers: 'Khách hàng thân thiết',
    inventoryValuation: 'Giá trị vốn kho',
    comparedToYesterday: 'so với hôm qua',
    justNow: 'Vừa xong',
    itemsNeedRestock: 'mặt hàng cần nhập',
    newMembers: 'thành viên tích cực',
    salesChartTitle: 'Biểu đồ Doanh thu & Tăng trưởng',
    salesChartSubtitle: 'Dữ liệu thời gian thực được tổng hợp tự động',
    hourlyRevenue: 'Doanh thu theo giờ',
    categorySales: 'Cơ cấu theo ngành hàng',
    topSellingProducts: 'Top sản phẩm bán chạy hôm nay',
    topSellingSubtitle: 'Dựa trên tốc độ quét mã vạch và chốt đơn tại các kênh',
    realtimeActivityStream: 'Luồng hoạt động đa kênh trực tiếp',
    realtimeActivitySubtitle: 'Cập nhật từng giây từ Shopee, TikTok Shop, POS và Kho',
    allChannels: 'Tất cả kênh',
    quickActions: 'Thao tác nhanh',
    createOrderAction: 'Tạo đơn POS mới',
    importStockAction: 'Tạo phiếu nhập kho',
    addCustomerAction: 'Thêm khách hàng',
    exportReportAction: 'Xuất báo cáo PDF',
    chartPeriod7days: '7 ngày qua',
    chartPeriod30days: '30 ngày qua',
    viewDetails: 'Xem chi tiết',
    restockNow: 'Nhập hàng ngay',

    // POS Screen
    allCategories: 'Tất cả danh mục',
    catPhones: 'Điện thoại',
    catLaptops: 'Laptop',
    catTablets: 'Máy tính bảng',
    catAccessories: 'Phụ kiện',
    catFashion: 'Thời trang',
    smartSearchProd: 'Tìm tên, mã vạch hoặc SKU...',
    cartTitle: 'Giỏ hàng POS',
    posCartTitle: 'Giỏ hàng POS',
    itemsUnit: 'món',
    selectCustomer: 'Chọn khách hàng',
    cartEmpty: 'Giỏ hàng trống',
    discountCode: 'Mã giảm giá',
    customerSelect: 'Chọn khách hàng',
    changeCustomer: 'Đổi khách hàng',
    guestCustomer: 'Khách vãng lai',
    memberTier: 'Hạng',
    rewardPoints: 'Điểm tích lũy',
    discountVip: 'Chiết khấu VIP',
    itemsInCart: 'Sản phẩm trong giỏ',
    emptyCart: 'Giỏ hàng trống',
    emptyCartPrompt: 'Chọn sản phẩm bên trái để bắt đầu thanh toán',
    subtotal: 'Tạm tính',
    discount: 'Giảm giá',
    discountVoucher: 'Mã giảm giá / Voucher',
    voucherPlaceholder: 'Nhập mã (VD: SALE10)',
    applyVoucher: 'Áp dụng',
    voucherSuccess: 'Đã áp dụng voucher giảm 10%',
    voucherInvalid: 'Mã voucher không hợp lệ',
    totalPayable: 'Khách phải trả',
    paymentMethod: 'Phương thức thanh toán',
    cash: 'Tiền mặt',
    cashPayment: 'Tiền mặt',
    qrVietQR: 'VietQR / MoMo',
    qrPayment: 'VietQR',
    card: 'Thẻ POS / Visa',
    cardPayment: 'Thẻ POS',
    cardPos: 'Thẻ POS',
    bankTransfer: 'Chuyển khoản',
    quickCheckout: 'THANH TOÁN NHANH',
    checkout: 'Thanh toán',
    addToCart: 'Thêm vào giỏ',
    clearCart: 'Làm trống giỏ',
    stockLeft: 'Tồn',
    sold: 'Đã bán',
    viewCartMobile: 'Xem giỏ hàng',
    backToProducts: 'Quay lại chọn món',
    customerPay: 'Khách đưa',
    changeMoney: 'Tiền thối lại',
    exactCash: 'Vừa đủ',

    // Products Screen
    productsTitle: 'Danh mục Sản phẩm',
    productsSubtitle: 'Quản lý toàn bộ danh mục hàng hóa, giá niêm yết và tồn kho thực tế',
    productListTitle: 'Danh mục Sản phẩm',
    productListSubtitle: 'Quản lý toàn bộ danh mục hàng hóa, giá niêm yết và tồn kho thực tế',
    addNewProduct: 'Thêm sản phẩm mới',
    addProduct: 'Thêm sản phẩm',
    importAction: 'Nhập Excel',
    exportAction: 'Xuất Excel',
    searchProduct: 'Tìm kiếm sản phẩm theo tên, SKU, barcode...',
    searchProductPlaceholder: 'Tìm kiếm theo tên sản phẩm, mã SKU, barcode...',
    productCode: 'Mã SP',
    productName: 'Tên sản phẩm',
    productCategory: 'Danh mục',
    productPrice: 'Giá bán',
    productCost: 'Giá vốn',
    productStock: 'Tồn kho',
    productStatus: 'Trạng thái',
    noMatchingProducts: 'Không tìm thấy sản phẩm phù hợp.',
    category: 'Danh mục',
    price: 'Giá bán',
    costPrice: 'Giá vốn',
    stock: 'Tồn kho',
    stockStatusInStock: 'Còn hàng',
    stockStatusIn: 'Còn hàng',
    stockStatusLow: 'Sắp hết hàng',
    stockStatusOut: 'Hết hàng',
    stockStatusAll: 'Tất cả trạng thái',
    productSku: 'Mã SKU / Barcode',
    sku: 'Mã SKU',
    editProduct: 'Chỉnh sửa sản phẩm',
    deleteProduct: 'Xóa sản phẩm',
    deleteConfirm: 'Bạn có chắc chắn muốn xóa sản phẩm này?',
    restockProduct: 'Đặt nhập hàng',
    productTotalCount: 'Tổng sản phẩm',
    enterProductDetails: 'Điền đầy đủ thông tin để lưu vào kho hệ thống',
    initialStock: 'Số lượng tồn kho ban đầu',
    imageLink: 'Link ảnh sản phẩm (URL)',

    // Customers Screen
    customersTitle: 'Quản lý Khách hàng',
    customersSubtitle: 'Theo dõi thông tin khách hàng, phân hạng VIP và điểm tích lũy',
    customerListTitle: 'Quản lý Khách hàng',
    customerListSubtitle: 'Theo dõi thông tin khách hàng, phân hạng VIP và điểm tích lũy',
    addNewCustomer: 'Thêm khách hàng mới',
    addCustomer: 'Thêm khách hàng',
    searchCustomer: 'Tìm kiếm khách hàng theo tên hoặc số điện thoại...',
    searchCustomerPlaceholder: 'Tìm kiếm theo họ tên, số điện thoại...',
    customerName: 'Họ và tên',
    customerPhone: 'Số điện thoại',
    customerTier: 'Hạng thành viên',
    tierStandard: 'Chuẩn',
    tierVip: 'VIP',
    tierVvip: 'VVIP',
    tierLabel: 'Hạng',
    allTiers: 'Tất cả hạng',
    tierDiscount: 'Chiết khấu',
    totalSpent: 'Tổng chi tiêu',
    totalCustomerSpent: 'Tổng chi tiêu toàn hệ thống',
    vvipVipTiers: 'Hạng VIP & VVIP',
    customerTotalSpent: 'Tổng chi tiêu',
    customerPoints: 'Điểm tích lũy',
    customerHistory: 'Lịch sử mua hàng',
    selectForPos: 'Chọn thanh toán POS',
    selectPosCustomer: 'Chọn khách này',
    loyaltyCustomer: 'Khách hàng thân thiết',
    selectCustomerForDiscount: 'Chọn khách hàng để áp dụng chiết khấu VIP / tích điểm',
    walkInNoPoints: 'Khách vãng lai (Không tích điểm)',
    phone: 'Số điện thoại',
    tier: 'Hạng thành viên',
    back: 'Quay lại',
    createAndSelect: 'Tạo & Chọn',

    // Invoices Screen
    invoicesTitle: 'Quản lý Hóa đơn & Đơn hàng',
    invoicesSubtitle: 'Tra cứu toàn bộ lịch sử giao dịch bán hàng đa kênh theo thời gian thực',
    searchInvoice: 'Tìm theo mã hóa đơn, tên khách hàng hoặc thu ngân...',
    searchInvoicePlaceholder: 'Tìm theo mã HD-..., tên khách hàng, thu ngân...',
    invoiceCode: 'Mã hóa đơn',
    createdAt: 'Thời gian',
    cashier: 'Thu ngân',
    channel: 'Kênh bán',
    paymentType: 'Phương thức',
    totalAmount: 'Tổng tiền',
    totalPayment: 'Tổng thanh toán',
    invoiceStatus: 'Trạng thái',
    reprintReceipt: 'In lại hóa đơn',
    reprintInvoice: 'In hóa đơn',
    invoiceDetail: 'Chi tiết hóa đơn',
    completedOrder: 'Đã hoàn tất',
    statusCompleted: 'Hoàn tất',
    statusPending: 'Đang xử lý',
    statusCancelled: 'Đã hủy',

    // Inventory & Restock Screen
    inventoryTitle: 'Quản lý Kho & Phân bổ Tồn kho',
    inventorySubtitle: 'Theo dõi số lượng tồn thực tế, cảnh báo đứt hàng và luân chuyển giữa các chi nhánh',
    totalProductsCount: 'Tổng mặt hàng SKU',
    totalStockUnits: 'Tổng số lượng sản phẩm',
    totalStockCount: 'Tổng lượng tồn kho',
    totalStockValue: 'Tổng giá trị hàng tồn',
    lowStockWarning: 'Mặt hàng sắp hết',
    outOfStockCount: 'Mặt hàng đã hết hàng',
    detailedInventoryTable: 'Danh sách Tồn kho Chi tiết & Định mức',
    searchStockPlaceholder: 'Tìm kiếm sản phẩm trong kho theo tên, SKU...',
    outOfStockAlert: 'Mặt hàng đã hết',
    lowStockAlertCount: 'Mặt hàng sắp hết',
    branchWarehouse: 'Kho chi nhánh',
    branchQ1: 'Chi nhánh Quận 1 - Hồ Chí Minh (Kho chính)',
    branchQ7: 'Chi nhánh Quận 7 - Hồ Chí Minh',
    branchHanoi: 'Chi nhánh Cầu Giấy - Hà Nội',
    branchDaNang: 'Chi nhánh Hải Châu - Đà Nẵng',
    branch: 'Chi nhánh',
    restockTitle: 'Quản lý Nhập hàng & Nhà Cung Cấp',
    restockSubtitle: 'Theo dõi tiến độ đơn đặt hàng từ nhà cung ứng và xuất nhập kho',
    createRestockOrder: 'Tạo phiếu nhập hàng',
    restockCode: 'Mã phiếu',
    supplier: 'Nhà cung cấp',
    quantityRestocked: 'Số lượng nhập',
    totalCostPrice: 'Tổng tiền vốn',
    receiveStockBtn: 'Xác nhận nhập kho',
    receivedStockStatus: 'Đã nhập kho',
    totalRestockValue: 'Tổng giá trị nhập',
    paidToSuppliers: 'Đã thanh toán nhà cung cấp',
    inTransitOrders: 'Đang vận chuyển',
    shippingToWarehouse: 'Kiện hàng đang tới kho',
    productsNeedRestock: 'Sản phẩm cần nhập',
    belowSafetyThreshold: 'Dưới định mức an toàn',
    searchRestockPlaceholder: 'Tìm mã phiếu, sản phẩm, chi nhánh...',
    allStatuses: 'Tất cả',
    inTransit: 'Đang giao hàng',
    completed: 'Đã hoàn tất',
    timestamp: 'Thời gian',
    product: 'Sản phẩm',
    quantity: 'Số lượng',
    totalCost: 'Tổng tiền',
    receivingBranch: 'Chi nhánh nhận',
    receivedInWarehouse: 'Đã vào kho',
    shippingInTransit: 'Đang vận chuyển',
    receiveGoods: 'Nhận hàng',
    reorder: 'Đặt thêm',

    // Reports Screen
    revenueReportTitle: 'Báo cáo Doanh thu & Lợi nhuận',
    revenueReportSubtitle: 'Tổng hợp số liệu doanh thu thuần, giá vốn và biên lợi nhuận thời gian thực',
    weeklyRevenue: 'Doanh thu 7 ngày qua',
    grossProfit: 'Lợi nhuận gộp',
    netRevenue: 'Doanh thu thuần',
    netRevenueToday: 'Doanh thu thuần hôm nay',
    estimatedProfit: 'Lợi nhuận gộp ước tính',
    averageOrderValue: 'Giá trị đơn trung bình (AOV)',
    costOfGoodsSold: 'Giá vốn hàng bán',
    profitMargin: 'Biên lợi nhuận',
    revenueProfitChart: 'Biểu đồ Doanh thu & Lợi nhuận',
    last7DaysSubtitle: 'Số liệu ghi nhận trong 7 ngày gần nhất',
    revenue: 'Doanh thu',
    profit: 'Lợi nhuận',
    categoryRevenueShare: 'Tỷ trọng Doanh thu theo Ngành hàng',
    categoryShareSubtitle: 'Cơ cấu đóng góp doanh thu của từng nhóm sản phẩm',
    topProfitProducts: 'Top Sản phẩm Đóng góp Lợi nhuận Cao nhất',
    topProfitSubtitle: 'Xếp hạng theo tổng giá trị lợi nhuận gộp mang lại',
    analyticsTitle: 'Phân tích Đa kênh & Khách hàng',
    analyticsSubtitle: 'Thông số chuyên sâu về tỷ trọng thanh toán, kênh phân phối và tăng trưởng',
    revenueByPaymentMethod: 'Doanh thu theo Phương thức',
    revenueByChannel: 'Doanh thu theo Kênh bán hàng',
    customerDemographics: 'Phân khúc khách hàng',
    aiDemandForecast: 'Dự báo xu hướng bằng AI',
    topBranch: 'Chi nhánh dẫn đầu',

    // AI Assistant & Analyst Screen
    aiAssistantTitle: 'Trợ lý AI Bán hàng & Điều hành',
    aiAssistantSubtitle: 'Tra cứu tồn kho tức thì, đề xuất nhập hàng và phân tích chuyên sâu',
    aiSubtitle: 'AI điều hành thông minh và tra cứu dữ liệu thời gian thực',
    aiAnalystTitle: 'AI Business Analyst',
    aiAnalystSubtitle: 'Mô hình AI phân tích chuyên sâu hiệu quả tài chính, phát hiện bất thường và dự báo kinh doanh',
    growthOpportunity: 'Cơ hội tăng trưởng',
    crossSellTitle: 'Combo Cross-sell Phụ kiện & Điện thoại',
    crossSellDesc: 'Khách hàng mua iPhone 15 Pro Max có xác suất 68% mua kèm Ốp lưng Clear Case hoặc AirPods nếu được giảm giá 5%.',
    expectedRevenue: '+14.2M dự kiến',
    createComboNow: 'Tạo combo ngay →',
    macbookStockRisk: 'MacBook Pro M3 có nguy cơ đứt hàng',
    macbookStockDesc: 'Với tốc độ bán hiện tại (1.4 máy/ngày) và tồn kho còn 5 cái, kho sẽ hết hàng trong 3.5 ngày tới.',
    orderStockNow: 'Đặt nhập hàng ngay →',
    priceMarginOptimization: 'Tối ưu giá & Biên lợi nhuận',
    tshirtElasticity: 'Áo Thun Basic Premium có độ co giãn cầu tốt',
    tshirtElasticityDesc: 'Biên lợi nhuận gộp hiện tại đạt 56%. AI khuyến nghị giữ mức giá 250.000đ và áp dụng voucher tích điểm để tối đa vòng đời khách hàng.',
    perfectOptimization: 'Tối ưu hoàn hảo ✓',
    executiveAiReport: 'Báo cáo Điều hành Chiến lược từ AI Business Analyst',
    highLevelRecommendations: 'Khuyến nghị cấp cao',
    cashFlowAnalysis: '1. Phân tích Dòng tiền & Vốn lưu động',
    next7DaysActions: '2. Đề xuất Hành động trong 7 ngày tới',
    newAiChat: '+ Phiên trò chuyện mới',
    newChat: 'Đoạn chat mới',
    quickSuggestions: 'Gợi ý câu hỏi nhanh',
    aiPromptPlaceholder: 'Hỏi AI: "Sản phẩm nào sắp hết hàng?", "Doanh thu hôm nay ra sao?"...',
    aiInputPlaceholder: 'Hỏi SmartSale AI về doanh thu, tồn kho, đơn hàng, gợi ý combo...',
    aiSend: 'Gửi',
    aiThinking: 'SmartSale AI đang phân tích dữ liệu thời gian thực...',
    aiChipRevenue: '📊 Báo cáo doanh thu hôm nay',
    aiChipStock: '⚠️ Kiểm tra hàng sắp hết',
    aiChipBestseller: '🔥 Sản phẩm bán chạy nhất',
    aiChipRestockAdvice: '💡 Gợi ý nhập hàng tuần tới',
    aiAddCartSuggestion: 'Thêm vào giỏ POS',
    aiForecastDemand: 'Dự báo tăng trưởng',
    aiPredictedGrowth: 'Mức tăng dự kiến',
    aiReorderRecommendation: 'Khuyến nghị nhập hàng',

    // Users & Permissions Screen
    usersTitle: 'Quản lý Nhân viên & Phân quyền',
    usersSubtitle: 'Quản lý tài khoản thu ngân, thủ kho và ma trận phân quyền hệ thống',
    addNewStaff: 'Thêm nhân viên mới',
    addStaff: 'Thêm nhân viên',
    staffName: 'Họ và tên nhân viên',
    staffMember: 'Nhân viên',
    contact: 'Liên hệ',
    systemRole: 'Vai trò',
    searchStaffPlaceholder: 'Tìm theo tên, email, số điện thoại...',
    allRoles: 'Tất cả vai trò',
    staffEmail: 'Email đăng nhập',
    staffRole: 'Vai trò & Quyền hạn',
    adminRole: 'Quản trị viên (Admin)',
    roleAdmin: 'Quản trị viên (Admin)',
    roleManager: 'Cửa hàng trưởng',
    roleCashier: 'Nhân viên thu ngân',
    cashierRole: 'Nhân viên thu ngân',
    roleWarehouse: 'Thủ kho',
    inventoryStaffRole: 'Thủ kho',
    staffStatus: 'Trạng thái tài khoản',
    activeStatus: 'Đang hoạt động',
    active: 'Hoạt động',
    inactiveStatus: 'Tạm khóa',
    editPermissions: 'Phân quyền',
    rbacMatrixTitle: 'Ma trận Phân quyền Vai trò Hệ thống (RBAC)',
    rbacMatrixSubtitle: 'Thiết lập quyền truy cập chi tiết cho từng phân hệ nghiệp vụ',
    functionalModule: 'Phân hệ chức năng',

    // Modals & Receipts
    receiptTitle: 'HÓA ĐƠN BÁN HÀNG',
    paymentSuccess: 'Thanh toán thành công!',
    orderCode: 'Mã đơn hàng',
    customer: 'Khách hàng',
    walkInCustomer: 'Khách vãng lai',
    method: 'Hình thức',
    totalUpper: 'TỔNG CỘNG',
    scanVietQr: 'Quét mã VietQR chuyển khoản nhanh',
    printReceipt: 'In hóa đơn',
    doneNewOrder: 'Hoàn tất đơn mới',
    restockOrderModalTitle: 'Đặt hàng nhập kho',
    restockOrderModalSubtitle: 'Tạo đơn đặt hàng nhà cung cấp để bổ sung tồn kho tự động',
    currentStock: 'Tồn hiện tại',
    productToRestock: 'Sản phẩm nhập hàng',
    restockQuantity: 'Số lượng nhập thêm (Cái)',
    estimatedCost: 'Dự toán tiền nhập hàng',
    totalOrderValue: 'Tổng giá trị đơn',
    confirmRestock: 'Xác nhận nhập kho',
    upgradeSubtitle: 'Mở khóa sức mạnh AI toàn diện cho chuỗi cửa hàng bán lẻ',
    upgradePerk1: 'Trợ lý AI Gemini Flash không giới hạn lượt truy vấn',
    upgradePerk2: 'Tự động dự báo nhập kho theo thời gian thực (Machine Learning)',
    upgradePerk3: 'Đồng bộ đa kênh Shopee, TikTok Shop, Lazada, Zalo OA',
    perMonth: ' / tháng',
    upgradeNow: 'NÂNG CẤP NGAY',
  },

  en: {
    // Common & Navigation
    appName: 'SmartSale AI',
    posName: 'SmartSale POS',
    realtimeSync: 'Real-time Sync',
    realtimeSyncOnline: 'Live Sync: Connected',
    live: 'LIVE',
    searchPlaceholderPos: 'Search product, barcode, SKU...',
    searchPlaceholderGeneral: 'Search products, orders, customers...',
    newSale: 'New Sale',
    notifications: 'Real-time Notifications',
    realtimeNotifications: 'Real-time Notifications',
    close: 'Close',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    saveChanges: 'Save Changes',
    delete: 'Delete',
    edit: 'Edit',
    actions: 'Actions',
    status: 'Status',
    all: 'All',
    today: 'Today',
    yesterday: 'Yesterday',
    pastWeek: 'Past Week',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    thisYear: 'This Year',
    last7Days: 'Last 7 Days',
    thisQuarter: 'This Quarter',
    themeToggle: 'Toggle light / dark mode',
    managerRole: 'Store Manager • District 1 Branch',
    checkLatency: 'Check network latency (0ms)',
    switchLang: 'Switch Language',
    exportData: 'Export Data',
    exportExcel: 'Export Excel',
    downloadPdf: 'Download PDF Report',
    print: 'Print',
    filter: 'Filter',
    refresh: 'Refresh',
    viewAll: 'View All',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',

    // Realtime Live Bar & Feeds
    liveChannelTitle: 'Omnichannel Real-time Synchronization',
    liveStatusConnected: 'Live Realtime WebSocket Connected',
    liveStreamActive: 'Auto-stream Orders: ON',
    liveStreamPaused: 'Auto-stream Orders: PAUSED',
    interval10s: '10s / order',
    interval20s: '20s / order',
    interval45s: '45s / order',
    intervalLabel: 'Interval:',
    pauseStream: 'Pause Stream',
    resumeStream: 'Resume Stream',
    triggerInstantOrder: '+ Trigger Order',
    muteSound: 'Mute Order Chime',
    unmuteSound: 'Unmute Order Chime',
    realtimeOrdersToday: 'Orders Today',
    realtimeRevenueToday: 'Live Revenue',
    latestEvent: 'Latest Event:',
    noRecentEvent: 'No recent events',
    activityFeedTitle: 'Live Omnichannel Activity Feed',
    activityFeedSubtitle: 'Instant synchronized events from POS counters, Shopee, TikTok Shop & Warehouses',
    allFilter: 'All Events',
    ordersFilter: 'New Orders',
    inventoryFilter: 'Stock Alerts',
    aiInsightsFilter: 'AI Insights',
    noActivitiesFound: 'No activities found matching this filter.',
    statusPaid: 'Paid',

    // Sidebar Groups & Items
    navDashboard: 'Dashboard',
    navPos: 'POS Checkout',
    navProducts: 'Products',
    navInventory: 'Inventory & Branches',
    navCustomers: 'Customers',
    navInvoices: 'Invoices & Orders',
    navRestock: 'Restock Orders',
    navRevenueReport: 'Revenue Report',
    navAnalyticsReport: 'Omnichannel Analytics',
    navAiAssistant: 'AI Copilot Assistant',
    navAiAnalyst: 'AI Business Analyst',
    navUsersPermissions: 'Staff & Roles',
    navSettings: 'System Settings',
    navSupport: 'Help Center',
    upgradePro: 'Upgrade to Pro',
    upgradeDesc: 'Unlock AI features & Multi-branch sync',
    mainMenuSection: 'MAIN',
    operationsSection: 'OPERATIONS',
    analyticsSection: 'REPORTS',
    systemSection: 'SYSTEM',

    // Dashboard Screen
    dashboardTitle: 'Smart Retail Operations Center',
    dashboardSubtitle: 'Omnichannel commerce platform powered by AI and real-time synchronization',
    todayRevenue: "Today's Revenue",
    todayOrders: "Today's Orders",
    lowStockAlert: 'Low Stock Alert',
    vipCustomers: 'Loyal VIP Members',
    inventoryValuation: 'Inventory Asset Value',
    comparedToYesterday: 'vs yesterday',
    justNow: 'Just now',
    itemsNeedRestock: 'items need restock',
    newMembers: 'active members',
    salesChartTitle: 'Revenue & Sales Growth Analytics',
    salesChartSubtitle: 'Live synchronized telemetry data across all sales channels',
    hourlyRevenue: 'Hourly Revenue',
    categorySales: 'Category Breakdown',
    topSellingProducts: 'Top Bestselling Items Today',
    topSellingSubtitle: 'Ranked by barcode scan velocities and confirmed checkout frequency',
    realtimeActivityStream: 'Live Multi-channel Activity Feed',
    realtimeActivitySubtitle: 'Instant updates from POS, Shopee, TikTok Shop and Warehouses',
    allChannels: 'All Channels',
    quickActions: 'Quick Actions',
    createOrderAction: 'Create POS Order',
    importStockAction: 'Create Restock Order',
    addCustomerAction: 'Add Customer',
    exportReportAction: 'Export PDF Report',
    chartPeriod7days: 'Last 7 Days',
    chartPeriod30days: 'Last 30 Days',
    viewDetails: 'View Details',
    restockNow: 'Restock Now',

    // POS Screen
    allCategories: 'All Categories',
    catPhones: 'Phones',
    catLaptops: 'Laptops',
    catTablets: 'Tablets',
    catAccessories: 'Accessories',
    catFashion: 'Fashion',
    smartSearchProd: 'Search name, barcode, or SKU...',
    cartTitle: 'POS Cart',
    posCartTitle: 'POS Cart',
    itemsUnit: 'items',
    selectCustomer: 'Select Customer',
    cartEmpty: 'Cart is empty',
    discountCode: 'Discount Code',
    customerSelect: 'Select Customer',
    changeCustomer: 'Change Customer',
    guestCustomer: 'Walk-in Guest',
    memberTier: 'Tier',
    rewardPoints: 'Reward Points',
    discountVip: 'VIP Discount',
    itemsInCart: 'Items in Cart',
    emptyCart: 'Cart is empty',
    emptyCartPrompt: 'Click on products on the left to start adding to cart',
    subtotal: 'Subtotal',
    discount: 'Discount',
    discountVoucher: 'Promo Voucher',
    voucherPlaceholder: 'Enter promo code (e.g. SALE10)',
    applyVoucher: 'Apply',
    voucherSuccess: 'Applied 10% voucher discount',
    voucherInvalid: 'Invalid voucher code',
    totalPayable: 'Total Amount Due',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    cashPayment: 'Cash',
    qrVietQR: 'VietQR / MoMo',
    qrPayment: 'VietQR',
    card: 'Card / Visa / POS',
    cardPayment: 'POS Card',
    cardPos: 'POS Card',
    bankTransfer: 'Bank Transfer',
    quickCheckout: 'COMPLETE CHECKOUT',
    checkout: 'Checkout',
    addToCart: 'Add to Cart',
    clearCart: 'Clear Cart',
    stockLeft: 'Stock',
    sold: 'Sold',
    viewCartMobile: 'View Cart',
    backToProducts: 'Back to Products',
    customerPay: 'Cash Received',
    changeMoney: 'Change Due',
    exactCash: 'Exact',

    // Products Screen
    productsTitle: 'Product Catalog',
    productsSubtitle: 'Manage product specifications, retail pricing and inventory across channels',
    productListTitle: 'Product Catalog',
    productListSubtitle: 'Manage product specifications, retail pricing and inventory across channels',
    addNewProduct: 'Add New Product',
    addProduct: 'Add Product',
    importAction: 'Import Excel',
    exportAction: 'Export Excel',
    searchProduct: 'Search products by name, SKU, barcode...',
    searchProductPlaceholder: 'Search by product name, SKU, barcode...',
    productCode: 'Product Code',
    productName: 'Product Name',
    productCategory: 'Category',
    productPrice: 'Price',
    productCost: 'Cost Price',
    productStock: 'Stock',
    productStatus: 'Status',
    noMatchingProducts: 'No matching products found.',
    category: 'Category',
    price: 'Retail Price',
    costPrice: 'Cost Price',
    stock: 'Stock Count',
    stockStatusInStock: 'In Stock',
    stockStatusIn: 'In Stock',
    stockStatusLow: 'Low Stock',
    stockStatusOut: 'Out of Stock',
    stockStatusAll: 'All Statuses',
    productSku: 'SKU / Barcode',
    sku: 'SKU Code',
    editProduct: 'Edit Product',
    deleteProduct: 'Delete Product',
    deleteConfirm: 'Are you sure you want to delete this product?',
    restockProduct: 'Restock Order',
    productTotalCount: 'Total Products',
    enterProductDetails: 'Fill in full information to save to inventory system',
    initialStock: 'Initial Stock Count',
    imageLink: 'Product Image URL',

    // Customers Screen
    customersTitle: 'Customer Management',
    customersSubtitle: 'Track customer profiles, membership loyalty tiers, and purchase history',
    customerListTitle: 'Customer Management',
    customerListSubtitle: 'Track customer profiles, membership loyalty tiers, and purchase history',
    addNewCustomer: 'Add New Customer',
    addCustomer: 'Add Customer',
    searchCustomer: 'Search customer by name or phone number...',
    searchCustomerPlaceholder: 'Search by customer name, phone number...',
    customerName: 'Full Name',
    customerPhone: 'Phone Number',
    customerTier: 'Membership Tier',
    tierStandard: 'Standard',
    tierVip: 'VIP',
    tierVvip: 'VVIP',
    tierLabel: 'Tier',
    allTiers: 'All Tiers',
    tierDiscount: 'Discount',
    totalSpent: 'Total Spent',
    totalCustomerSpent: 'Total System-wide Customer Spending',
    vvipVipTiers: 'VIP & VVIP Tiers',
    customerTotalSpent: 'Total Spent',
    customerPoints: 'Loyalty Points',
    customerHistory: 'Purchase History',
    selectForPos: 'Select for POS Order',
    selectPosCustomer: 'Select Customer',
    loyaltyCustomer: 'Loyalty Customer',
    selectCustomerForDiscount: 'Select customer to apply VIP discount / points',
    walkInNoPoints: 'Walk-in Guest (No loyalty points)',
    phone: 'Phone Number',
    tier: 'Membership Tier',
    back: 'Back',
    createAndSelect: 'Create & Select',

    // Invoices Screen
    invoicesTitle: 'Invoices & Orders Management',
    invoicesSubtitle: 'Search and inspect real-time omnichannel sales transactions and receipts',
    searchInvoice: 'Search by invoice #, customer name, or cashier...',
    searchInvoicePlaceholder: 'Search by invoice #, customer name, cashier...',
    invoiceCode: 'Invoice #',
    createdAt: 'Date & Time',
    cashier: 'Cashier',
    channel: 'Sales Channel',
    paymentType: 'Payment Method',
    totalAmount: 'Total Amount',
    totalPayment: 'Total Payment',
    invoiceStatus: 'Status',
    reprintReceipt: 'Reprint Receipt',
    reprintInvoice: 'Print Invoice',
    invoiceDetail: 'Invoice Details',
    completedOrder: 'Completed',
    statusCompleted: 'Completed',
    statusPending: 'Pending',
    statusCancelled: 'Cancelled',

    // Inventory & Restock Screen
    inventoryTitle: 'Inventory Stock & Branch Distribution',
    inventorySubtitle: 'Monitor stock levels, safety thresholds and total valuation per branch',
    totalProductsCount: 'Total SKU Items',
    totalStockUnits: 'Total Stock Units',
    totalStockCount: 'Total Units in Stock',
    totalStockValue: 'Total Inventory Valuation',
    lowStockWarning: 'Low Stock Items',
    outOfStockCount: 'Out of Stock Items',
    detailedInventoryTable: 'Detailed Inventory Breakdown & Thresholds',
    searchStockPlaceholder: 'Search inventory by product name, SKU...',
    outOfStockAlert: 'Out of Stock Items',
    lowStockAlertCount: 'Low Stock Items',
    branchWarehouse: 'Branch Warehouse',
    branchQ1: 'District 1 Flagship (Main Warehouse)',
    branchQ7: 'District 7 Branch Warehouse',
    branchHanoi: 'Hanoi Branch Warehouse',
    branchDaNang: 'Da Nang Branch Warehouse',
    branch: 'Branch',
    restockTitle: 'Purchase Orders & Suppliers',
    restockSubtitle: 'Manage supplier restock purchase orders and warehouse receiving logs',
    createRestockOrder: 'Create Purchase Order',
    restockCode: 'PO #',
    supplier: 'Supplier',
    quantityRestocked: 'Restock Qty',
    totalCostPrice: 'Total Cost',
    receiveStockBtn: 'Confirm Receiving',
    receivedStockStatus: 'Stock Received',
    totalRestockValue: 'Total Restock Value',
    paidToSuppliers: 'Paid to suppliers',
    inTransitOrders: 'In Transit',
    shippingToWarehouse: 'Shipments en route to warehouse',
    productsNeedRestock: 'Items Need Restock',
    belowSafetyThreshold: 'Below safety threshold',
    searchRestockPlaceholder: 'Search PO code, product, branch...',
    allStatuses: 'All Statuses',
    inTransit: 'In Transit',
    completed: 'Completed',
    timestamp: 'Time',
    product: 'Product',
    quantity: 'Quantity',
    totalCost: 'Total Cost',
    receivingBranch: 'Receiving Branch',
    receivedInWarehouse: 'Received in Warehouse',
    shippingInTransit: 'Shipping in Transit',
    receiveGoods: 'Receive Goods',
    reorder: 'Reorder',

    // Reports Screen
    revenueReportTitle: 'Revenue & Profitability Reports',
    revenueReportSubtitle: 'Summary of total sales revenue, gross profit and margins over time',
    weeklyRevenue: 'Last 7 Days Revenue',
    grossProfit: 'Gross Profit',
    netRevenue: 'Net Revenue',
    netRevenueToday: "Today's Net Revenue",
    estimatedProfit: 'Estimated Gross Profit',
    averageOrderValue: 'Average Order Value (AOV)',
    costOfGoodsSold: 'Cost of Goods Sold (COGS)',
    profitMargin: 'Profit Margin',
    revenueProfitChart: 'Revenue & Profit Chart',
    last7DaysSubtitle: 'Data recorded over the last 7 days',
    revenue: 'Revenue',
    profit: 'Profit',
    categoryRevenueShare: 'Revenue Share by Category',
    categoryShareSubtitle: 'Contribution breakdown across each product group',
    topProfitProducts: 'Top Profit-Generating Products',
    topProfitSubtitle: 'Ranked by total cumulative gross profit',
    analyticsTitle: 'Analytics & Sales Intelligence',
    analyticsSubtitle: 'Breakdown of revenue by sales channels, payment methods and customer cohorts',
    revenueByPaymentMethod: 'Revenue by Payment Method',
    revenueByChannel: 'Revenue by Sales Channel',
    customerDemographics: 'Customer Demographics',
    aiDemandForecast: 'AI Demand Forecast',
    topBranch: 'Leading Branch',

    // AI Assistant & Analyst Screen
    aiAssistantTitle: 'AI Sales Assistant & Executive Copilot',
    aiAssistantSubtitle: 'Real-time inventory lookup, automated ordering and intelligent analytics copilot',
    aiSubtitle: 'Intelligent copilot & real-time retail telemetry queries',
    aiAnalystTitle: 'AI Business Analyst',
    aiAnalystSubtitle: 'Deep AI models analyzing financial performance, anomaly detection and business forecasting',
    growthOpportunity: 'Growth Opportunity',
    crossSellTitle: 'Cross-sell Combo: Accessories & Phones',
    crossSellDesc: 'Customers buying iPhone 15 Pro Max have a 68% probability of adding a Clear Case or AirPods when offered a 5% discount.',
    expectedRevenue: '+$560 expected',
    createComboNow: 'Create combo now →',
    macbookStockRisk: 'MacBook Pro M3 Stockout Risk',
    macbookStockDesc: 'At current sales velocity (1.4 units/day) with 5 units remaining, stock will deplete in 3.5 days.',
    orderStockNow: 'Place Restock Order →',
    priceMarginOptimization: 'Price & Margin Optimization',
    tshirtElasticity: 'Premium Basic T-Shirt has strong price elasticity',
    tshirtElasticityDesc: 'Gross margin currently reaches 56%. AI recommends maintaining pricing and offering loyalty points to maximize customer LTV.',
    perfectOptimization: 'Optimal Pricing ✓',
    executiveAiReport: 'Executive AI Strategy Report',
    highLevelRecommendations: 'High-level Recommendations',
    cashFlowAnalysis: '1. Cash Flow & Working Capital Analysis',
    next7DaysActions: '2. Next 7-Day Action Plan',
    newAiChat: '+ New AI Session',
    newChat: 'New Chat',
    quickSuggestions: 'Quick AI Prompts',
    aiPromptPlaceholder: 'Ask AI: "Which items are low in stock?", "How is revenue today?"...',
    aiInputPlaceholder: 'Ask SmartSale AI about revenue, stock, orders, combo recommendations...',
    aiSend: 'Send',
    aiThinking: 'SmartSale AI is analyzing real-time data...',
    aiChipRevenue: '📊 Revenue report for today',
    aiChipStock: '⚠️ Check low stock alerts',
    aiChipBestseller: '🔥 Top bestsellers today',
    aiChipRestockAdvice: '💡 Restock recommendations next week',
    aiAddCartSuggestion: 'Add to POS Cart',
    aiForecastDemand: 'Growth Forecast',
    aiPredictedGrowth: 'Projected Growth',
    aiReorderRecommendation: 'Reorder Recommendations',

    // Users & Permissions Screen
    usersTitle: 'Staff & Role-Based Access Control',
    usersSubtitle: 'Manage cashier accounts, warehouse personnel and permission matrices',
    addNewStaff: 'Add New Staff',
    addStaff: 'Add Staff',
    staffName: 'Staff Full Name',
    staffMember: 'Staff Member',
    contact: 'Contact Info',
    systemRole: 'System Role',
    searchStaffPlaceholder: 'Search by name, email, phone...',
    allRoles: 'All Roles',
    staffEmail: 'Login Email',
    staffRole: 'Role & Permissions',
    adminRole: 'Administrator (Admin)',
    roleAdmin: 'Administrator (Admin)',
    roleManager: 'Store Manager',
    roleCashier: 'Cashier',
    cashierRole: 'Cashier',
    roleWarehouse: 'Warehouse Staff',
    inventoryStaffRole: 'Warehouse Staff',
    staffStatus: 'Account Status',
    activeStatus: 'Active',
    active: 'Active',
    inactiveStatus: 'Disabled',
    editPermissions: 'Permissions',
    rbacMatrixTitle: 'Role-Based Access Control Matrix (RBAC)',
    rbacMatrixSubtitle: 'Configure fine-grained module access for each organizational role',
    functionalModule: 'Functional Module',

    // Modals & Receipts
    receiptTitle: 'SALES RECEIPT',
    paymentSuccess: 'Payment Successful!',
    orderCode: 'Order #',
    customer: 'Customer',
    walkInCustomer: 'Walk-in Guest',
    method: 'Method',
    totalUpper: 'TOTAL AMOUNT',
    scanVietQr: 'Scan VietQR to pay instantly',
    printReceipt: 'Print Receipt',
    doneNewOrder: 'Complete New Order',
    restockOrderModalTitle: 'Warehouse Restock Order',
    restockOrderModalSubtitle: 'Create supplier purchase orders to automatically replenish stock',
    currentStock: 'Current Stock',
    productToRestock: 'Product to Restock',
    restockQuantity: 'Restock Quantity (Units)',
    estimatedCost: 'Estimated Restock Cost',
    totalOrderValue: 'Total Order Value',
    confirmRestock: 'Confirm Restock Order',
    upgradeSubtitle: 'Unlock the full power of AI for your retail store chain',
    upgradePerk1: 'Unlimited Gemini Flash AI queries and analyses',
    upgradePerk2: 'Automated real-time inventory machine learning predictions',
    upgradePerk3: 'Omnichannel sync with Shopee, TikTok Shop, Lazada & Zalo OA',
    perMonth: ' / month',
    upgradeNow: 'UPGRADE NOW',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
  formatCurr: (amount: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('smartsale_lang');
    return saved === 'en' ? 'en' : 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('smartsale_lang', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  const formatCurr = (amount: number): string => {
    if (language === 'en') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(Math.round(amount / 25000));
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount).replace('₫', 'đ');
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    toggleLanguage,
    t: translations[language],
    formatCurr,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
