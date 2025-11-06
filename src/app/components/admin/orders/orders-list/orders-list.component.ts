import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AdminHeaderComponent } from '../../admin-header/admin-header.component';
import { AdminOrdersService } from '../../../../services/admin-orders.service';
import { Order, OrderStatus } from '../../../../models/order.model';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  ValueFormatterParams,
  ICellRendererParams,
  Theme,
  themeQuartz,
} from 'ag-grid-community';

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
  ],
  templateUrl: './orders-list.component.html',
  styleUrl: './orders-list.component.scss',
})
export class OrdersListComponent implements OnInit, OnDestroy {
  private readonly api = inject(AdminOrdersService);
  private readonly router = inject(Router);
  protected orders = signal<Order[]>([]);
  protected filterStatus = signal<'all' | OrderStatus>('all');

  rowData: Order[] = [];
  theme: Theme = themeQuartz;
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
      field: 'kind',
      headerName: 'Típus',
      valueFormatter: (p) => (p.value === 'quote' ? 'Árajánlat' : 'Rendelés'),
      minWidth: 130,
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
      minWidth: 160,
      pinned: 'right',
      cellClass: 'action-cell',
      cellRenderer: (p: ICellRendererParams) => {
        const button = document.createElement('button');
        button.type = 'button';
        // Use AG Grid themed button classes
        button.className = 'ag-button ag-standard-button';
        button.setAttribute('aria-label', 'Szerkesztés');

        const icon = document.createElement('span');
        icon.className = 'material-icons';
        icon.textContent = 'edit';

        const label = document.createElement('span');
        label.textContent = ' Szerkesztés';

        button.appendChild(icon);
        button.appendChild(label);

        button.addEventListener('click', () => {
          this.router.navigate(['/admin/orders', p.data.id]);
        });
        return button;
      },
    },
  ];

  private gridApi?: GridApi;
  private resizeListener = () => this.updateResponsiveColumns();

  ngOnInit(): void {
    this.api.listOrders().subscribe((list) => {
      this.orders.set(list);
      this.updateRowData();
    });
    // initial responsive columns
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.resizeListener);
    }
  }

  reload(): void {
    this.api.listOrders().subscribe((list) => {
      this.orders.set(list);
      this.updateRowData();
    });
  }

  onStatusChange(value: 'all' | OrderStatus) {
    this.filterStatus.set(value);
    this.updateRowData();
  }

  onGridReady(e: GridReadyEvent) {
    this.gridApi = e.api;
    e.api.sizeColumnsToFit();
    this.updateResponsiveColumns();
  }

  private updateRowData() {
    const s = this.filterStatus();
    const arr = this.orders();
    this.rowData = s === 'all' ? arr : arr.filter((o) => o.status === s);
    // Let grid size columns after data update
    queueMicrotask(() => this.gridApi?.sizeColumnsToFit());
  }

  private updateResponsiveColumns() {
    if (!this.gridApi) return;
    const w = window.innerWidth || 1024;
    const hideForSmall = w < 640; // tailwind-sm-ish breakpoint
    // On very small screens, hide the note column to keep table readable
    this.gridApi.applyColumnState({
      state: [{ colId: 'note', hide: hideForSmall }],
      applyOrder: false,
    });
    // Also reduce pinned action width impact by auto-sizing important columns
    this.gridApi.sizeColumnsToFit();
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeListener);
    }
  }
}
