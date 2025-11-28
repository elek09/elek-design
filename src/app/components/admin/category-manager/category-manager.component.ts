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
import { slugify } from '../../../utils/category.utils';
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
  private adminApiService = inject(AdminApiService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  categories: Category[] = [];
  selectedCategory: Category | null = null;
  newCategory: Category = { name: '', type: '', subcategories: [] };
  // Subcategories külön listában (backend rekordok)
  selectedSubcategories: Subcategory[] = [];
  newSubcategoryName = '';
  lastError = '';
  orderDirty = false;
  subOrderDirty = false;
  // Eredeti kategória adatok a type változás detektálásához
  private originalCategoryType: string | null = null;
  private originalCategoryId: number | string | null = null;
  private originalCategoryName: string | null = null;

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.adminApiService.getCategories(true).subscribe((data: Category[]) => {
      // Backend already returns categories ordered by nav_order
      this.categories = data || [];
      this.orderDirty = false;
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  // Internal normalized representation of a subcategory
  private normalizeSubcategories(list: Category['subcategories']): {
    id?: number | string;
    slug: string;
    name: string;
    nav_order?: number;
  }[] {
    if (!Array.isArray(list)) return [];
    return list
      .map((raw) => {
        if (typeof raw === 'string') {
          const slug = slugify(raw)!;
          return { slug, name: raw };
        }
        const name = raw.name ?? String(raw.slug ?? raw.id ?? '');
        const slug = raw.slug ? slugify(raw.slug)! : slugify(name)!;
        const nav_order =
          typeof raw.nav_order === 'number' ? Number(raw.nav_order) : undefined;
        return { id: raw.id, slug, name, nav_order };
      })
      .sort(
        (a, b) =>
          (a.nav_order ?? Number.MAX_SAFE_INTEGER) -
          (b.nav_order ?? Number.MAX_SAFE_INTEGER),
      )
      .map((s, idx) => ({ ...s, nav_order: idx + 1 }));
  }

  selectCategory(category: Category): void {
    this.selectedCategory = JSON.parse(JSON.stringify(category));
    this.originalCategoryType = category.type;
    this.originalCategoryId = category.id ?? category._id ?? null;
    this.originalCategoryName = category.name;
    this.loadSubcategoriesForSelected();
  }

  private loadSubcategoriesForSelected(): void {
    if (!this.selectedCategory) {
      this.selectedSubcategories = [];
      return;
    }
    const catId = this.selectedCategory._id || this.selectedCategory.id;
    if (!catId) {
      this.selectedSubcategories = [];
      return;
    }
    
    // Use optimized backend endpoint to fetch only subcategories for this category
    // Backend already returns them ordered by nav_order
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
      if (category.type) category.type = slugify(category.type)!; // slug only on create
      const subs = this.normalizeSubcategories(category.subcategories).map(
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
          const msg = err?.error?.message || err?.message || 'Save failed';
          this.lastError = msg;
        },
      });
      return;
    }
    // PATCH only changed fields
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
    if (!Object.keys(patch).length) {
      return; // nothing changed
    }
    const id = category.id ?? category._id;
    if (id == null) {
      this.lastError = 'Hiányzó kategória azonosító';
      return;
    }
    this.adminApiService.patchCategory(id, patch).subscribe({
      next: () => {
        this.loadCategories();
        this.resetForm();
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Patch failed';
        this.lastError = msg;
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
    const catId = this.selectedCategory._id || this.selectedCategory.id;
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

  // Editing subcategory fields
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

  updateSubSlug(index: number, value: string): void {
    // Slug editing disabled
  }

  // Drag & Drop reordering for subcategories
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

  // Drag & Drop reordering for categories (controls header order)
  dropCategory(event: CdkDragDrop<Category[]>): void {
    moveItemInArray(this.categories, event.previousIndex, event.currentIndex);
    // Update nav_order locally to reflect new order (1-based)
    this.categories.forEach((c, idx) => (c.nav_order = idx + 1));
    this.orderDirty = true;
  }

  saveCategoryOrder(): void {
    if (!this.orderDirty) return;
    // Ensure nav_order is sequential before save
    this.categories.forEach((c, idx) => (c.nav_order = idx + 1));
    this.adminApiService.reorderCategories(this.categories).subscribe({
      next: (updated: Category[]) => {
        // Backend already returns categories ordered by nav_order
        this.categories = updated || [];
        this.orderDirty = false;
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Reorder failed';
        this.lastError = msg;
      },
    });
  }

  // TrackBy helpers to reduce DOM churn
  trackByCategory = (_: number, c: Category) => c._id ?? c.id ?? c.type;
  trackBySub = (
    _: number,
    s: { id?: number | string; slug?: string; name: string },
  ) => s.slug ?? s.id ?? s.name ?? _;

  // Validation helpers
  get hasDuplicateSubSlugs(): boolean {
    return false; // Not relevant – slug not editable
  }

  get isSaveDisabled(): boolean {
    if (!this.selectedCategory) return true;
    const hasName = !!String(this.selectedCategory.name || '').trim();
    const hasType = !!String(this.selectedCategory.type || '').trim();
    return !hasName || !hasType || this.isEditTypeTaken;
  }

  // UI helpers
  onNewTypeInput(): void {
    if (this.newCategory?.type) {
      this.newCategory.type = slugify(String(this.newCategory.type))!;
    }
  }

  onEditTypeInput(value: string): void {
    // Ne slug-oljunk automatikusan szerkesztéskor, csak nyers érték mentése
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
    // Ha a type nem változott az eredetihez képest, nincs ütközés
    if (this.originalCategoryType !== null && t === this.originalCategoryType) {
      return false;
    }
    const currentId = this.originalCategoryId;
    return this.categories.some((c) => {
      const cid = c.id ?? c._id;
      return String(c.type) === t && cid != currentId;
    });
  }

  get selectedSubcategoriesView(): Subcategory[] {
    return this.selectedSubcategories;
  }

  // Save current category edits (including new subcategory) then go to gallery with params
  addItemToSubcategory(sub: Subcategory): void {
    if (!this.selectedCategory) return;
    this.lastError = '';
    const mainId =
      this.selectedCategory.id ??
      this.selectedCategory._id ??
      this.selectedCategory.type;
    if (!sub.id) {
      // Fallback: refresh subcategories to obtain id before navigating
      this.loadSubcategoriesForSelected();
      const refreshed = this.selectedSubcategories.find(
        (s) => s.slug === (sub as any).slug || s.name === sub.name,
      );
      if (!refreshed?.id) {
        this.lastError =
          'Az alkategória azonosító még nem érhető el. Próbáld újra egy pillanat múlva.';
        return;
      }
      sub = refreshed as any;
    }
    const subId = sub.id;
    this.router.navigate(['/admin/gallery'], {
      queryParams: {
        mainCategory: mainId,
        subCategory: subId,
      },
    });
  }

  // Save current category edits then navigate to add item for the main category
  addItemToCategory(): void {
    if (!this.selectedCategory) return;
    this.lastError = '';
    const mainId =
      this.selectedCategory.id ??
      this.selectedCategory._id ??
      this.selectedCategory.type;
    this.router.navigate(['/admin/gallery'], {
      queryParams: { mainCategory: mainId },
    });
  }

  saveSubcategoryOrder(): void {
    if (!this.subOrderDirty || this.selectedSubcategories.length === 0) return;
    
    // Ensure current local order indices are set
    this.selectedSubcategories.forEach((s, idx) => (s.nav_order = idx + 1));
    
    // Update all subcategory nav_order values in parallel
    const updates = this.selectedSubcategories.map((s) =>
      this.adminApiService.updateSubcategory(s.id!, { nav_order: s.nav_order })
    );
    
    forkJoin(updates).subscribe({
      next: () => {
        this.subOrderDirty = false;
        this.loadSubcategoriesForSelected();
      },
      error: (err: any) => {
        this.lastError =
          err?.error?.message || 'Alkategória sorrend mentés hiba';
      },
    });
  }
}
