import { PaginatedResponse } from '../models/api.model';

/**
 * API response normalizálás: paginated vagy array választ egységesít array-re
 */
export function unwrapResponse<T>(response: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return response.data ?? [];
}

/**
 * API response-ból kinyeri az adatot (data property vagy maga a response)
 */
export function extractData<T>(response: unknown): T {
  return (response as { data?: T }).data ?? (response as T);
}

/**
 * Backend hibaüzeneteket olvasható szöveggé alakítja
 */
export function parseBackendErrors(error: any): string {
  const backendErrors = error?.error?.errors;
  if (backendErrors && typeof backendErrors === 'object') {
    const messages = Object.entries(backendErrors)
      .flatMap(([field, errs]) =>
        Array.isArray(errs)
          ? errs.map((e) => `${field}: ${e}`)
          : [`${field}: ${String(errs)}`],
      )
      .join('\n');
    return messages || error.error?.message || 'Művelet sikertelen';
  }
  return error.error?.message || 'Művelet sikertelen';
}
