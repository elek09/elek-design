export interface Category {
  // Backend now returns both id and _id; keep both for convenience
  id?: number;
  _id?: number | string;
  name: string;
  // 'eletter', 'uzletter', or a new custom type (unique identifier/slug)
  type: 'eletter' | 'uzletter' | string;
  subcategories: { id?: string; name: string }[] | string[];
  // Controls header navigation order; lower comes first
  nav_order?: number;
}
