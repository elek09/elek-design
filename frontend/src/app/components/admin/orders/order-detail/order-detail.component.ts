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
import { Order, OrderStatus } from '../../../../models/order.model';
import { extractData } from '../../../../utils/api.utils';
import {
  renderOrderItemOptions,
  toNumberOrUndefined,
} from '../../../../utils/order.utils';

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
      next: (order) => {
        this.order.set(order);
        if (order) this.patchForm(order);
      },
      error: () => this.showError('Rendelés betöltése sikertelen'),
    });
  }

  private showSuccess(message: string): void {
    this.snack.open(message, 'OK', { duration: 2000 });
  }

  private showError(message: string): void {
    this.snack.open(message, 'Bezár', { duration: 3000 });
  }

  private patchForm(order: Order): void {
    this.form.patchValue({
      status: order.status,
      admin_note: order.note || '',
    });
    this.itemsFA.clear();
    for (const item of order.items) {
      this.itemsFA.push(
        this.fb.group({
          id: [item.id, Validators.required],
          product_name: [
            {
              value: item.product?.name || item.product_name || '',
              disabled: true,
            },
          ],
          quantity: [item.quantity, [Validators.required, Validators.min(1)]],
          unit_price: [item.unit_price ?? null],
          options: [{ value: renderOrderItemOptions(item), disabled: true }],
        }),
      );
    }
  }

  save(): void {
    const currentOrder = this.order();
    if (!currentOrder || this.form.invalid) return;

    this.saving.set(true);
    const value = this.form.getRawValue();

    this.api
      .updateOrder(currentOrder.id, {
        status: (value.status as OrderStatus) || undefined,
        admin_note: value.admin_note || undefined,
        items: (value.items || []).map((raw) => {
          const rawItem = raw as {
            id: unknown;
            quantity?: unknown;
            unit_price?: unknown;
          };
          return {
            id: Number(rawItem.id),
            quantity: toNumberOrUndefined(rawItem.quantity),
            unit_price: toNumberOrUndefined(rawItem.unit_price),
          };
        }),
      })
      .subscribe({
        next: (resp) => {
          const updated = extractData<Order>(resp);
          this.order.set(updated);
          this.patchForm(updated);
          this.saving.set(false);
          this.showSuccess('Mentve');
        },
        error: () => {
          this.saving.set(false);
          this.showError('Hiba a mentés közben');
        },
      });
  }

  setStatus(status: OrderStatus): void {
    const currentOrder = this.order();
    if (!currentOrder) return;

    // Elfogadás/elutasítás emailt küld
    if (status === 'accepted') {
      this.sendConfirmation();
    } else if (status === 'rejected') {
      this.sendRejection();
    } else {
      this.api.updateStatus(currentOrder.id, status).subscribe({
        next: (resp) => {
          const updated = extractData<Order>(resp);
          this.order.set(updated);
          this.form.patchValue({ status: updated.status });
          this.showSuccess('Státusz frissítve');
        },
        error: () => this.showError('Hiba: státusz frissítése sikertelen'),
      });
    }
  }

  sendConfirmation(): void {
    const currentOrder = this.order();
    if (!currentOrder) return;

    this.api.sendConfirmation(currentOrder.id).subscribe({
      next: () => this.showSuccess('Megerősítő email elküldve'),
      error: () => this.showError('Hiba: email küldése sikertelen'),
    });
  }

  sendRejection(): void {
    const currentOrder = this.order();
    if (!currentOrder) return;

    this.api.rejectQuote(currentOrder.id).subscribe({
      next: (resp) => {
        const rejected = extractData<Order>(resp);
        this.order.set(rejected);
        this.form.patchValue({ status: rejected.status });
        this.showSuccess('Elutasító email elküldve');
      },
      error: () => this.showError('Hiba: email küldése sikertelen'),
    });
  }

  deleteOrder(): void {
    const currentOrder = this.order();
    if (!currentOrder) return;

    const itemType =
      currentOrder.kind === 'quote' ? 'árajánlatot' : 'rendelést';
    if (
      !confirm(`Biztosan törölni szeretnéd a ${itemType} #${currentOrder.id}?`)
    ) {
      return;
    }

    this.api.deleteOrder(currentOrder.id).subscribe({
      next: () => {
        this.showSuccess('Törölve');
        this.router.navigate(['/admin/orders']);
      },
      error: () => this.showError('Hiba: törlés sikertelen'),
    });
  }

  back(): void {
    this.router.navigate(['/admin/orders']);
  }
}
