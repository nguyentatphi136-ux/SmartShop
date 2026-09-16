import { Product, Customer, ChatSession, WarehouseBranch, Order, RestockOrder, StaffUser } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    code: 'SP-1001',
    name: 'iPhone 15 Pro Max 256GB',
    category: 'Điện thoại',
    price: 29590000,
    costPrice: 26000000,
    stock: 12,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
    status: 'in_stock',
    soldCount: 28,
    brand: 'Apple',
    sku: 'IP15PM-256'
  },
  {
    id: 'prod-2',
    code: 'SP-1002',
    name: 'MacBook Pro M3 14-inch',
    category: 'Laptop',
    price: 39990000,
    costPrice: 34000000,
    stock: 5,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
    status: 'low_stock',
    soldCount: 12,
    brand: 'Apple',
    sku: 'MBP-M3-14'
  },
  {
    id: 'prod-3',
    code: 'SP-1003',
    name: 'Sony WH-1000XM5',
    category: 'Phụ kiện',
    price: 7490000,
    costPrice: 5800000,
    stock: 0,
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80',
    status: 'out_of_stock',
    soldCount: 15,
    brand: 'Sony',
    sku: 'SN-WH1000XM5'
  },
  {
    id: 'prod-4',
    code: 'SP-1004',
    name: 'Apple Watch Series 9',
    category: 'Phụ kiện',
    price: 10290000,
    costPrice: 8500000,
    stock: 24,
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80',
    status: 'in_stock',
    soldCount: 35,
    brand: 'Apple',
    sku: 'AW-SERIES9-45'
  },
  {
    id: 'prod-5',
    code: 'SP-1005',
    name: 'Samsung Galaxy A55',
    category: 'Điện thoại',
    price: 10000000,
    costPrice: 7800000,
    stock: 48,
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80',
    status: 'in_stock',
    soldCount: 42,
    brand: 'Samsung',
    sku: 'SS-A55-128'
  },
  {
    id: 'prod-6',
    code: 'SP-1006',
    name: 'MacBook Air M2 8GB/256GB',
    category: 'Laptop',
    price: 26590000,
    costPrice: 22500000,
    stock: 12,
    image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&auto=format&fit=crop&q=80',
    status: 'low_stock',
    soldCount: 19,
    brand: 'Apple',
    sku: 'MBA-M2-256'
  },
  {
    id: 'prod-7',
    code: 'SP-1007',
    name: 'Ốp lưng iPhone 15 Pro Max Clear Case',
    category: 'Phụ kiện',
    price: 1490000,
    costPrice: 700000,
    stock: 0,
    image: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=600&auto=format&fit=crop&q=80',
    status: 'out_of_stock',
    soldCount: 88,
    brand: 'Apple',
    sku: 'ACC-IP15-CASE'
  },
  {
    id: 'prod-8',
    code: 'SP-1008',
    name: 'iPhone 14 Pro Max 256GB',
    category: 'Điện thoại',
    price: 24990000,
    costPrice: 21000000,
    stock: 3,
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80',
    status: 'low_stock',
    soldCount: 65,
    brand: 'Apple',
    sku: 'IP14PM-256'
  },
  {
    id: 'prod-9',
    code: 'SP-1009',
    name: 'Áo Thun Trắng Basic Premium',
    category: 'Thời trang',
    price: 250000,
    costPrice: 110000,
    stock: 45,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    status: 'in_stock',
    soldCount: 120,
    brand: 'SmartStyle',
    sku: 'AT-WHITE-PRE'
  },
  {
    id: 'prod-10',
    code: 'SP-1010',
    name: 'iPad Air M2 11-inch Wi-Fi 128GB',
    category: 'Tablet',
    price: 16990000,
    costPrice: 14200000,
    stock: 18,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80',
    status: 'in_stock',
    soldCount: 14,
    brand: 'Apple',
    sku: 'IPAD-AIR-M2'
  },
  {
    id: 'prod-11',
    code: 'SP-1011',
    name: 'AirPods Pro Gen 2 (MagSafe USB-C)',
    category: 'Phụ kiện',
    price: 5890000,
    costPrice: 4800000,
    stock: 30,
    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80',
    status: 'in_stock',
    soldCount: 52,
    brand: 'Apple',
    sku: 'APP2-USBC'
  },
  {
    id: 'prod-12',
    code: 'SP-1012',
    name: 'Samsung Galaxy Tab S9 Ultra',
    category: 'Tablet',
    price: 24490000,
    costPrice: 20000000,
    stock: 8,
    image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&auto=format&fit=crop&q=80',
    status: 'in_stock',
    soldCount: 7,
    brand: 'Samsung',
    sku: 'SS-TABS9U'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Nguyễn Văn Hùng',
    phone: '0908 123 456',
    email: 'vanhung.nguyen@gmail.com',
    tier: 'VVIP',
    discountPercent: 5,
    rewardPoints: 2450,
    totalSpent: 125000000
  },
  {
    id: 'cust-2',
    name: 'Trần Thị Bích Ngọc',
    phone: '0912 888 999',
    email: 'bichngoc.tran@yahoo.com',
    tier: 'VIP',
    discountPercent: 3,
    rewardPoints: 1200,
    totalSpent: 45000000
  },
  {
    id: 'cust-3',
    name: 'Lê Hoàng Long',
    phone: '0987 654 321',
    email: 'hoanglong.le@gmail.com',
    tier: 'Chuẩn',
    discountPercent: 0,
    rewardPoints: 350,
    totalSpent: 12000000
  }
];

