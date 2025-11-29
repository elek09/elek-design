import { PaginatedResponse } from '../models/api.model';

/**
 * API response normalizálás: paginated vagy array választ egységesít array-re
 * @param response - API válasz (lehet array vagy PaginatedResponse)
 * @returns Normalizált array
 */
export function unwrapResponse<T>(response: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return response.data ?? [];
}
