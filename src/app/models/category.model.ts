export interface Category {
  id?: number;
  _id?: number | string;
  name: string;
  type: string;
  subcategories: { id?: string; name: string; nav_order?: number }[] | string[];
  nav_order?: number;
}