export const INITIAL_BRANCHES: WarehouseBranch[] = [
  {
    id: 'branch-main',
    name: 'Cửa hàng chính (Kho tại chỗ)',
    address: '68 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
    manager: 'Nguyễn Tất Phi',
    phone: '0909 888 777',
    inventoryCount: 1420,
    inventoryValue: 480000000,
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    code: 'HD-8891',
    createdAt: '2026-08-15 14:32',
    customer: INITIAL_CUSTOMERS[0],
    items: [
      { product: INITIAL_PRODUCTS[0], quantity: 1 },
      { product: INITIAL_PRODUCTS[3], quantity: 1 },
    ],
    subtotal: 39880000,
    discount: 514500,
    total: 39365500,
    paymentMethod: 'qr_code',
    status: 'completed',
    cashier: 'Trần Văn Quyết',
  },
  {
    id: 'ord-102',
    code: 'HD-8890',
    createdAt: '2026-08-15 13:15',
    customer: INITIAL_CUSTOMERS[1],
    items: [
      { product: INITIAL_PRODUCTS[1], quantity: 1 },
    ],
    subtotal: 39990000,
    discount: 0,
    total: 39990000,
    paymentMethod: 'bank_transfer',
    status: 'completed',
    cashier: 'Lê Thảo My',
  },
  {
    id: 'ord-103',
    code: 'HD-8889',
    createdAt: '2026-08-15 11:20',
    customer: INITIAL_CUSTOMERS[2],
    items: [
      { product: INITIAL_PRODUCTS[8], quantity: 2 },
      { product: INITIAL_PRODUCTS[10], quantity: 1 },
    ],
    subtotal: 6390000,
    discount: 200000,
    total: 6190000,
    paymentMethod: 'cash',
    status: 'completed',
    cashier: 'Trần Văn Quyết',
  },
  {
    id: 'ord-104',
    code: 'HD-8888',
    createdAt: '2026-08-14 17:45',
    customer: undefined,
    items: [
      { product: INITIAL_PRODUCTS[4], quantity: 1 },
    ],
    subtotal: 10000000,
    discount: 0,
    total: 10000000,
    paymentMethod: 'card',
    status: 'completed',
    cashier: 'Lê Thảo My',
  },
];

export const INITIAL_RESTOCK_ORDERS: RestockOrder[] = [
  {
    id: 'restock-1',
    code: 'PNK-2026-0801',
    createdAt: '2026-08-14 09:30',
    product: INITIAL_PRODUCTS[2], // Sony WH-1000XM5
    quantity: 20,
    totalCost: 116000000,
    branch: 'Kho cửa hàng chính',
    status: 'in_transit',
  },
  {
    id: 'restock-2',
    code: 'PNK-2026-0798',
    createdAt: '2026-08-13 14:15',
    product: INITIAL_PRODUCTS[6], // Ốp lưng iPhone 15 Pro Max
    quantity: 50,
    totalCost: 35000000,
    branch: 'Kho cửa hàng chính',
    status: 'completed',
  },
  {
    id: 'restock-3',
    code: 'PNK-2026-0785',
    createdAt: '2026-08-12 11:00',
    product: INITIAL_PRODUCTS[1], // MacBook Pro M3
    quantity: 10,
    totalCost: 340000000,
    branch: 'Kho cửa hàng chính',
    status: 'completed',
  },
];

export const INITIAL_STAFF: StaffUser[] = [
  {
    id: 'user-1',
    name: 'Nguyễn Tất Phi (Chủ cửa hàng)',
    email: 'nguyentatphi136@gmail.com',
    phone: '0909 888 777',
    role: 'admin',
    status: 'active',
    branch: 'Cửa hàng chính',
    faceRequired: true,
    faceRegistered: true,
  },
  {
    id: 'user-2',
    name: 'Thân Phú Cường (Quản lý)',
    email: 'cuong.than@smartsale.ai',
    phone: '0912 345 678',
    role: 'manager',
    status: 'active',
    branch: 'Cửa hàng chính',
    faceRequired: true,
    faceRegistered: true,
  },
  {
    id: 'user-3',
    name: 'Trần Văn Quyết',
    email: 'quyet.tran@smartsale.ai',
    phone: '0988 123 456',
    role: 'cashier',
    status: 'active',
    branch: 'Cửa hàng chính',
    faceRequired: false,
    faceRegistered: false,
  },
  {
    id: 'user-4',
    name: 'Lê Thảo My',
    email: 'thaomy.le@smartsale.ai',
    phone: '0933 999 111',
    role: 'cashier',
    status: 'active',
    branch: 'Cửa hàng chính',
    faceRequired: false,
    faceRegistered: false,
  },
  {
    id: 'user-5',
    name: 'Võ Thành Đạt',
    email: 'dat.vo@smartsale.ai',
    phone: '0977 444 555',
    role: 'inventory_staff',
    status: 'active',
    branch: 'Cửa hàng chính',
    faceRequired: false,
    faceRegistered: false,
  },
];

