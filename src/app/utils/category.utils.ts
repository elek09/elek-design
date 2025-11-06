import { Category } from '../models/category.model';

export function normalizeSubcategories(
  subs: Category['subcategories']
): Array<{ id: string; name: string }> {
  if (!Array.isArray(subs)) return [];
  const arr = (subs as any[])
    .map((s: any) => {
      if (typeof s === 'string') return { id: s, name: s, nav_order: 0 } as any;
      const name = s?.name ?? String(s?.id ?? '');
      const id = String(s?.id ?? '').trim();
      const nav_order = typeof s?.nav_order === 'number' ? s.nav_order : 0;
      return { id, name, nav_order } as any;
    })
    .sort(
      (a: any, b: any) =>
        (a.nav_order ?? Number.MAX_SAFE_INTEGER) -
        (b.nav_order ?? Number.MAX_SAFE_INTEGER)
    );
  return arr.map(({ id, name }: any) => ({ id, name }));
}
