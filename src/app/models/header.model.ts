export interface HeaderNavItem {
  id?: string; // stable key like 'logo', 'eletter', 'kapcsolat'
  label: string;
  // Preferred internal navigation field from backend may be `route`.
  // We'll normalize to `routerLink` in the service.
  route?: string;
  routerLink?: string; // Angular route, e.g. '/'
  fragment?: string; // optional anchor within the page
  externalUrl?: string; // if present, renders as external link
  class?: string; // optional CSS class like 'options'
  section?: string; // optional logical section id from backend
  category_id?: number; // category-backed nav entries
  is_logo?: boolean; // marks the logo item
  is_static?: boolean; // marks static items like 'kapcsolat'
  order?: number; // server-computed order
  image_url?: string; // optional image path (logo item)
}

export interface HeaderConfig {
  logoUrl: string; // absolute or relative URL to logo image
  logoRouterLink?: string; // default '/'
  items: HeaderNavItem[];
}
// No local fallback; the header is driven entirely by backend response.