export const INITIAL_CHAT_SESSIONS: ChatSession[] = [
  {
    id: 'session-1',
    title: 'Doanh thu hôm nay thế nào?',
    timeCategory: 'today',
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        text: 'Doanh thu hôm nay thế nào?',
        timestamp: '10:15',
      },
      {
        id: 'msg-2',
        sender: 'ai',
        text: 'Chào bạn! Doanh thu hôm nay của cửa hàng đạt **12.500.000đ**, **↗️tăng 12%** so với hôm qua. Đặc biệt, sản phẩm dưới đây đang bán rất chạy:',
        timestamp: '10:15',
        productCard: {
          name: 'Áo Thun Trắng Basic Premium',
          price: 250000,
          stock: 45,
          image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
          actionText: 'NHẬP VÀO GIỎ',
        },
      },
    ],
  },
  {
    id: 'session-2',
    title: 'Tồn kho sản phẩm áo thun',
    timeCategory: 'today',
    messages: [
      {
        id: 'msg-3',
        sender: 'user',
        text: 'Tồn kho sản phẩm áo thun thế nào?',
        timestamp: '08:30',
      },
      {
        id: 'msg-4',
        sender: 'ai',
        text: 'Sản phẩm **Áo Thun Trắng Basic Premium** hiện còn **45 chiếc** trong kho chính Quận 1. Với tốc độ bán 15 áo/ngày, bạn nên bổ sung thêm trong 3 ngày tới.',
        timestamp: '08:30',
      },
    ],
  },
  {
    id: 'session-3',
    title: 'Báo cáo bán hàng tháng 10',
    timeCategory: 'yesterday',
    messages: [
      {
        id: 'msg-5',
        sender: 'user',
        text: 'Báo cáo bán hàng tháng 10 thế nào?',
        timestamp: 'Hôm qua',
      },
      {
        id: 'msg-6',
        sender: 'ai',
        text: 'Tổng doanh thu tháng 10 đạt **345.000.000đ** (đạt 105% chỉ tiêu đề ra). Ngành hàng Điện thoại đóng góp 62% tổng doanh thu.',
        timestamp: 'Hôm qua',
      },
    ],
  },
  {
    id: 'session-4',
    title: 'Phân tích khách hàng VIP',
    timeCategory: 'yesterday',
    messages: [
      {
        id: 'msg-7',
        sender: 'user',
        text: 'Phân tích khách hàng VIP tháng này',
        timestamp: 'Hôm qua',
      },
      {
        id: 'msg-8',
        sender: 'ai',
        text: 'Có 148 lượt mua hàng từ khách hàng hạng VVIP & VIP, đóng góp 42% doanh thu. Tỷ lệ giữ chân khách hàng quay lại tăng 8.5%.',
        timestamp: 'Hôm qua',
      },
    ],
  },
  {
    id: 'session-5',
    title: 'Dự báo doanh thu tuần tới',
    timeCategory: 'week_ago',
    messages: [
      {
        id: 'msg-9',
        sender: 'user',
        text: 'Dự báo doanh thu tuần tới cho các chi nhánh',
        timestamp: '7 ngày trước',
      },
      {
        id: 'msg-10',
        sender: 'ai',
        text: 'Dự kiến doanh thu tuần tới sẽ đạt khoảng 95.000.000đ do có sự kiện khuyến mãi phụ kiện và đợt hàng mới về.',
        timestamp: '7 ngày trước',
      },
    ],
  },
  {
    id: 'session-6',
    title: 'Tạo chiến dịch khuyến mãi...',
    timeCategory: 'week_ago',
    messages: [
      {
        id: 'msg-11',
        sender: 'user',
        text: 'Gợi ý tạo chiến dịch khuyến mãi cuối tuần',
        timestamp: '7 ngày trước',
      },
      {
        id: 'msg-12',
        sender: 'ai',
        text: 'Đề xuất chiến dịch "Ngày hội VVIP": Giảm ngay 5% phụ kiện khi mua kèm bất kỳ điện thoại hoặc laptop nào.',
        timestamp: '7 ngày trước',
      },
    ],
  },
];

