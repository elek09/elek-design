import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Category } from '../../../models/category.model';
import { CategoryService } from '../../../services/category.service';

@Component({
  selector: 'app-category-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DragDropModule],
  templateUrl: './category-manager.component.html',
  styleUrls: ['./category-manager.component.scss'],
})
export class CategoryManagerComponent implements OnInit {
  categories: Category[] = [];
  selectedCategory: Category | null = null;
  newCategory: Category = { name: '', type: '', subcategories: [] };
  newSubcategoryName: string = '';
  lastError = '';

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe((data) => {
      this.categories = data;
    });
  }

  selectCategory(category: Category): void {
    // Create a deep copy to avoid modifying the original object directly
    const copy: Category = JSON.parse(JSON.stringify(category));
    // Normalize subcategories to objects with {id,name}
    if (Array.isArray(copy.subcategories)) {
      copy.subcategories = copy.subcategories.map((s: any) => {
        if (typeof s === 'string') {
          return { id: this.slugify(s), name: s };
        }
        return {
          id: s.id ?? this.slugify(s.name ?? ''),
          name: s.name ?? String(s.id ?? ''),
        };
      });
    } else {
      copy.subcategories = [];
    }
    this.selectedCategory = copy;
  }

  saveCategory(category: Category): void {
    this.lastError = '';
    this.categoryService.saveCategory(category).subscribe({
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
        id: this.slugify(name),
        name,
      };
      const arr = (this.selectedCategory.subcategories || []) as Array<{
        id?: string;
        name: string;
      }>;
      arr.push(newSub);
      this.selectedCategory.subcategories = arr as any;
      this.newSubcategoryName = '';
    }
  }

  removeSubcategory(index: number): void {
    if (this.selectedCategory) {
      (this.selectedCategory.subcategories as any[]).splice(index, 1);
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
      arr[index] = { id: this.slugify(name), name };
    } else {
      existing.name = name;
      // Auto-sync id with name if user hasn't manually set a custom id (basic heuristic)
      if (!existing.id || existing.id === this.slugify(existing.name)) {
        existing.id = this.slugify(name);
      }
    }
    this.selectedCategory.subcategories = arr as any;
  }

  updateSubId(index: number, value: string): void {
    if (!this.selectedCategory) return;
    const arr = (this.selectedCategory.subcategories || []) as Array<any>;
    const existing = arr[index];
    const newId = this.slugify(value || '');
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
    this.selectedCategory.subcategories = arr as any;
  }

  // Validation helpers
  get hasDuplicateSubIds(): boolean {
    if (!this.selectedCategory) return false;
    const arr = (this.selectedCategory.subcategories || []) as Array<any>;
    const ids = arr
      .map((s) =>
        typeof s === 'string'
          ? this.slugify(s)
          : this.slugify(s?.id ?? s?.name ?? '')
      )
      .filter((id) => !!id);
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
  slugify(value: string): string {
    return (value || '')
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  onNewTypeInput(): void {
    if (this.newCategory?.type) {
      this.newCategory.type = this.slugify(String(this.newCategory.type));
    }
  }

  onEditTypeInput(value: string): void {
    if (this.selectedCategory) {
      this.selectedCategory.type = this.slugify(value || '');
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

  get selectedSubcategories(): Array<{ id?: string; name: string }> {
    if (!this.selectedCategory) return [];
    const arr = (this.selectedCategory.subcategories || []) as Array<any>;
    return arr.map((s: any) =>
      typeof s === 'string' ? { id: this.slugify(s), name: s } : s
    );
  }
}
