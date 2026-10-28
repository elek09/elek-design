<?php

namespace App\Services;

use App\Models\Category;

class NavigationService
{
    /**
     * Header navigációs menü összeállítása kategóriákból
     * Logo + kategóriák + kapcsolat linkek generálása
     */
    public function buildHeaderItems(): array
    {
        $categories = Category::navOrdered()->with('subcategories')->get();

        $items = [];

        // Logo első elem
        $items[] = [
            'id' => 'logo',
            'label' => 'Logo',
            'route' => '/',
            'is_logo' => true,
            'image_url' => asset('images/elek-design-logo.jpg'),
            'order' => 0,
        ];

        foreach ($categories as $category) {
            $type = (string) $category->type;
            $label = (string) $category->name;
            $hasSubcategories = $category->subcategories->count() > 0;

            // Ha vannak alkategóriák → főoldali szekció fragment (scroll anchor) hoz (pl. #eletter)
            if ($hasSubcategories) {
                $items[] = [
                    'id' => $type,
                    'category_id' => $category->id,
                    'label' => $label,
                    'route' => '/',
                    'fragment' => $label,
                    'section' => $type,
                    'order' => $category->nav_order,
                ];
                continue;
            }

            // Ha nincs alkategória → dedikált route (pl. /3d-fal)
            $items[] = [
                'id' => $type,
                'category_id' => $category->id,
                'label' => $label,
                'route' => '/' . $type,
                'section' => $type,
                'order' => $category->nav_order,
            ];
        }

        // Kapcsolat utolsó elem
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
