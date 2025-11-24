<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
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
            $subs = $categoryData['subcategories'] ?? [];
            $record = Category::updateOrCreate(
                ['type' => $categoryData['type']],
                [
                    'name' => $categoryData['name'],
                    'type' => $categoryData['type'],
                    'nav_order' => $categoryData['nav_order'],
                ]
            );

            // Create normalized subcategory rows
            foreach ($subs as $s) {
                \App\Models\Subcategory::updateOrCreate(
                    ['slug' => $s['slug']],
                    [
                        'category_id' => $record->id,
                        'name' => $s['name'] ?? $s['slug'],
                        'nav_order' => $s['nav_order'] ?? null,
                    ]
                );
            }
        }
    }
}