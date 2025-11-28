export interface GalleryItem {
  id: number;
  title: string;
  description?: string;
  category: string | { id: number; type: string; name: string } | null;
  subcategory?: { id: number; slug: string; name: string } | null;
  image_path?: string; // legacy
  url?: string;
  thumb_url?: string;
  order?: number;
  is_active: boolean;
  is_featured: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GalleryCreateRequest {
  title: string;
  description?: string;
  category_id: number;
  subcategory_id?: number;
  image: File;
  is_active: boolean;
  is_featured: boolean;
}

export interface GalleryUpdateRequest {
  title?: string;
  description?: string;
  category_id?: number;
  subcategory_id?: number;
  image?: File;
  is_active?: boolean;
  is_featured?: boolean;
}

export interface DashboardStats {
  gallery: {
    total: number;
    active: number;
    inactive: number;
    featured: number;
    byCategory: Record<string, number>;
    recent: GalleryItem[];
  };
  orders: {
    total: number;
    byStatus: Record<string, number>;
    recent: any[];
  };
}

export interface GalleryFilterParams {
  status?: 'active' | 'inactive' | 'all';
  category_id?: number | string;
  subcategory_id?: number | string;
  search?: string;
  page?: number;
}
