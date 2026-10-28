export interface Subcategory {
  id?: number | string;
  category_id?: number;
  slug: string;
  name: string;
  nav_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id?: number;
  _id?: number | string;
  name: string;
  type: string;
  subcategories: Subcategory[] | string[];
  nav_order?: number;
}
