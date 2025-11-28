import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormArray,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AdminOrdersService } from '../../../../services/admin-orders.service';
import { AdminHeaderComponent } from '../../admin-header/admin-header.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Order, OrderItem, OrderStatus } from '../../../../models/order.model';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    AdminHeaderComponent,
    MatSnackBarModule,
  ],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.scss',
})
export class OrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(AdminOrdersService);
  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);

  protected order = signal<Order | null>(null);
  protected saving = signal(false);
  form = this.fb.group({
    status: ['new' as OrderStatus, Validators.required],
    admin_note: [''],
    items: this.fb.array([]),
  });

  get itemsFA() {
    return this.form.get('items') as FormArray;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getOrder(id).subscribe({
      next: (o) => {
        this.order.set(o);
        if (o) this.patchForm(o);
      },
      error: () =>
        this.snack.open('Rendelés betöltése sikertelen', 'Bezár', {
          duration: 3000,
        }),
    });
  }

  private patchForm(o: Order) {
    this.form.patchValue({ status: o.status, admin_note: o.note || '' });
    this.itemsFA.clear();
    for (const it of o.items) {
      this.itemsFA.push(
        this.fb.group({
          id: [it.id, Validators.required],
          product_name: [
            {
              value: it.product?.name || it.product_name || '',
              disabled: true,
            },
          ],
          quantity: [it.quantity, [Validators.required, Validators.min(1)]],
          unit_price: [it.unit_price ?? null],
          options: [{ value: this.renderOptions(it), disabled: true }],
        }),
      );
    }
  }

  private renderOptions(it: OrderItem): string {
    const hw = it.options?.hardware_type
      ? `Vasalat: ${it.options.hardware_type}`
      : '';
    const cs = it.options?.color_scheme
      ? `Szín: ${it.options.color_scheme}`
      : '';
    return [hw, cs].filter(Boolean).join(' | ');
  }

  save(): void {
    const o = this.order();
    if (!o || this.form.invalid) return;
    this.saving.set(true);
    const value = this.form.getRawValue();
    this.api
      .updateOrder(o.id, {
        status: (value.status as OrderStatus) || undefined,
        admin_note: value.admin_note || undefined,
        items: (value.items || []).map((raw) => {
          const i = raw as {
            id: unknown;
            quantity?: unknown;
            unit_price?: unknown;
          };
          return {
            id: Number(i.id),
            quantity:
              i.quantity != null && i.quantity !== ''
                ? Number(i.quantity)
                : undefined,
            unit_price:
              i.unit_price != null && i.unit_price !== ''
                ? Number(i.unit_price)
                : undefined,
          };
        }),
      })
      .subscribe({
        next: (resp) => {
          const updated: Order =
            (resp as { data?: Order }).data ?? (resp as unknown as Order);
          this.order.set(updated);
          this.patchForm(updated);
          this.saving.set(false);
          this.snack.open('Mentve', 'OK', { duration: 2000 });
        },
        error: () => {
          this.saving.set(false);
          this.snack.open('Hiba a mentés közben', 'Bezár', { duration: 3000 });
        },
      });
  }

  setStatus(status: OrderStatus): void {
    const o = this.order();
    if (!o) return;
    this.api.updateStatus(o.id, status).subscribe({
      next: (resp) => {
        const updated: Order =
          (resp as { data?: Order }).data ?? (resp as unknown as Order);
        this.order.set(updated);
        this.form.patchValue({ status: updated.status });
        this.snack.open('Státusz frissítve', 'OK', { duration: 2000 });
      },
      error: () =>
        this.snack.open('Hiba: státusz frissítése sikertelen', 'Bezár', {
          duration: 3000,
        }),
    });
  }

  sendConfirmation(): void {
    const o = this.order();
    if (!o) return;
    const currentNote = this.form.get('admin_note')?.value || '';
    const originalNote = o.admin_note ?? o.note ?? '';

    // If note changed, persist it first (without touching items/prices), then send email
    const saveNote$ =
      currentNote !== originalNote
        ? this.api.updateOrder(o.id, { admin_note: currentNote })
        : null;

    if (saveNote$) {
      this.saving.set(true);
      saveNote$.subscribe({
        next: (resp) => {
          const updated: Order =
            (resp as { data?: Order }).data ?? (resp as unknown as Order);
          this.order.set(updated);
          this.form.patchValue({
            admin_note: updated.admin_note || updated.note || '',
          });
          this.api.sendConfirmation(updated.id).subscribe({
            next: () => {
              this.saving.set(false);
              this.snack.open('Megerősítő email elküldve', 'OK', {
                duration: 2500,
              });
            },
            error: () => {
              this.saving.set(false);
              this.snack.open('Hiba: email küldése sikertelen', 'Bezár', {
                duration: 3000,
              });
            },
          });
        },
        error: () => {
          this.saving.set(false);
          this.snack.open('Hiba: megjegyzés mentése sikertelen', 'Bezár', {
            duration: 3000,
          });
        },
      });
    } else {
      this.api.sendConfirmation(o.id).subscribe({
        next: () =>
          this.snack.open('Megerősítő email elküldve', 'OK', {
            duration: 2500,
          }),
        error: () =>
          this.snack.open('Hiba: email küldése sikertelen', 'Bezár', {
            duration: 3000,
          }),
      });
    }
  }

  back(): void {
    this.router.navigate(['/admin/orders']);
  }
}
