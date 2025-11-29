import { Product } from '../models/product.model';

/**
 * Termék opciókból összeállít egy kulcs-érték páros objektumot a megrendeléshez
 */
export function composeProductOptions(selection: {
  hardware_type?: string | null;
  color_scheme?: string | null;
  extra?: Record<string, string | null>;
}): Record<string, string> {
  const options: Record<string, string> = {};

  if (selection.hardware_type) {
    options['hardware_type'] = selection.hardware_type;
  }
  if (selection.color_scheme) {
    options['color_scheme'] = selection.color_scheme;
  }

  const extra = selection.extra || {};
  for (const [key, value] of Object.entries(extra)) {
    if (value) {
      options[key] = value;
    }
  }

  return options;
}

/**
 * Termék extra opció csoportjait kinyeri (hardware_types és color_schemes nélkül)
 */
export function extractExtraOptionGroups(
  product: Product,
): { key: string; label: string; values: string[] }[] {
  const groups: { key: string; label: string; values: string[] }[] = [];
  const opts = product.options || ({} as any);

  for (const [key, value] of Object.entries(opts)) {
    if (key === 'hardware_types' || key === 'color_schemes') continue;

    if (Array.isArray(value) && value.length > 0) {
      groups.push({
        key,
        label: formatOptionLabel(key),
        values: value,
      });
    }
  }

  return groups;
}

/**
 * Opció kulcsból olvasható címke generálása (snake_case → Title Case)
 */
export function formatOptionLabel(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
