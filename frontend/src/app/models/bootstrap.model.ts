import { Category } from './category.model';
import { GalleryItemResource } from './gallery.model';
import { HeaderNavItem } from './header.model';

export interface BootstrapPayload {
  header?: {
    items?: HeaderNavItem[];
  };
  categories?: Category[];
  featured_gallery?: GalleryItemResource[];
}
