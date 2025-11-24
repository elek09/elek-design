import { Component, inject } from '@angular/core';
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
import { SubcategoryService } from '../../../../services/subcategory.service';
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
export class SubcategoryEditDialogComponent {
  private dialogRef = inject(MatDialogRef<SubcategoryEditDialogComponent>);
  private subService = inject(SubcategoryService);
  private data = inject(MAT_DIALOG_DATA) as SubcategoryEditDialogData;

  loading = true;
  error = '';
  model: Subcategory | null = null;
  nameInput = '';

  ngOnInit(): void {
    if (!this.data || this.data.id == null) {
      this.error = 'Hiányzó azonosító';
      this.loading = false;
      return;
    }
    this.subService.get(this.data.id).subscribe({
      next: (sub) => {
        this.model = sub;
        this.nameInput = sub.name;
        this.loading = false;
      },
      error: (err) => {
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
    this.subService
      .update(this.model.id, {
        name: newName,
        category_id: this.model.category_id,
      })
      .subscribe({
        next: (updated) => {
          this.loading = false;
          this.dialogRef.close(updated);
        },
        error: (err) => {
          this.error = err?.error?.message || 'Mentési hiba';
          this.loading = false;
        },
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
