// Admin order models
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
  product?: { id: number; name: string; slug: string };
  product_name?: string;
  quantity: number;
  unit_price?: number | null;
  options?: OrderItemOptions;
  subtotal?: number | null;
}

export interface Order {
  id: number;
  kind: OrderKind;
  is_quote?: boolean;
  status: OrderStatus;
  customer: { name: string; email: string; phone?: string | null };
  items: OrderItem[];
  total?: number | null;
  note?: string | null;
  admin_note?: string | null;
  created_at: string;
}

export interface OrderUpdateItemPayload {
  id: number;
  quantity?: number;
  unit_price?: number;
}

export interface OrderUpdatePayload {
  status?: OrderStatus;
  admin_note?: string;
  total?: number;
  items?: OrderUpdateItemPayload[];
}
