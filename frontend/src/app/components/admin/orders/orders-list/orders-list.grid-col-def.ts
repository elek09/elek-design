import {
  ColDef,
  ValueFormatterParams,
  ICellRendererParams,
} from 'ag-grid-community';
import { formatDateTime } from '../../../../utils/date.utils';
import { ActionCellRendererComponent } from './action-cell-renderer.component';

export const ordersListColumnDefs: ColDef[] = [
  {
    field: 'created_at',
    headerName: 'Dátum',
    width: 180,
    valueFormatter: (p: ValueFormatterParams) =>
      p.value ? formatDateTime(p.value as string, 'hu-HU') : '',
  },
  {
    headerName: 'Ügyfél',
    valueGetter: (p) => p.data?.customer?.name ?? '',
    width: 160,
  },
  {
    field: 'status',
    headerName: 'Státusz',
    width: 60,
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
    width: 60,
    valueFormatter: (p) =>
      p.value === null || p.value === undefined
        ? '—'
        : `${Number(p.value).toLocaleString('hu-HU')}Ft`,
    type: 'rightAligned',
  },
  {
    field: 'note',
    headerName: 'Megjegyzés',
    minWidth: 180,
    flex: 2,
    cellClass: 'note-cell',
  },
  {
    headerName: 'Művelet',
    colId: 'action',
    width: 280,
    pinned: 'right',
    suppressSizeToFit: true,
    cellClass: 'action-cell',
    cellRenderer: ActionCellRendererComponent as unknown,
  },
];
