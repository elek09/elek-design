export interface HeaderNavItem {
  id?: string; // stable key like 'eletter', 'kapcsolat'
  label: string;
  routerLink: string; // Angular route for [routerLink]
  fragment?: string; // optional anchor (e.g., 'Élettér')
  section?: string; // logical section id
  order?: number; // display order (if needed)
  class?: string; // optional CSS class to apply in templates
}

export interface HeaderConfig {
  logoUrl: string;
  items: HeaderNavItem[];
}
