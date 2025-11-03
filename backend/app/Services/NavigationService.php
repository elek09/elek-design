<?php

namespace App\Services;

use App\Models\Category;

class NavigationService
{
    /**
     * Build header navigation items from categories.
     * Returns a simple array as expected by the frontend.
     */
    public function buildHeaderItems(): array
    {
        $categories = Category::orderByRaw('CASE WHEN nav_order IS NULL THEN 1 ELSE 0 END')
            ->orderBy('nav_order')
            ->orderBy('name')
            ->get();

        $items = [];

        // Logo first
        $items[] = [
            'id' => 'logo',
            'label' => 'Logo',
            'route' => '/',
            'is_logo' => true,
            'image_url' => asset('images/elek-design-logo.jpg'),
            'order' => 0,
        ];

        foreach ($categories as $cat) {
            $type = (string) $cat->type;   // Hungarian identifier, pl. 'eletter'
            $label = (string) $cat->name;  // Megjelenített címke, pl. 'Élettér'
            $hasSubs = is_array($cat->subcategories) && count($cat->subcategories) > 0;

            // Ha vannak alkategóriák, maradjon a főoldali szekció (fragment)
            if ($hasSubs) {
                $items[] = [
                    'id' => $type,
                    'category_id' => $cat->id,
                    'label' => $label,
                    'route' => '/',
                    'fragment' => $label, // a frontend horgonyhoz használja
                    'section' => $type,
                    'order' => $cat->nav_order,
                ];
                continue;
            }

            // Egyébként normál, magyar útvonal
            $items[] = [
                'id' => $type,
                'category_id' => $cat->id,
                'label' => $label,
                'route' => '/' . $type,
                'section' => $type,
                'order' => $cat->nav_order,
            ];
        }

        // Kapcsolat last
        $items[] = [
            'id' => 'kapcsolat',
            'label' => 'Kapcsolat',
            'route' => '/kapcsolat',
            'is_static' => true,
            'order' => 999,
        ];

        return $items;
    }
}
