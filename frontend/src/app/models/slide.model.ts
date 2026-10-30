export interface Slide {
  id?: string;
  imageUrl: string;
  thumbUrl?: string;
  title?: string;
  description?: string;
  category?: string;
  section?: string;
  is_active?: boolean;
  is_featured?: boolean;
}
