<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Subcategory;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Élettér',
                'type' => 'eletter',
                'nav_order' => 1,
                'subcategories' => [
                    ['slug' => 'konyha', 'name' => 'Konyha', 'nav_order' => 1],
                    ['slug' => 'nappali', 'name' => 'Nappali', 'nav_order' => 2],
                    ['slug' => 'furdoszoba', 'name' => 'Fürdőszoba', 'nav_order' => 3],
                    ['slug' => 'haloszoba', 'name' => 'Hálószoba', 'nav_order' => 4],
                    ['slug' => 'gardrob', 'name' => 'Gardrób', 'nav_order' => 5],
                    ['slug' => 'lepcso', 'name' => 'Lépcső', 'nav_order' => 6],
                ]
            ],
            [
                'name' => 'Üzlettér',
                'type' => 'uzletter',
                'nav_order' => 2,
                'subcategories' => [
                    ['slug' => 'iroda-berendezes', 'name' => 'Iroda Berendezés', 'nav_order' => 1],
                    ['slug' => 'uzlet-berendezes', 'name' => 'Üzlet Berendezés', 'nav_order' => 2],
                    ['slug' => 'kiallitasi-butorok', 'name' => 'Kiállítási Bútorok', 'nav_order' => 3],
                ]
            ],
            [
                'name' => '3D Falborítás',
                'type' => '3d-falboritas',
                'nav_order' => 3,
                'subcategories' => []
            ],
            [
                'name' => 'Íves Bútorok',
                'type' => 'ives-butorok',
                'nav_order' => 4,
                'subcategories' => []
            ],
        ];

        foreach ($categories as $categoryData) {
            $category = Category::updateOrCreate(
                ['type' => $categoryData['type']],
                [
                    'name' => $categoryData['name'],
                    'nav_order' => $categoryData['nav_order'],
                ]
            );

            foreach ($categoryData['subcategories'] as $sub) {
                Subcategory::updateOrCreate(
                    ['slug' => $sub['slug']],
                    [
                        'category_id' => $category->id,
                        'name' => $sub['name'],
                        'nav_order' => $sub['nav_order'],
                    ]
                );
            }
        }

        $this->command->info('✓ ' . count($categories) . ' kategória és alkategóriák létrehozva');
    }
}