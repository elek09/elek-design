export interface Slide {
  id?: string;
  imageUrl: string;
  thumbUrl?: string;
  title?: string;
  category?: string; // subcategory slug
  section?: string; // main category type
  is_active?: boolean;
  is_featured?: boolean;
}
