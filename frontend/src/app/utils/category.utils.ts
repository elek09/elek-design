import { Category } from '../models/category.model';
import { GalleryConfig } from '../models/gallery.model';

export interface NormalizedSubcategory {
  id: string;
  name: string;
  slug: string;
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
        const slug = slugify(id);
        return { id, name: s, slug };
      }
      const name = s?.name ?? String(s?.id ?? '').trim();
      const id = String(s?.id ?? '').trim();
      const rawSlug: string | undefined = (s as any)?.slug;
      const slug = slugify(rawSlug || name);
      const nav_order =
        typeof s?.nav_order === 'number' ? s.nav_order : undefined;
      return { id, name, slug, nav_order };
    })
    .sort(
      (a, b) =>
        (a.nav_order ?? Number.MAX_SAFE_INTEGER) -
        (b.nav_order ?? Number.MAX_SAFE_INTEGER),
    );
  return mapped.map(({ id, name, slug, nav_order }) => ({
    id,
    name,
    slug,
    nav_order,
  }));
}

// Slug / type normalization: lowercase, trim, internal whitespace -> single hyphen, remove non-url-safe chars except hyphen
export function slugify(value: string): string {
  if (!value) return '';
  return value
    .normalize('NFKD')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function buildGalleryConfig(categories: Category[]): GalleryConfig {
  const mapped = (categories || []).map((c) => ({
    label: c.name,
    value: String(c.id ?? c.type),
    subcategories: normalizeSubcategories(c.subcategories).map((s) => ({
      label: s.name,
      value: s.id != null ? String(s.id) : String(s.slug),
      slug: s.slug,
    })),
  }));
  return { categories: mapped };
}

// Kategória érték alapján címkét keres (fő- és alkategoriákban is)
export function getCategoryLabel(
  config: GalleryConfig | null,
  categoryValue: string,
): string {
  if (!config) return categoryValue;
  for (const category of config.categories) {
    if (category.value === categoryValue) return category.label;
    if (category.subcategories) {
      for (const sub of category.subcategories) {
        if (sub.value === categoryValue) return sub.label;
      }
    }
  }
  return categoryValue;
}
