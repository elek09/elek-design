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

export interface OrderItemPublic {
  product_id: number;
  quantity: number;
  options?: CartItemOptions;
}

export interface OrderRequest {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  is_quote: boolean;
  items: OrderItemPublic[];
}

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
  is_quote?: boolean;
  items: SubmitOrderItem[];
}
