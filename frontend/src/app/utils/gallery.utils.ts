import { Slide } from '../models/slide.model';
import { GalleryItemResource, ApiImageItem } from '../models/gallery.model';
import { resolveToAbsolute } from './url.utils';

/**
 * Galéria elem átalakítása Slide formátumra
 * @param item - API galéria elem (GalleryItemResource vagy ApiImageItem)
 * @param apiOrigin - API origin URL (pl. http://localhost:8000)
 * @param sectionKey - Opcionális szekció kulcs ha nincs category
 */
export function convertToSlide(
  item: GalleryItemResource | ApiImageItem,
  apiOrigin: string,
  sectionKey?: string,
): Slide | null {
  const imageUrl = resolveToAbsolute(
    apiOrigin,
    item.url || ('image' in item ? item.image : '') || '',
  );
  if (!imageUrl) return null;

  const id = item.id != null ? String(item.id) : undefined;
  const subcategorySlug = item.subcategory?.slug?.toString().trim();
  const section = item.category?.type?.toString().trim() || sectionKey;

  return {
    id,
    imageUrl,
    thumbUrl: resolveToAbsolute(apiOrigin, item.thumb_url || undefined),
    title: item.subcategory?.name || item.category?.name || item.title,
    category: subcategorySlug,
    section,
    is_active: item.is_active ?? true,
    is_featured: item.is_featured ?? false,
  };
}
