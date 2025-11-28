export interface ProductOptions {
  hardware_types: string[];
  color_schemes: string[];
  [key: string]: string[] | undefined;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  description?: string;
  is_active?: boolean;
  options: ProductOptions;
}
