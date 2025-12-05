// Types
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  class?: string;
  role: 'ADMIN' | 'ANGGOTA';
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  category?: string;
  unit?: string;
  price_rp: number;
  stock: number;
  image_url?: string;
  description?: string;
  is_active?: boolean;
  // camelCase alias untuk kompatibilitas
  priceRp?: number;
  imageUrl?: string;
  isActive?: boolean;
}

export interface OrderItem {
  id: number;
  // snake_case dari backend/UI
  product_id?: number;
  // camelCase alias
  productId?: number;
  qty: number;
  // snake_case dan alias
  price_rp?: number;
  priceRp?: number;
  product?: Product;
}

export interface Order {
  id: number;
  // snake_case yang dipakai di beberapa halaman
  order_code?: string;
  user_id?: number;
  status: 'PENDING' | 'DIPROSES' | 'DITOLAK' | 'SELESAI';
  notes?: string;
  // snake_case dan camelCase alias
  delivery_method?: 'AMBIL' | 'ANTAR_KELAS';
  address_or_class?: string;
  subtotal_rp?: number;
  created_at?: string;
  updated_at?: string;
  orderCode?: string;
  userId?: number;
  deliveryMethod?: 'AMBIL' | 'ANTAR_KELAS';
  addressOrClass?: string;
  subtotalRp?: number;
  createdAt?: string;
  updatedAt?: string;
  items: OrderItem[];
  user?: User;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}

// API Base URL
const API_BASE = (import.meta.env?.VITE_API_BASE_URL as string) || '/api';

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// Auth API
export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  if (!res.ok) {
    let message = 'Login failed';
    try {
      const text = await res.text();
      const error = text ? JSON.parse(text) : {};
      message = error.error || error.message || res.statusText || message;
    } catch {}
    throw new Error(message);
  }
  
  return res.json();
}

export async function register(name: string, email: string, password: string, phone?: string, className?: string): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, phone, class: className }),
  });
  
  if (!res.ok) {
    let message = 'Registration failed';
    try {
      const text = await res.text();
      const error = text ? JSON.parse(text) : {};
      message = error.error || error.message || res.statusText || message;
    } catch {}
    throw new Error(message);
  }
  
  return res.json();
}

export async function getMe(): Promise<User> {
  const res = await fetch(`${API_BASE}/users/me`, {
    headers: getAuthHeaders(),
  });
  
  if (!res.ok) {
    throw new Error('Failed to get user info');
  }
  
  return res.json();
}

// Products API
export async function fetchProducts(params: {
  q?: string;
  query?: string;
  category?: string;
  page?: number;
  size?: number;
  sort?: string;
} = {}): Promise<{ data: Product[]; totalPages: number }> {
  const searchParams = new URLSearchParams();
  const q = params.q ?? params.query;
  
  if (q) searchParams.set('q', q);
  if (params.category) searchParams.set('category', params.category);
  if (params.page) searchParams.set('page', (params.page ?? 1).toString());
  if (params.size) searchParams.set('size', params.size.toString());
  if (params.sort) searchParams.set('sort', params.sort);
  
  const res = await fetch(`${API_BASE}/products?${searchParams.toString()}`);
  
  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }
  
  const json = await res.json();
  // Normalisasi product
  const normalize = (p: any): Product => {
    const price_rp = p.price_rp ?? p.priceRp ?? p.price ?? 0;
    const image_url = p.image_url ?? p.imageUrl;
    const is_active = p.is_active ?? p.isActive;
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      unit: p.unit,
      price_rp,
      stock: p.stock ?? 0,
      image_url,
      description: p.description,
      is_active,
      priceRp: price_rp,
      imageUrl: image_url,
      isActive: is_active,
    };
  };
  
  let data: Product[] = [];
  let totalPages = 1;
  if (Array.isArray(json?.data) && json?.pagination) {
    data = json.data.map((p: any) => normalize(p));
    totalPages = json.pagination.totalPages ?? 1;
  } else if (Array.isArray(json?.data) && typeof json?.totalPages === 'number') {
    data = json.data.map((p: any) => normalize(p));
    totalPages = json.totalPages;
  } else if (Array.isArray(json)) {
    data = json.map((p: any) => normalize(p));
    totalPages = 1;
  }
  
  return { data, totalPages };
}

export async function getProduct(id: number): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}`);
  
  if (!res.ok) {
    throw new Error('Failed to fetch product');
  }
  
  return res.json();
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(product),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create product');
  }
  
  return res.json();
}

export async function updateProduct(id: number, product: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(product),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update product');
  }
  
  return res.json();
}

export async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete product');
  }
}

// Orders API
export async function createOrder(orderData: {
  items: { productId: number; qty: number }[];
  deliveryMethod: 'AMBIL' | 'ANTAR_KELAS';
  addressOrClass?: string;
  notes?: string;
}): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...orderData,
      items: orderData.items.map(i => ({ product_id: i.productId, qty: i.qty })),
      delivery_method: orderData.deliveryMethod,
      address_or_class: orderData.addressOrClass,
    }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create order');
  }
  
  const saved = await res.json();
  return normalizeOrder(saved);
}

export async function getMyOrders(): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/orders/my`, {
    headers: getAuthHeaders(),
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch orders');
  }
  const json = await res.json();
  return Array.isArray(json) ? json.map(normalizeOrder) : [];
}

