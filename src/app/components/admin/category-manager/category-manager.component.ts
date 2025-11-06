import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Category } from '../../../models/category.model';
import { CategoryService } from '../../../services/category.service';
import { slugify } from '../../../utils/slug.utils';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';

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
    AdminHeaderComponent,
  ],
  templateUrl: './category-manager.component.html',
  styleUrls: ['./category-manager.component.scss'],
})
export class CategoryManagerComponent implements OnInit {
  categories: Category[] = [];
  selectedCategory: Category | null = null;
  newCategory: Category = { name: '', type: '', subcategories: [] };
  newSubcategoryName: string = '';
  lastError = '';
  orderDirty = false;

  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    // Load admin categories to include nav_order and allow reordering
    this.categoryService.getAdminCategories().subscribe((data) => {
      this.categories = [...(data || [])].sort(
        (a, b) =>
          (a.nav_order ?? Number.MAX_SAFE_INTEGER) -
          (b.nav_order ?? Number.MAX_SAFE_INTEGER)
      );
      this.orderDirty = false;
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  selectCategory(category: Category): void {
    // Create a deep copy to avoid modifying the original object directly
    const copy: Category = JSON.parse(JSON.stringify(category));
    // Normalize subcategories to objects with {id,name}
    if (Array.isArray(copy.subcategories)) {
      const mapped = copy.subcategories.map((s: any) => {
        if (typeof s === 'string') {
          return { id: slugify(s)!, name: s, nav_order: undefined } as any;
        }
        return {
          id: s.id ?? slugify(s.name ?? '')!,
          name: s.name ?? String(s.id ?? ''),
          nav_order:
            typeof s.nav_order === 'number' ? Number(s.nav_order) : undefined,
        } as any;
      });
      // Sort by nav_order if provided
      mapped.sort(
        (a: any, b: any) =>
          (a.nav_order ?? Number.MAX_SAFE_INTEGER) -
          (b.nav_order ?? Number.MAX_SAFE_INTEGER)
      );
      // Ensure sequential nav_order values (1-based)
      mapped.forEach((s: any, idx: number) => (s.nav_order = idx + 1));
      copy.subcategories = mapped as any;
    } else {
      copy.subcategories = [];
    }
    this.selectedCategory = copy;
  }

  saveCategory(category: Category): void {
    this.lastError = '';
    // Ensure nav_order reflects current order (1-based) before persisting
    const subs = ((category.subcategories || []) as any[]).map(
      (s: any, idx: number) => ({
        id: String(s?.id ?? ''),
        name: String(s?.name ?? ''),
        nav_order: idx + 1,
      })
    );
    const payload: Category = {
      ...(category as any),
      subcategories: subs,
    } as any;

    this.categoryService.saveCategory(payload).subscribe({
      next: () => {
        this.loadCategories();
        this.resetForm();
      },
      error: (err) => {
        // Surface backend validation message if available
        const msg = err?.error?.message || err?.message || 'Save failed';
        this.lastError = msg;
      },
    });
  }

  deleteCategory(id: string | number | undefined): void {
    if (id) {
      this.categoryService.deleteCategory(id).subscribe(() => {
        this.loadCategories();
        this.resetForm();
      });
    }
  }

  resetForm(): void {
    this.selectedCategory = null;
    this.newCategory = { name: '', type: '', subcategories: [] };
    this.newSubcategoryName = '';
    this.lastError = '';
  }

  addSubcategory(): void {
    if (this.selectedCategory && this.newSubcategoryName.trim()) {
      const name = this.newSubcategoryName.trim();
      const newSub = {
        id: slugify(name)!,
        name,
        nav_order:
          ((this.selectedCategory.subcategories || []) as any[]).length + 1,
      };
      const arr = (this.selectedCategory.subcategories || []) as Array<{
        id?: string;
        name: string;
        nav_order?: number;
      }>;
      arr.push(newSub);
      this.selectedCategory.subcategories = arr as any;
      this.newSubcategoryName = '';
    }
  }

  removeSubcategory(index: number): void {
    if (this.selectedCategory) {
      const arr = (this.selectedCategory.subcategories as any[]) || [];
      arr.splice(index, 1);
      // Reindex nav_order
      arr.forEach((s: any, idx: number) => (s.nav_order = idx + 1));
      this.selectedCategory.subcategories = arr as any;
    }
  }

  // Editing subcategory fields
  updateSubName(index: number, value: string): void {
    if (!this.selectedCategory) return;
    const arr = (this.selectedCategory.subcategories || []) as Array<any>;
    const name = (value || '').trim();
    const existing = arr[index];
    if (typeof existing === 'string') {
      // convert to object if string
      arr[index] = { id: slugify(name)!, name };
    } else {
      existing.name = name;
      // Auto-sync id with name if user hasn't manually set a custom id (basic heuristic)
      if (!existing.id || existing.id === slugify(existing.name)) {
        existing.id = slugify(name)!;
      }
    }
    this.selectedCategory.subcategories = arr as any;
  }

  updateSubId(index: number, value: string): void {
    if (!this.selectedCategory) return;
    const arr = (this.selectedCategory.subcategories || []) as Array<any>;
    const existing = arr[index];
    const newId = slugify(value || '')!;
    if (typeof existing === 'string') {
      // convert to object if string
      arr[index] = { id: newId, name: existing };
    } else {
      existing.id = newId;
    }
    this.selectedCategory.subcategories = arr as any;
  }

  // Drag & Drop reordering for subcategories
  dropSubcategory(event: CdkDragDrop<any[]>): void {
    if (!this.selectedCategory) return;
    const arr = (this.selectedCategory.subcategories || []) as any[];
    moveItemInArray(arr, event.previousIndex, event.currentIndex);
    // Update nav_order after move (1-based)
    arr.forEach((s: any, idx: number) => (s.nav_order = idx + 1));
    this.selectedCategory.subcategories = arr as any;
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
    this.categoryService.saveCategoryOrder(this.categories).subscribe({
      next: () => {
        this.orderDirty = false;
        this.loadCategories();
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Reorder failed';
        this.lastError = msg;
      },
    });
  }

  // TrackBy helpers to reduce DOM churn
  trackByCategory = (_: number, c: Category) => c._id ?? c.id ?? c.type;
  trackBySub = (_: number, s: { id?: string; name: string }) =>
    s.id ?? s.name ?? _;

  // Validation helpers
  get hasDuplicateSubIds(): boolean {
    if (!this.selectedCategory) return false;
    const arr = (this.selectedCategory.subcategories || []) as Array<any>;
    const ids = arr
      .map((s) =>
        typeof s === 'string' ? slugify(s) : slugify(s?.id ?? s?.name ?? '')
      )
      .filter((id): id is string => !!id);
    const set = new Set<string>();
    for (const id of ids) {
      if (set.has(id)) return true;
      set.add(id);
    }
    return false;
  }

  get isSaveDisabled(): boolean {
    if (!this.selectedCategory) return true;
    const hasName = !!String(this.selectedCategory.name || '').trim();
    const hasType = !!String(this.selectedCategory.type || '').trim();
    return (
      !hasName || !hasType || this.isEditTypeTaken || this.hasDuplicateSubIds
    );
  }

  // UI helpers
  onNewTypeInput(): void {
    if (this.newCategory?.type) {
      this.newCategory.type = slugify(String(this.newCategory.type))!;
    }
  }

  onEditTypeInput(value: string): void {
    if (this.selectedCategory) {
      this.selectedCategory.type = slugify(value || '')!;
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
    return this.categories.some(
      (c) => String(c.type) === t && c._id != this.selectedCategory!._id
    );
  }

  get selectedSubcategories(): Array<{
    id?: string;
    name: string;
    nav_order?: number;
  }> {
    if (!this.selectedCategory) return [];
    const arr = (this.selectedCategory.subcategories || []) as Array<any>;
    // selectedCategory is normalized to objects; keep as-is to preserve nav_order
    return arr.map((s: any) =>
      typeof s === 'string'
        ? { id: slugify(s)!, name: s, nav_order: undefined }
        : s
    );
  }

  // Save current category edits (including new subcategory) then go to gallery with params
  addItemToSubcategory(sub: { id?: string; name: string }): void {
    if (!this.selectedCategory) return;
    this.lastError = '';
    // Persist edits first, then navigate
    this.categoryService.saveCategory(this.selectedCategory).subscribe({
      next: () => {
        this.router.navigate(['/admin/gallery'], {
          queryParams: {
            mainCategory: this.selectedCategory!.type,
            subCategory: sub.id,
          },
        });
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Save failed';
        this.lastError = msg;
      },
    });
  }

  // Save current category edits then navigate to add item for the main category
  addItemToCategory(): void {
    if (!this.selectedCategory) return;
    this.lastError = '';
    this.categoryService.saveCategory(this.selectedCategory).subscribe({
      next: () => {
        this.router.navigate(['/admin/gallery'], {
          queryParams: { mainCategory: this.selectedCategory!.type },
        });
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Save failed';
        this.lastError = msg;
      },
    });
  }
}
