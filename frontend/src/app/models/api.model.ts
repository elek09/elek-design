// Shared API response & pagination models
export interface AdminApiResponse<T> {
  success: boolean;
  status: number;
  data: T | null;
  errors: Record<string, string[]> | string[] | [];
}

export interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
}

export interface ApiListResponse<T> {
  data: T[];
}

export interface ApiItemResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
}

// Extended pagination shape used by admin gallery endpoints
export interface PaginatedMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next?: string | null;
  prev?: string | null;
}

export interface PaginatedApiResponse<T> {
  success?: boolean;
  data?: T[]; // items
  meta?: PaginatedMeta; // Laravel style 'meta'
  links?: any; // keep flexible for now
  pagination?: PaginatedMeta; // some endpoints duplicate under 'pagination'
}
