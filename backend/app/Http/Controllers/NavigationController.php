<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Page;
use Illuminate\Http\Request;

class NavigationController extends Controller
{
    /**
     * Public header navigation config derived from DB categories and pages.
     */
    public function header()
    {
        // Order by explicit nav_order first (non-null), then by name
        $categories = Category::orderByRaw('CASE WHEN nav_order IS NULL THEN 1 ELSE 0 END')
            ->orderBy('nav_order')
            ->orderBy('name')
            ->get();
        $items = [];

        // Always prepend Logo as the first navigation item
        $items[] = [
            'id' => 'logo',
            'label' => 'Logo',
            'route' => '/',
            'is_logo' => true,
            'order' => 0,
        ];

        foreach ($categories as $cat) {
            $type = (string) $cat->type;
            $label = (string) $cat->name;

            // eletter/uzletter are sections on the homepage -> use fragment
            if (in_array($type, ['eletter', 'uzletter'], true)) {
                $items[] = [
                    'id' => $type, // navigation item id for frontend reordering
                    'category_id' => $cat->id,
                    'label' => $label,
                    'route' => '/',
                    'fragment' => $label, // keep the exact display label for existing anchors
                    'section' => $type,
                    'order' => $cat->nav_order,
                ];
                continue;
            }

            // Known standalone sections
            if (in_array($type, ['3d-falboritas', 'ives-butorok'], true)) {
                $items[] = [
                    'id' => $type,
                    'category_id' => $cat->id,
                    'label' => $label,
                    'route' => '/' . $type,
                    'section' => $type,
                    'order' => $cat->nav_order,
                ];
                continue;
            }

            // Fallback for any other top-level type
            $items[] = [
                'id' => $type,
                'category_id' => $cat->id,
                'label' => $label,
                'route' => '/' . $type,
                'section' => $type,
                'order' => $cat->nav_order,
            ];
        }

        // Always append static Kapcsolat item (fixed, not category-bound)
        $items[] = [
            'id' => 'kapcsolat',
            'label' => 'Kapcsolat',
            'route' => '/kapcsolat',
            'is_static' => true,
            'order' => 999,
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $items,
            ],
        ]);
    }
}
