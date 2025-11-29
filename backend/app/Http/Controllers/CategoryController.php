<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Http\Resources\SubcategoryResource;
use App\Models\Category;
use App\Services\CategoryService;

class CategoryController extends Controller
{
    public function __construct(private CategoryService $categoryService) {}

    /**
     * Összes kategória listázása alkategóriákkal
     * Navigációs sorrendben (nav_order)
     */
    public function getCategories()
    {
        $cats = Category::navOrdered()->with('subcategories')->get();
        return CategoryResource::collection($cats);
    }

    /**
     * Adott kategória alkategóriáinak lekérése
     * Navigációs sorrendben
     */
    public function getSubcategoriesByCategory(int $categoryId)
    {
        $subcategories = $this->categoryService->getSubcategoriesByCategory($categoryId);
        return SubcategoryResource::collection($subcategories);
    }
}
