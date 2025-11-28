// Gallery & media related domain models
export interface GallerySubCategory {
  label: string;
  value: string; // id as string
  slug?: string; // backend slug fallback for new subcategory navigation
}

export interface GalleryCategory {
  label: string;
  value: string;
  subcategories?: GallerySubCategory[];
}

export interface GalleryConfig {
  categories: GalleryCategory[];
}

export interface GalleryItemResource {
  id: string | number;
  title?: string;
  category?: { id?: number; type?: string; name?: string } | null;
  subcategory?: { id?: number; slug?: string; name?: string } | null;
  url?: string;
  thumb_url?: string | null;
  order?: number | null;
  is_featured?: boolean;
  is_active?: boolean;
}

export interface ApiImageItem {
  id?: string | number;
  title?: string;
  url?: string;
  image?: string;
  thumb_url?: string;
  category?: { id?: number; type?: string; name?: string };
  subcategory?: { id?: number; slug?: string; name?: string };
  order?: number;
  is_active?: boolean;
  is_featured?: boolean;
}
