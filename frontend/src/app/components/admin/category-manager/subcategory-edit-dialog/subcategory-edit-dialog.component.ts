import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AdminApiService } from '../../../../services/admin-api.service';
import { Subcategory } from '../../../../models/category.model';

export interface SubcategoryEditDialogData {
  id: number | string;
}

@Component({
  selector: 'app-subcategory-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './subcategory-edit-dialog.component.html',
  styleUrls: ['./subcategory-edit-dialog.component.scss'],
})
export class SubcategoryEditDialogComponent implements OnInit {
  private readonly dialogRef = inject(
    MatDialogRef<SubcategoryEditDialogComponent>,
  );
  private readonly adminApiService = inject(AdminApiService);
  private readonly data = inject(MAT_DIALOG_DATA) as SubcategoryEditDialogData;

  loading = true;
  error = '';
  model: Subcategory | null = null;
  nameInput = '';

  ngOnInit(): void {
    if (!this.data?.id) {
      this.error = 'Hiányzó azonosító';
      this.loading = false;
      return;
    }

    this.adminApiService.getSubcategory(this.data.id).subscribe({
      next: (sub: Subcategory) => {
        this.model = sub;
        this.nameInput = sub.name;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'Betöltési hiba';
        this.loading = false;
      },
    });
  }

  save(): void {
    if (!this.model?.id) return;

    const newName = this.nameInput.trim();
    if (!newName) return;

    this.error = '';
    this.loading = true;

    this.adminApiService
      .updateSubcategory(this.model.id, { name: newName })
      .subscribe({
        next: (updated: Subcategory) => {
          this.loading = false;
          this.dialogRef.close(updated);
        },
        error: (err: any) => {
          this.error = err?.error?.message || 'Mentési hiba';
          this.loading = false;
        },
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
