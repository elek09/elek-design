import { Injectable, signal, computed, effect } from '@angular/core';
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

  // Reactive cart state
  private readonly _items = signal<LocalCartItem[]>(this.loadFromStorage());

  // Public readonly signals
  readonly items = this._items.asReadonly();
  readonly itemCount = computed(() =>
    this._items().reduce((sum, item) => sum + item.quantity, 0),
  );
  readonly isEmpty = computed(() => this._items().length === 0);

  constructor() {
    // Auto-save to localStorage on any change
    effect(() => {
      const items = this._items();
      this.saveToStorage(items);
    });

    // Auto-cleanup expired items periodically
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanupExpired(), 60000); // every minute
    }
  }

  add(item: Omit<LocalCartItem, 'expiresAt'>): void {
    const expiresAt = Date.now() + this.TTL_MS;

    this._items.update((items) => {
      const idx = items.findIndex((i) => this.matchesItem(i, item));

      if (idx >= 0) {
        // Update existing item
        const updated = [...items];
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + item.quantity,
          expiresAt,
        };
        return updated;
      }
      // Add new item
      return [...items, { ...item, expiresAt }];
    });
  }

  private matchesItem(
    a: LocalCartItem,
    b: Omit<LocalCartItem, 'expiresAt'>,
  ): boolean {
    return (
      a.product.id === b.product.id &&
      (a.hardware_type || null) === (b.hardware_type || null) &&
      (a.color_scheme || null) === (b.color_scheme || null) &&
      this.sameExtra(a.extra, b.extra)
    );
  }

  removeAt(index: number): void {
    this._items.update((items) => items.filter((_, i) => i !== index));
  }

  updateQuantity(index: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeAt(index);
      return;
    }

    this._items.update((items) => {
      const updated = [...items];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          quantity,
          expiresAt: Date.now() + this.TTL_MS,
        };
      }
      return updated;
    });
  }

  clear(): void {
    this._items.set([]);
  }

  private cleanupExpired(): void {
    const now = Date.now();
    this._items.update((items) => items.filter((i) => i.expiresAt > now));
  }

  private loadFromStorage(): LocalCartItem[] {
    if (typeof window === 'undefined') return [];

    try {
      const raw = localStorage.getItem(this.KEY);
      const arr: LocalCartItem[] = raw ? JSON.parse(raw) : [];
      const now = Date.now();
      return arr.filter((i) => i && i.expiresAt > now);
    } catch {
      return [];
    }
  }

  private saveToStorage(items: LocalCartItem[]): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Failed to save cart to localStorage:', err);
    }
  }

  private sameExtra(a?: LocalCartExtra, b?: LocalCartExtra): boolean {
    return JSON.stringify(a || {}) === JSON.stringify(b || {});
  }
}
