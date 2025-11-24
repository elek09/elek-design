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
