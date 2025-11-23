export type OrderStatus = 'new' | 'accepted' | 'rejected';
export type OrderKind = 'order' | 'quote';

export interface OrderItemOptions {
  hardware_type?: string;
  color_scheme?: string;
  [key: string]: string | undefined;
}

export interface OrderItem {
  id: number;
  product_id: number;
  // Admin API returns a nested product object; keep product_name optionally for legacy
  product?: { id: number; name: string; slug: string };
  product_name?: string; // fallback for legacy responses
  quantity: number;
  unit_price?: number | null; // null for quote
  options?: OrderItemOptions;
  // subtotal may be provided by backend for orders
  subtotal?: number | null;
}

export interface Order {
  id: number;
  kind: OrderKind; // 'order' or 'quote'
  is_quote?: boolean; // convenience flag from backend
  status: OrderStatus;
  // Admin API: nested customer object
  customer: {
    name: string;
    email: string;
    phone?: string | null;
  };
  items: OrderItem[];
  total?: number | null; // null for quote
  // Response alias for admin_note
  note?: string | null;
  // Keep admin_note optional for update payload compatibility (may not be present on GET)
  admin_note?: string | null;
  created_at: string;
}

export interface OrderUpdateItemPayload {
  id: number; // order_item id
  quantity?: number;
  unit_price?: number;
}

export interface OrderUpdatePayload {
  status?: OrderStatus;
  admin_note?: string;
  total?: number; // optional; if omitted, backend recalculates (order only)
  items?: OrderUpdateItemPayload[];
}
