<?php

namespace App\Services;

use App\Http\Controllers\BootstrapController;
use App\Models\Category;
use Illuminate\Support\Facades\Cache;

class CategoryService
{
    public function create(array $data): Category
    {
        // Cache invalidálást az Observer végzi
        return Category::create($data);
    }

    public function update(Category $category, array $data): Category
    {
        // Cache invalidálást az Observer végzi
        $category->update($data);
        return $category;
    }

    public function delete(Category $category): void
    {
        // Cache invalidálást az Observer végzi
        $category->delete();
    }
}
