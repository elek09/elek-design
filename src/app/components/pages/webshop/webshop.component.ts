import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Product } from '../../../models/product.model';
import { ProductService } from '../../../services/product.service';
import { OrdersService } from '../../../services/orders.service';
import { AuthService } from '../../../services/auth.service';
import { BootstrapService } from '../../../services/bootstrap.service';
import { GalleryDataService } from '../../../services/gallery-data.service';
import { Slide } from '../../../models/slide.model';
import { LocalCartService } from '../../../services/local-cart.service';
import { SubmitOrderRequest } from '../../../models/shop.model';
import { LoadingOverlayComponent } from '../../../components/shared/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-webshop',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    LoadingOverlayComponent,
  ],
  templateUrl: './webshop.component.html',
  styleUrl: './webshop.component.scss',
})
export class WebshopComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productsApi = inject(ProductService);
  private readonly ordersApi = inject(OrdersService);
  protected readonly auth = inject(AuthService);
  private readonly bootstrap = inject(BootstrapService);
  private readonly gallery = inject(GalleryDataService);
  private readonly localCart = inject(LocalCartService);
  private readonly toastr = inject(ToastrService);

  protected products = signal<Product[]>([]);
  protected message = signal<string | null>(null);
  protected error = signal<string | null>(null);

  checkoutForm = this.fb.group({
    customer_name: ['', Validators.required],
    customer_email: ['', [Validators.required, Validators.email]],
    customer_phone: [''],
  });

  protected selections = signal<
    Record<
      number,
      {
        quantity: number;
        hardware_type?: string | null;
        color_scheme?: string | null;
        extra?: Record<string, string | null>;
      }
    >
  >({});

  protected productImages = signal<Record<number, string[]>>({});

  protected cartItems = signal<
    {
      product: Product;
      quantity: number;
      hardware_type?: string | null;
      color_scheme?: string | null;
      extra?: Record<string, string | null>;
    }[]
  >([]);

  private slidesCache: Slide[] | null = null;
  protected imagesLoading = signal(true);

  ngOnInit(): void {
    const stored = this.localCart.getItems();
    if (stored.length) {
      this.cartItems.set(
        stored.map((i) => ({
          product: i.product,
          quantity: i.quantity,
          hardware_type: i.hardware_type || undefined,
          color_scheme: i.color_scheme || undefined,
          extra: i.extra || {},
        }))
      );
    }
    this.productsApi.getProducts$().subscribe({
      next: (list) => {
        const active = list.filter((p) => p.is_active !== false);
        this.products.set(active);
        const defaults: Record<
          number,
          {
            quantity: number;
            hardware_type?: string | null;
            color_scheme?: string | null;
            extra?: Record<string, string | null>;
          }
        > = {};
        for (const p of active) {
          defaults[p.id] = {
            quantity: 1,
            hardware_type: null,
            color_scheme: null,
            extra: {},
          };
        }
        this.selections.set(defaults);

        this.computeProductImages();
      },
      error: () => {
        this.error.set('Nem sikerült betölteni a termékeket.');
        this.imagesLoading.set(false);
      },
    });

    this.gallery.getSlidesByCategory$('eletter').subscribe({
      next: (slides: Slide[]) => {
        this.slidesCache = slides || [];
        this.computeProductImages();
      },
      error: () => {
        this.slidesCache = [];
        this.imagesLoading.set(false);
      },
    });
  }

  private computeProductImages(): void {
    const slides = this.slidesCache;
    const prods = this.products();
    if (slides === null || !prods?.length) return;

    const imgs: Record<number, string[]> = {};
    if (slides.length) {
      for (const p of prods) {
        const subcats = this.inferSubcategoriesForProduct(p);
        const urls = subcats
          .map((sc) => slides.find((s) => String(s.category) === sc))
          .filter((s): s is Slide => !!s)
          .map((s) => s.imageUrl);
        if (urls.length) imgs[p.id] = urls;
      }
    }
    this.productImages.set(imgs);
    this.imagesLoading.set(false);
  }

  private inferSubcategoriesForProduct(product: Product): string[] {
    const name = (product.name || '').toLowerCase();
    const slug = (product.slug || '').toLowerCase();
    const hay = `${name} ${slug}`;
    const hits: string[] = [];
    if (/(konyha|konyhab|konyha-b|konyhabútor|konyhabutor)/.test(hay))
      hits.push('konyha');
    if (/(hálószoba|haloszoba)/.test(hay)) hits.push('haloszoba');
    if (/(gardrób|gardrob)/.test(hay)) hits.push('gardrob');
    if (/(nappali)/.test(hay)) hits.push('nappali');
    return Array.from(new Set(hits));
  }

  updateSelection(
    id: number,
    patch: Partial<{
      quantity: number;
      hardware_type?: string | null;
      color_scheme?: string | null;
    }>
  ) {
    this.selections.update((curr) => ({
      ...curr,
      [id]: { ...curr[id], ...patch },
    }));
  }

  updateExtraOption(id: number, key: string, value: string | null) {
    this.selections.update((curr) => {
      const prev = curr[id] || {
        quantity: 1,
        extra: {} as Record<string, string | null>,
      };
      const extra = { ...(prev.extra || {}), [key]: value } as Record<
        string,
        string | null
      >;
      return { ...curr, [id]: { ...prev, extra } };
    });
  }

  addToCart(product: Product): void {
    this.message.set(null);
    this.error.set(null);
    const sel = this.selections()[product.id] ?? { quantity: 1 };

    this.cartItems.update((items) => [
      ...items,
      {
        product,
        quantity: sel.quantity || 1,
        hardware_type: sel.hardware_type || undefined,
        color_scheme: sel.color_scheme || undefined,
        extra: sel.extra || {},
      },
    ]);

    this.localCart.add({
      product,
      quantity: sel.quantity || 1,
      hardware_type: sel.hardware_type || null,
      color_scheme: sel.color_scheme || null,
      extra: sel.extra || {},
    });

    this.message.set('A termék hozzáadva a kosárhoz.');
  }

  removeItem(index: number): void {
    this.cartItems.update((items) => items.filter((_, i) => i !== index));
    this.localCart.removeAt(index);
  }

  requestQuote(): void {
    this.message.set(null);
    this.error.set(null);
    if (this.checkoutForm.invalid || this.cartItems().length === 0) {
      this.checkoutForm.markAllAsTouched();
      return;
    }
    const v = this.checkoutForm.value;
    const payload: SubmitOrderRequest = {
      customer_name: v.customer_name!,
      customer_email: v.customer_email!,
      customer_phone: v.customer_phone || undefined,
      is_quote: true,
      items: this.cartItems().map((ci) => ({
        product_id: ci.product.id,
        quantity: ci.quantity,
        options: this.composeOptions({
          hardware_type: ci.hardware_type ?? null,
          color_scheme: ci.color_scheme ?? null,
          extra: ci.extra || {},
        }),
      })),
    };
    this.ordersApi.submitPublicOrder(payload).subscribe({
      next: () => {
        this.message.set(
          'Árajánlat kérés elküldve. Visszaigazoló email elküldve.'
        );
        this.cartItems.set([]);
        this.localCart.clear();
        this.checkoutForm.reset();
      },
      error: () =>
        this.error.set('Nem sikerült elküldeni az árajánlat kérést.'),
    });
  }

  protected onCheckoutBlur(field: string): void {
    const c = this.checkoutForm.get(field);
    if (!c) return;
    c.markAsTouched();
    if (c.invalid) {
      const msg = this.composeCheckoutError(field, c.errors || {});
      this.toastr.warning(msg, 'Hibás mező');
    }
  }

  private composeCheckoutError(
    field: string,
    errors: Record<string, any>
  ): string {
    if (errors['required']) {
      switch (field) {
        case 'customer_name':
          return 'A név mező kötelező.';
        case 'customer_email':
          return 'Az email mező kötelező.';
      }
    }
    if (errors['email']) return 'Érvényes email címet adjon meg.';
    return 'Érvénytelen mező.';
  }

  private composeOptions(sel: {
    hardware_type?: string | null;
    color_scheme?: string | null;
    extra?: Record<string, string | null>;
  }): Record<string, string> {
    const out: Record<string, string> = {};
    if (sel.hardware_type) out['hardware_type'] = sel.hardware_type;
    if (sel.color_scheme) out['color_scheme'] = sel.color_scheme;
    const extra = sel.extra || {};
    for (const [k, v] of Object.entries(extra)) {
      if (v) out[k] = v;
    }
    return out;
  }

  protected extraOptionGroups(
    p: Product
  ): { key: string; label: string; values: string[] }[] {
    const groups: { key: string; label: string; values: string[] }[] = [];
    const opts = p.options || ({} as any);
    for (const [key, value] of Object.entries(opts)) {
      if (key === 'hardware_types' || key === 'color_schemes') continue;
      if (Array.isArray(value) && value.length) {
        groups.push({ key, label: this.toLabel(key), values: value });
      }
    }
    return groups;
  }

  private toLabel(key: string): string {
    return key
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }
}
