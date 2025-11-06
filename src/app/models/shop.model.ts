export type CartItemOptions = {
  hardware_type?: string;
  color_scheme?: string;
};

export type CartItemRequest = {
  product_id: number;
  quantity: number;
  options?: CartItemOptions;
};

export type CheckoutRequest = {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
};

export type OrderItem = {
  product_id: number;
  quantity: number;
  options?: CartItemOptions;
};

export type OrderRequest = {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  is_quote: boolean;
  items: OrderItem[];
};

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
}

// Public submit endpoint payloads
export type SubmitOrderItem = {
  product_id: number;
  quantity: number;
  options?: CartItemOptions;
  hardware_type?: string;
  color_scheme?: string;
};

export type SubmitOrderRequest = {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  is_quote?: boolean; // true for quote, omitted/false for order
  items: SubmitOrderItem[];
};
