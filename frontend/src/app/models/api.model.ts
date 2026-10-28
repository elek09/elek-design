export interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  status?: number;
  data?: T;
  errors?: Record<string, string[]> | string[] | [];
}

export interface ApiListResponse<T> {
  data: T[];
}

export interface PaginatedMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta?: PaginatedMeta;
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
  pagination?: PaginatedMeta;
}
