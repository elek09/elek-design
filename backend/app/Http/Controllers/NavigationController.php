<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Page;
use App\Services\NavigationService;
use Illuminate\Http\Request;

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
}
