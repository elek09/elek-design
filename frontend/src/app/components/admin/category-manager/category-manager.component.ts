import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Category, Subcategory } from '../../../models/category.model';
import { AdminApiService } from '../../../services/admin-api.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { slugify, normalizeSubcategories } from '../../../utils/category.utils';
import { SubcategoryEditDialogComponent } from './subcategory-edit-dialog/subcategory-edit-dialog.component';

@Component({
  selector: 'app-category-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DragDropModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    AdminHeaderComponent,
  ],
  templateUrl: './category-manager.component.html',
  styleUrls: ['./category-manager.component.scss'],
})
export class CategoryManagerComponent implements OnInit {
  private readonly adminApiService = inject(AdminApiService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  categories: Category[] = [];
  selectedCategory: Category | null = null;
  newCategory: Category = { name: '', type: '', subcategories: [] };
  selectedSubcategories: Subcategory[] = [];
  newSubcategoryName = '';
  lastError = '';
  orderDirty = false;
  subOrderDirty = false;

  private originalCategoryType: string | null = null;
  private originalCategoryId: number | string | null = null;
  private originalCategoryName: string | null = null;

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.adminApiService.getCategories(true).subscribe((data: Category[]) => {
      this.categories = data || [];
      this.orderDirty = false;
    });
  }

  selectCategory(category: Category): void {
    this.selectedCategory = JSON.parse(JSON.stringify(category));
    this.originalCategoryType = category.type;
    this.originalCategoryId = this.getCategoryId(category);
    this.originalCategoryName = category.name;
    this.loadSubcategoriesForSelected();
  }

  private getCategoryId(category: Category): number | string | null {
    return category.id ?? category._id ?? null;
  }

  private loadSubcategoriesForSelected(): void {
    if (!this.selectedCategory) {
      this.selectedSubcategories = [];
      return;
    }

    const catId = this.getCategoryId(this.selectedCategory);
    if (!catId) {
      this.selectedSubcategories = [];
      return;
    }

    this.adminApiService.getSubcategoriesByCategory(catId).subscribe({
      next: (subs: Subcategory[]) => {
        this.selectedSubcategories = subs;
        this.subOrderDirty = false;
      },
      error: (err: any) => {
        this.lastError =
          err?.error?.message || 'Alkategóriák betöltése sikertelen';
      },
    });
  }

  saveCategory(category: Category): void {
    this.lastError = '';
    const isCreate = !category._id && !category.id;

    if (isCreate) {
      if (category.type) category.type = slugify(category.type)!;
      const subs = normalizeSubcategories(category.subcategories).map(
        (s, idx) => ({
          id: s.id,
          slug: s.slug,
          name: s.name,
          nav_order: idx + 1,
        }),
      );
      const createPayload: Category = {
        ...category,
        subcategories: subs as any,
      };
      this.adminApiService.saveCategory(createPayload).subscribe({
        next: () => {
          this.loadCategories();
          this.resetForm();
        },
        error: (err: any) => {
          this.lastError =
            err?.error?.message || err?.message || 'Mentés sikertelen';
        },
      });
      return;
    }

    const patch: Partial<Category> = {};
    const currentName = String(category.name || '').trim();
    const currentType = String(category.type || '').trim();

    if (
      this.originalCategoryName !== null &&
      currentName !== this.originalCategoryName
    ) {
      patch.name = currentName;
    }
    if (
      this.originalCategoryType !== null &&
      currentType !== this.originalCategoryType
    ) {
      patch.type = currentType;
    }

    if (!Object.keys(patch).length) return;

    const id = this.getCategoryId(category);
    if (!id) {
      this.lastError = 'Hiányzó kategória azonosító';
      return;
    }

    this.adminApiService.patchCategory(id, patch).subscribe({
      next: () => {
        this.loadCategories();
        this.resetForm();
      },
      error: (err) => {
        this.lastError =
          err?.error?.message || err?.message || 'Mentés sikertelen';
      },
    });
  }

  deleteCategory(id: string | number | undefined): void {
    if (id) {
      this.adminApiService.deleteCategory(id).subscribe(() => {
        this.loadCategories();
        this.resetForm();
      });
    }
  }

  resetForm(): void {
    this.selectedCategory = null;
    this.selectedSubcategories = [];
    this.newCategory = { name: '', type: '', subcategories: [] };
    this.newSubcategoryName = '';
    this.lastError = '';
    this.subOrderDirty = false;
    this.originalCategoryType = null;
    this.originalCategoryId = null;
    this.originalCategoryName = null;
  }

  addSubcategory(): void {
    if (!this.selectedCategory) return;

    const name = this.newSubcategoryName.trim();
    if (!name) return;

    const catId = this.getCategoryId(this.selectedCategory);
    if (!catId) return;

    this.adminApiService
      .createSubcategory({ category_id: catId, name, slug: slugify(name)! })
      .subscribe({
        next: () => {
          this.newSubcategoryName = '';
          this.loadSubcategoriesForSelected();
        },
        error: (err: any) => {
          this.lastError =
            err?.error?.message || 'Alkategória létrehozás sikertelen';
        },
      });
  }

