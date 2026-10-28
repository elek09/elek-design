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
  private readonly TTL_MS = 5 * 60 * 1000; // 5 perc

  // Reaktív kosár állapot
  private readonly _items = signal<LocalCartItem[]>(this.loadFromStorage());

  // Publikus readonly signal-ok
  readonly items = this._items.asReadonly();
  readonly itemCount = computed(() =>
    this._items().reduce((sum, item) => sum + item.quantity, 0),
  );
  readonly isEmpty = computed(() => this._items().length === 0);

  constructor() {
    // Automatikus mentés localStorage-ba minden változáskor
    effect(() => {
      const items = this._items();
      this.saveToStorage(items);
    });

    // Lejárt elemek automatikus törlése időszakosan
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanupExpired(), 60000); // percenként
    }
  }

  add(item: Omit<LocalCartItem, 'expiresAt'>): void {
    const expiresAt = Date.now() + this.TTL_MS;

    this._items.update((items) => {
      const index = items.findIndex((existingItem) =>
        this.matchesItem(existingItem, item),
      );

      if (index >= 0) {
        // Meglévő elem frissítése
        const updated = [...items];
        updated[index] = {
          ...updated[index],
          quantity: updated[index].quantity + item.quantity,
          expiresAt,
        };
        return updated;
      }
      // Új elem hozzáadása
      return [...items, { ...item, expiresAt }];
    });
  }

  private matchesItem(
    existingItem: LocalCartItem,
    newItem: Omit<LocalCartItem, 'expiresAt'>,
  ): boolean {
    return (
      existingItem.product.id === newItem.product.id &&
      (existingItem.hardware_type || null) ===
        (newItem.hardware_type || null) &&
      (existingItem.color_scheme || null) === (newItem.color_scheme || null) &&
      this.sameExtra(existingItem.extra, newItem.extra)
    );
  }

  removeAt(index: number): void {
    this._items.update((items) =>
      items.filter((_, itemIndex) => itemIndex !== index),
    );
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
    this._items.update((items) => items.filter((item) => item.expiresAt > now));
  }

  private loadFromStorage(): LocalCartItem[] {
    if (typeof window === 'undefined') return [];

    try {
      const raw = localStorage.getItem(this.KEY);
      const items: LocalCartItem[] = raw ? JSON.parse(raw) : [];
      const now = Date.now();
      return items.filter((item) => item && item.expiresAt > now);
    } catch {
      return [];
    }
  }

  private saveToStorage(items: LocalCartItem[]): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Kosár mentése sikertelen localStorage-ba:', error);
    }
  }

  private sameExtra(extraA?: LocalCartExtra, extraB?: LocalCartExtra): boolean {
    return JSON.stringify(extraA || {}) === JSON.stringify(extraB || {});
  }
}
