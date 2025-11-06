<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Services\NavigationService;

class NavigationController extends Controller
{
    public function __construct(private NavigationService $nav)
    {
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
        $cats = Category::navOrdered()->get();
        return \App\Http\Resources\CategoryResource::collection($cats);
    }
}
