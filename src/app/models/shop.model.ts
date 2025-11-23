export interface CartItemOptions {
  hardware_type?: string;
  color_scheme?: string;
}

export interface CartItemRequest {
  product_id: number;
  quantity: number;
  options?: CartItemOptions;
}

export interface CheckoutRequest {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
}

export interface OrderItem {
  product_id: number;
  quantity: number;
  options?: CartItemOptions;
}

export interface OrderRequest {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  is_quote: boolean;
  items: OrderItem[];
}

export interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
}

// Public submit endpoint payloads
export interface SubmitOrderItem {
  product_id: number;
  quantity: number;
  options?: CartItemOptions;
  hardware_type?: string;
  color_scheme?: string;
}

export interface SubmitOrderRequest {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  is_quote?: boolean; // true for quote, omitted/false for order
  items: SubmitOrderItem[];
}
