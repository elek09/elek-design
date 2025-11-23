import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminHeaderComponent } from '../../admin-header/admin-header.component';
import { AdminOrdersService } from '../../../../services/admin-orders.service';
import { Order, OrderStatus } from '../../../../models/order.model';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  ValueFormatterParams,
  ICellRendererParams,
  Theme,
  themeQuartz,
  GridReadyEvent,
} from 'ag-grid-community';
import { ActionCellRendererComponent } from './action-cell-renderer.component';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    AdminHeaderComponent,
    AgGridAngular,
    MatSnackBarModule,
  ],
  templateUrl: './orders-list.component.html',
  styleUrl: './orders-list.component.scss',
})
export class OrdersListComponent implements OnInit {
  private readonly api = inject(AdminOrdersService);
  private readonly router = inject(Router);
  protected orders = signal<Order[]>([]);
  protected filterStatus = signal<'all' | OrderStatus>('all');

  rowData: Order[] = [];
  theme: Theme = themeQuartz;
  gridContext = {
    reload: () => this.reload(),
    onEdit: (id: number) => this.router.navigate(['/admin/orders', id]),
  };
  defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    suppressHeaderMenuButton: true,
    flex: 1,
    minWidth: 120,
  };

  columnDefs: ColDef[] = [
    {
      field: 'created_at',
      headerName: 'Dátum',
      minWidth: 180,
      valueFormatter: (p: ValueFormatterParams) =>
        p.value ? new Date(p.value as string).toLocaleString('hu-HU') : '',
    },
    {
      headerName: 'Ügyfél',
      valueGetter: (p) => p.data?.customer?.name ?? '',
      minWidth: 160,
    },
    {
      field: 'status',
      headerName: 'Státusz',
      minWidth: 130,
      cellRenderer: (p: ICellRendererParams) => {
        const span = document.createElement('span');
        span.className = `status-badge ${p.value ?? ''}`;
        span.textContent = String(p.value ?? '');
        return span;
      },
    },
    {
      field: 'total',
      headerName: 'Összeg',
      minWidth: 140,
      valueFormatter: (p) =>
        p.value === null || p.value === undefined
          ? '—'
          : `${Number(p.value).toLocaleString('hu-HU')}Ft`,
      type: 'rightAligned',
    },
    {
      field: 'note',
      headerName: 'Megjegyzés',
      minWidth: 160,
      flex: 2,
      cellClass: 'note-cell',
    },
    {
      headerName: 'Művelet',
      colId: 'action',
      width: 200,
      minWidth: 160,
      pinned: 'right',
      suppressSizeToFit: true,
      cellClass: 'action-cell',
      cellRenderer: ActionCellRendererComponent as unknown,
    },
  ];

  ngOnInit(): void {
    this.api.listOrders().subscribe((list) => {
      this.orders.set(list);
      this.updateRowData();
    });
  }

  reload(): void {
    this.api.listOrders().subscribe((list) => {
      this.orders.set(list);
      this.updateRowData();
    });
  }

  onGridReady(event: GridReadyEvent): void {
    // Ensure initial data sizing after grid API available
    this.updateRowData();
    // Optional: fit columns to available width
    event.api.sizeColumnsToFit();
  }

  onStatusChange(value: 'all' | OrderStatus) {
    this.filterStatus.set(value);
    this.updateRowData();
  }

  private updateRowData() {
    const s = this.filterStatus();
    const arr = this.orders();
    this.rowData = s === 'all' ? arr : arr.filter((o) => o.status === s);
  }
}
