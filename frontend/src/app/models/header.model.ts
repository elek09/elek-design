export interface HeaderNavItem {
  id?: string;
  label: string;
  routerLink: string;
  fragment?: string;
  section?: string;
  order?: number;
  class?: string;
}

export interface HeaderConfig {
  logoUrl: string;
  items: HeaderNavItem[];
}
