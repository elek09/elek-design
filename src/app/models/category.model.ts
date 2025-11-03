export interface Category {
  id?: number;
  _id?: number | string;
  name: string;
  type: string;
  subcategories: { id?: string; name: string }[] | string[];
  nav_order?: number;
}
