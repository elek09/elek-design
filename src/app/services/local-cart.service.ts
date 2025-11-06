import { Injectable } from '@angular/core';
import { Product } from '../models/product.model';

export type LocalCartExtra = Record<string, string | null>;

export interface LocalCartItem {
  product: Product;
  quantity: number;
  hardware_type?: string | null;
  color_scheme?: string | null;
  extra?: LocalCartExtra;
  expiresAt: number;
}

@Injectable({ providedIn: 'root' })
export class LocalCartService {
  private readonly KEY = 'webshop_cart_v1';
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

  getItems(): LocalCartItem[] {
    try {
      const raw = localStorage.getItem(this.KEY);
      const arr: LocalCartItem[] = raw ? JSON.parse(raw) : [];
      const now = Date.now();
      const filtered = arr.filter((i) => i && i.expiresAt > now);
      if (filtered.length !== arr.length) {
        this.save(filtered);
      }
      return filtered;
    } catch {
      return [];
    }
  }

  add(item: Omit<LocalCartItem, 'expiresAt'>): void {
    const now = Date.now();
    const expiresAt = now + this.TTL_MS;
    const items = this.getItems();
    // merge same product with same options by increasing quantity
    const idx = items.findIndex(
      (i) =>
        i.product.id === item.product.id &&
        (i.hardware_type || null) === (item.hardware_type || null) &&
        (i.color_scheme || null) === (item.color_scheme || null) &&
        this.sameExtra(i.extra, item.extra)
    );
    if (idx >= 0) {
      items[idx].quantity += item.quantity;
      items[idx].expiresAt = expiresAt; // refresh TTL
    } else {
      items.push({ ...item, expiresAt });
    }
    this.save(items);
  }

  removeAt(index: number): void {
    const items = this.getItems();
    if (index >= 0 && index < items.length) {
      items.splice(index, 1);
      this.save(items);
    }
  }

  clear(): void {
    localStorage.removeItem(this.KEY);
  }

  private save(items: LocalCartItem[]): void {
    localStorage.setItem(this.KEY, JSON.stringify(items));
  }

  private sameExtra(a?: LocalCartExtra, b?: LocalCartExtra): boolean {
    const aKeys = Object.keys(a || {});
    const bKeys = Object.keys(b || {});
    if (aKeys.length !== bKeys.length) return false;
    for (const k of aKeys) if ((a || {})[k] !== (b || {})[k]) return false;
    return true;
  }
}
