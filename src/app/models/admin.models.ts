export interface User {
  id: number;
  name: string;
  email: string;
  admin: boolean;
}

export interface GalleryItem {
  id: number;
  title: string;
  description?: string;
  category: string;
  image_path: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface GalleryCreateRequest {
  title: string;
  description?: string;
  category: string;
  image: File;
  is_active: boolean;
  is_featured: boolean;
}

export interface GalleryUpdateRequest {
  title?: string;
  description?: string;
  category?: string;
  image?: File;
  is_active?: boolean;
  is_featured?: boolean;
}

export interface GallerySubCategory {
  label: string;
  value: string;
}

export interface GalleryCategory {
  label: string;
  value: string;
  subcategories?: GallerySubCategory[];
}

export interface GalleryConfig {
  categories: GalleryCategory[];
}
