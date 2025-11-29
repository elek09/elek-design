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
import { ColDef, Theme, themeQuartz, GridReadyEvent } from 'ag-grid-community';
import { ordersListColumnDefs } from './orders-list.grid-col-def';

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

  columnDefs: ColDef[] = ordersListColumnDefs;

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    const status = this.filterStatus();
    this.api.listOrders(status).subscribe((list) => {
      this.orders.set(list);
      this.rowData = list; // Backend already filtered
    });
  }

  reload(): void {
    this.loadOrders();
  }

  onGridReady(event: GridReadyEvent): void {
    // Ensure initial data sizing after grid API available
    // Optional: fit columns to available width
    event.api.sizeColumnsToFit();
  }

  onStatusChange(value: 'all' | OrderStatus) {
    this.filterStatus.set(value);
    this.loadOrders(); // Reload from backend with new filter
  }
}
