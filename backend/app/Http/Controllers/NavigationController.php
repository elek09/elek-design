<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Services\NavigationService;
use App\Services\CategoryService;
use App\Http\Resources\SubcategoryResource;

class NavigationController extends Controller
{
    public function __construct(
        private NavigationService $nav,
        private CategoryService $categoryService
    ) {
    }
    /**
     * Public header navigation config derived from DB categories and pages.
     */
    public function header()
    {
        $items = $this->nav->buildHeaderItems();

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $items,
            ],
        ]);
    }

    /**
     * Public categories list (ordered for navigation), including subcategories.
     */
    public function getCategories()
    {
        $cats = Category::navOrdered()->with('subcategories')->get();
        return \App\Http\Resources\CategoryResource::collection($cats);
    }

    /**
     * Get subcategories for a specific category.
     */
    public function getSubcategoriesByCategory(int $categoryId)
    {
        $subcategories = $this->categoryService->getSubcategoriesByCategory($categoryId);
        return SubcategoryResource::collection($subcategories);
    }
}
