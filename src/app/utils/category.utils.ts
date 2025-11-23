import { Category } from '../models/category.model';

export interface NormalizedSubcategory {
  id: string;
  name: string;
  nav_order?: number;
}

export function normalizeSubcategories(
  subs: Category['subcategories'],
): NormalizedSubcategory[] {
  if (!Array.isArray(subs)) return [];
  const mapped: NormalizedSubcategory[] = subs
    .map((s) => {
      if (typeof s === 'string') {
        const id = String(s).trim();
        return { id, name: s };
      }
      const name = s?.name ?? String(s?.id ?? '').trim();
      const id = String(s?.id ?? '').trim();
      const nav_order =
        typeof s?.nav_order === 'number' ? s.nav_order : undefined;
      return { id, name, nav_order };
    })
    .sort(
      (a, b) =>
        (a.nav_order ?? Number.MAX_SAFE_INTEGER) -
        (b.nav_order ?? Number.MAX_SAFE_INTEGER),
    );
  return mapped.map(({ id, name, nav_order }) => ({ id, name, nav_order }));
}
