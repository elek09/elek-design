export interface ProductOptions {
  hardware_types: string[];
  color_schemes: string[];
  // Allow future flexible option groups without additional code changes
  [key: string]: string[] | undefined;
}

export interface Product {
  id: number;
  slug: string;
  name: string; // Hungarian display name
  description?: string;
  is_active?: boolean;
  options: ProductOptions;
}

export interface ApiListResponse<T> {
  data: T[];
}

export interface ApiItemResponse<T> {
  data: T;
}