  removeSubcategory(index: number): void {
    const sub = this.selectedSubcategories[index];
    if (!sub?.id) return;
    this.adminApiService.deleteSubcategory(sub.id).subscribe({
      next: () => this.loadSubcategoriesForSelected(),
      error: (err: any) =>
        (this.lastError = err?.error?.message || 'Alkategória törlés hiba'),
    });
  }

  openEditSubNameDialog(index: number): void {
    const sub = this.selectedSubcategories[index];
    if (!sub?.id) return;
    const ref = this.dialog.open(SubcategoryEditDialogComponent, {
      data: { id: sub.id },
      width: '400px',
    });
    ref.afterClosed().subscribe((updated: Subcategory | undefined) => {
      if (updated) {
        this.loadSubcategoriesForSelected();
      }
    });
  }

  dropSubcategory(
    event: CdkDragDrop<
      {
        id?: number | string;
        slug?: string;
        name: string;
        nav_order?: number;
      }[]
    >,
  ): void {
    moveItemInArray(
      this.selectedSubcategories,
      event.previousIndex,
      event.currentIndex,
    );
    this.selectedSubcategories.forEach((s, idx) => (s.nav_order = idx + 1));
    this.subOrderDirty = true;
  }

  dropCategory(event: CdkDragDrop<Category[]>): void {
    moveItemInArray(this.categories, event.previousIndex, event.currentIndex);
    this.categories.forEach((c, idx) => (c.nav_order = idx + 1));
    this.orderDirty = true;
  }

  saveCategoryOrder(): void {
    if (!this.orderDirty) return;
    this.categories.forEach((c, idx) => (c.nav_order = idx + 1));
    this.adminApiService.reorderCategories(this.categories).subscribe({
      next: (updated: Category[]) => {
        this.categories = updated || [];
        this.orderDirty = false;
      },
      error: (err) => {
        this.lastError =
          err?.error?.message || err?.message || 'Sorrend mentés sikertelen';
      },
    });
  }

  trackByCategory(index: number, category: Category): string | number {
    return category._id ?? category.id ?? category.type;
  }

  trackBySub(
    index: number,
    subcategory: { id?: number | string; slug?: string; name: string },
  ): string | number {
    return subcategory.slug ?? subcategory.id ?? subcategory.name ?? index;
  }

  get isSaveDisabled(): boolean {
    if (!this.selectedCategory) return true;
    const hasName = !!String(this.selectedCategory.name || '').trim();
    const hasType = !!String(this.selectedCategory.type || '').trim();
    return !hasName || !hasType || this.isEditTypeTaken;
  }

  onNewTypeInput(): void {
    if (this.newCategory?.type) {
      this.newCategory.type = slugify(String(this.newCategory.type))!;
    }
  }

  onEditTypeInput(value: string): void {
    if (this.selectedCategory) {
      this.selectedCategory.type = value;
    }
  }

  get isCreateTypeTaken(): boolean {
    const t = String(this.newCategory?.type || '').trim();
    if (!t) return false;
    return this.categories.some((c) => String(c.type) === t);
  }

  get isEditTypeTaken(): boolean {
    if (!this.selectedCategory) return false;
    const t = String(this.selectedCategory.type || '').trim();
    if (!t) return false;
    if (this.originalCategoryType !== null && t === this.originalCategoryType) {
      return false;
    }
    const currentId = this.originalCategoryId;
    return this.categories.some((c) => {
      const cid = this.getCategoryId(c);
      return String(c.type) === t && cid != currentId;
    });
  }

  addItemToSubcategory(sub: Subcategory): void {
    if (!this.selectedCategory) return;

    this.lastError = '';
    const mainId =
      this.getCategoryId(this.selectedCategory) ?? this.selectedCategory.type;

    if (!sub.id) {
      this.loadSubcategoriesForSelected();
      const refreshed = this.selectedSubcategories.find(
        (s) => s.slug === (sub as any).slug || s.name === sub.name,
      );
      if (!refreshed?.id) {
        this.lastError =
          'Az alkategória azonosító még nem érhető el. Próbáld újra.';
        return;
      }
      sub = refreshed as any;
    }

    this.router.navigate(['/admin/gallery'], {
      queryParams: {
        mainCategory: mainId,
        subCategory: sub.id,
      },
    });
  }

  addItemToCategory(): void {
    if (!this.selectedCategory) return;

    this.lastError = '';
    const mainId =
      this.getCategoryId(this.selectedCategory) ?? this.selectedCategory.type;

    this.router.navigate(['/admin/gallery'], {
      queryParams: { mainCategory: mainId },
    });
  }

  saveSubcategoryOrder(): void {
    if (!this.subOrderDirty || this.selectedSubcategories.length === 0) return;

    this.selectedSubcategories.forEach((s, idx) => (s.nav_order = idx + 1));

    const updates = this.selectedSubcategories.map((s) =>
      this.adminApiService.updateSubcategory(s.id!, { nav_order: s.nav_order }),
    );

    forkJoin(updates).subscribe({
      next: () => {
        this.subOrderDirty = false;
        this.loadSubcategoriesForSelected();
      },
      error: (err: any) => {
        this.lastError =
          err?.error?.message || 'Alkategória sorrend mentés sikertelen';
      },
    });
  }
}