// Alias for compatibility with Orders.tsx
export const fetchMyOrders = getMyOrders;

export async function getAllOrders(params: {
  status?: string;
  page?: number;
  size?: number;
} = {}): Promise<PaginatedResponse<Order>> {
  const searchParams = new URLSearchParams();
  
  if (params.status) searchParams.append('status', params.status);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.size) searchParams.append('size', params.size.toString());
  
  const res = await fetch(`${API_BASE}/orders?${searchParams.toString()}`, {
    headers: getAuthHeaders(),
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch orders');
  }
  const json = await res.json();
  const data = Array.isArray(json?.data) ? json.data.map((o: any) => normalizeOrder(o)) : [];
  const pagination = json?.pagination ?? { page: params.page ?? 1, size: params.size ?? data.length, total: data.length, totalPages: 1 };
  return { data, pagination };
}

// Alias untuk kompatibilitas Admin.tsx: kembalikan array Order
export async function fetchAllOrders(params: {
  status?: string;
  page?: number;
  size?: number;
} = {}): Promise<Order[]> {
  const res = await getAllOrders(params);
  return res.data;
}

export async function getOrder(id: number): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${id}`, {
    headers: getAuthHeaders(),
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch order');
  }
  const json = await res.json();
  return normalizeOrder(json);
}

export async function updateOrderStatus(id: number, status: string, notes?: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, notes }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update order status');
  }
  
  const json = await res.json();
  return normalizeOrder(json);
}

// Reports API
export async function getMonthlyReport(year: number, month: number, format?: 'pdf' | 'xlsx'): Promise<any> {
  const searchParams = new URLSearchParams({
    year: year.toString(),
    month: month.toString(),
  });
  
  if (format) searchParams.set('format', format);
  
  const res = await fetch(`${API_BASE}/reports/monthly?${searchParams}`, {
    headers: getAuthHeaders(),
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch monthly report');
  }
  
  return res.json();
}

// Alias laporan bulanan
export const fetchMonthlyReport = getMonthlyReport;

export async function getAnalytics(days: number = 30): Promise<any> {
  const res = await fetch(`${API_BASE}/reports/analytics?days=${days}`, {
    headers: getAuthHeaders(),
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch analytics');
  }
  
  return res.json();
}

// Normalisasi Order agar mendukung snake_case dan camelCase
function normalizeOrder(o: any): Order {
  const order_code = o.order_code ?? o.orderCode;
  const user_id = o.user_id ?? o.userId;
  const created_at = o.created_at ?? o.createdAt;
  const updated_at = o.updated_at ?? o.updatedAt;
  const delivery_method = o.delivery_method ?? o.deliveryMethod;
  const address_or_class = o.address_or_class ?? o.addressOrClass;
  const subtotal_rp = o.subtotal_rp ?? o.subtotalRp;
  const items: OrderItem[] = Array.isArray(o.items)
    ? o.items.map((it: any) => ({
        id: it.id,
        product_id: it.product_id ?? it.productId,
        productId: it.product_id ?? it.productId,
        qty: it.qty,
        price_rp: it.price_rp ?? it.priceRp,
        priceRp: it.price_rp ?? it.priceRp,
        product: it.product ? {
          id: it.product.id,
          sku: it.product.sku,
          name: it.product.name,
          category: it.product.category,
          unit: it.product.unit,
          price_rp: it.product.price_rp ?? it.product.priceRp,
          stock: it.product.stock ?? 0,
          image_url: it.product.image_url ?? it.product.imageUrl,
          description: it.product.description,
          is_active: it.product.is_active ?? it.product.isActive,
          priceRp: it.product.price_rp ?? it.product.priceRp,
          imageUrl: it.product.image_url ?? it.product.imageUrl,
          isActive: it.product.is_active ?? it.product.isActive,
        } : undefined,
      }))
    : [];
  const user = o.user ? { ...o.user } : undefined;
  return {
    id: o.id,
    order_code,
    user_id,
    created_at,
    updated_at,
    delivery_method,
    address_or_class,
    subtotal_rp,
    orderCode: order_code,
    userId: user_id,
    createdAt: created_at,
    updatedAt: updated_at,
    deliveryMethod: delivery_method,
    addressOrClass: address_or_class,
    subtotalRp: subtotal_rp,
    status: o.status,
    notes: o.notes,
    items,
    user,
  };
}

