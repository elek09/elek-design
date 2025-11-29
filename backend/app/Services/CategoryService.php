<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Subcategory;
use Illuminate\Database\Eloquent\Collection;

class CategoryService
{
    public function create(array $data): Category
    {
        return Category::create($data);
    }

    public function update(Category $category, array $data): Category
    {
        $category->update($data);
        return $category;
    }

    public function delete(Category $category): void
    {
        $category->delete();
    }

    // kategóriához tartozó alkategóriák lekérése navigációs sorrendben
    public function getSubcategoriesByCategory(int $categoryId): Collection
    {
        return Subcategory::where('category_id', $categoryId)
            ->navOrdered()
            ->get();
    }
}
