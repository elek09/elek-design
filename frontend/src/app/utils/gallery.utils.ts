import { Slide } from '../models/slide.model';
import {
  GalleryItemResource,
  ApiImageItem,
  GalleryConfig,
  GallerySubCategory,
} from '../models/gallery.model';
import { resolveToAbsolute } from './url.utils';

/**
 * Galéria feltöltő form inicializálása query paraméterek alapján
 */
export function initializeGalleryFormFromParams(
  params: { mainCategory?: string; subCategory?: string },
  galleryConfig: GalleryConfig,
  defaultMainCategory?: string,
): { mainCategoryId: string; subCategoryId: string; shouldShowForm: boolean } {
  const { mainCategory, subCategory } = params;

  if (!galleryConfig?.categories?.length) {
    return {
      mainCategoryId: defaultMainCategory || '',
      subCategoryId: '',
      shouldShowForm: false,
    };
  }

  // Főkategória beállítása
  let mainCategoryId: string;
  let shouldShowForm = false;

  if (mainCategory) {
    const matchingCategory = galleryConfig.categories.find(
      (c) => String(c.value) === String(mainCategory),
    );
    mainCategoryId =
      matchingCategory?.value || galleryConfig.categories[0].value;
    shouldShowForm = true;
  } else {
    mainCategoryId = defaultMainCategory || galleryConfig.categories[0].value;
  }

  // Alkategória beállítása
  const selectedMain = galleryConfig.categories.find(
    (c) => c.value === mainCategoryId,
  );
  const availableSubcategories = selectedMain?.subcategories || [];

  let subCategoryId = '';
  if (availableSubcategories.length > 0) {
    if (subCategory) {
      const matchingSubCategory = availableSubcategories.find(
        (s) => String(s.value) === String(subCategory),
      );
      subCategoryId =
        matchingSubCategory?.value || availableSubcategories[0].value;
    } else {
      subCategoryId = availableSubcategories[0].value;
    }
  }

  return { mainCategoryId, subCategoryId, shouldShowForm };
}

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
