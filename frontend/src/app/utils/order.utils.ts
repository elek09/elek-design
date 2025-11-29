import { OrderItem } from '../models/order.model';

/**
 * Rendereli az OrderItem opcióit olvasható szöveggé
 */
export function renderOrderItemOptions(item: OrderItem): string {
  const hardware = item.options?.hardware_type
    ? `Vasalat: ${item.options.hardware_type}`
    : '';
  const colorScheme = item.options?.color_scheme
    ? `Szín: ${item.options.color_scheme}`
    : '';
  return [hardware, colorScheme].filter(Boolean).join(' | ');
}

/**
 * Konvertál egy értéket számmá, ha érvényes
 */
export function toNumberOrUndefined(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}
