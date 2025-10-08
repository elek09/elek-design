export interface User {
  id: number;
  name: string;
  email: string;
  admin: boolean;
}

export interface GalleryItem {
  id: number;
  title: string;
  category: 'featured' | 'work' | 'ui' | 'misc';
  description: string | null;
  image_path: string;
  active: boolean;
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
  category: string;
  description?: string;
  image: File;
  active: boolean;
}

export interface GalleryUpdateRequest {
  title?: string;
  category?: string;
  description?: string;
  image?: File;
  active?: boolean;
}

export type GalleryCategory = 'featured' | 'work' | 'ui' | 'misc';
