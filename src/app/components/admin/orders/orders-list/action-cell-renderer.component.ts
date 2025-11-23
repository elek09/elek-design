import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { OrderStatus } from '../../../../models/order.model';
import { AdminOrdersService } from '../../../../services/admin-orders.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-action-cell-renderer',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="row-actions">
      <button
        mat-icon-button
        color="primary"
        aria-label="Szerkesztés"
        (click)="onEdit()"
      >
        <mat-icon>edit</mat-icon>
      </button>
      <button
        mat-icon-button
        aria-label="Elfogadás"
        [disabled]="saving || status === 'accepted'"
        (click)="onAccept()"
      >
        <mat-icon>done</mat-icon>
      </button>
      <button
        mat-icon-button
        aria-label="Elutasítás"
        [disabled]="saving || status === 'rejected'"
        (click)="onReject()"
      >
        <mat-icon>close</mat-icon>
      </button>
      <button
        mat-icon-button
        aria-label="Megerősítő email"
        [disabled]="saving"
        (click)="onMail()"
      >
        <mat-icon>mail</mat-icon>
      </button>
    </div>
  `,
})
export class ActionCellRendererComponent implements ICellRendererAngularComp {
  private readonly apiSvc = inject(AdminOrdersService);
  private readonly snack = inject(MatSnackBar);

  private params!: ICellRendererParams & {
    data: { id: number; status: OrderStatus };
  };
  orderId = 0;
  status: OrderStatus = 'new';
  saving = false;

  agInit(params: ICellRendererParams): void {
    this.assignParams(params);
  }

  refresh(params: ICellRendererParams): boolean {
    this.assignParams(params);
    return true;
  }

  private assignParams(params: ICellRendererParams): void {
    this.params = params as ICellRendererParams & {
      data: { id: number; status: OrderStatus };
    };
    this.orderId = Number(this.params.data?.id) || 0;
    this.status = (this.params.data?.status as OrderStatus) || 'new';
  }

  private reloadGrid(): void {
    const ctx = this.params.context as { reload?: () => void } | undefined;
    if (ctx?.reload) ctx.reload();
    else this.params.api?.refreshCells({ force: true });
  }

  onEdit(): void {
    const ctx = this.params.context as
      | { onEdit?: (id: number) => void }
      | undefined;
    if (ctx?.onEdit) ctx.onEdit(this.orderId);
    else window.location.hash = `#/admin/orders/${this.orderId}`;
  }

  onAccept() {
    if (!this.orderId) return;
    this.saving = true;
    this.apiSvc.updateStatus(this.orderId, 'accepted').subscribe({
      next: () => {
        this.saving = false;
        this.snack.open('Elfogadva', 'OK', { duration: 1500 });
        this.reloadGrid();
      },
      error: () => {
        this.saving = false;
        this.snack.open('Hiba: nem sikerült elfogadni', 'Bezár', {
          duration: 2000,
        });
      },
    });
  }

  onReject() {
    if (!this.orderId) return;
    this.saving = true;
    this.apiSvc.updateStatus(this.orderId, 'rejected').subscribe({
      next: () => {
        this.saving = false;
        this.snack.open('Elutasítva', 'OK', { duration: 1500 });
        this.reloadGrid();
      },
      error: () => {
        this.saving = false;
        this.snack.open('Hiba: nem sikerült elutasítani', 'Bezár', {
          duration: 2000,
        });
      },
    });
  }

  onMail() {
    if (!this.orderId) return;
    this.saving = true;
    this.apiSvc.sendConfirmation(this.orderId).subscribe({
      next: () => {
        this.saving = false;
        this.snack.open('Email elküldve', 'OK', { duration: 1500 });
      },
      error: () => {
        this.saving = false;
        this.snack.open('Hiba: email küldése sikertelen', 'Bezár', {
          duration: 2000,
        });
      },
    });
  }
}
