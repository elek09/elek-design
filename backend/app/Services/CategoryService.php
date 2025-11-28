<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Subcategory;
use Illuminate\Database\Eloquent\Collection;

class CategoryService
{
    public function create(array $data): Category
    {
        // Cache invalidation is handled by the Observer
        return Category::create($data);
    }

    public function update(Category $category, array $data): Category
    {
        // Cache invalidation is handled by the Observer
        $category->update($data);
        return $category;
    }

    public function delete(Category $category): void
    {
        // Cache invalidálást az Observer végzi
        $category->delete();
    }

    public function getSubcategoriesByCategory(int $categoryId): Collection
    {
        return Subcategory::where('category_id', $categoryId)
            ->navOrdered()
            ->get();
    }
}
