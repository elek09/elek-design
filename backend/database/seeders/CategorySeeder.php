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
                    ['id' => 'konyha', 'name' => 'Konyha', 'nav_order' => 1],
                    ['id' => 'nappali', 'name' => 'Nappali', 'nav_order' => 2],
                    ['id' => 'furdoszoba', 'name' => 'Fürdőszoba', 'nav_order' => 3],
                    ['id' => 'haloszoba', 'name' => 'Hálószoba', 'nav_order' => 4],
                    ['id' => 'gardrob', 'name' => 'Gardrób', 'nav_order' => 5],
                    ['id' => 'lepcso', 'name' => 'Lépcső', 'nav_order' => 6],
                ]
            ],
            [
                'name' => 'Üzlettér',
                'type' => 'uzletter',
                'nav_order' => 2,
                'subcategories' => [
                    ['id' => 'iroda-berendezes', 'name' => 'Iroda Berendezés', 'nav_order' => 1],
                    ['id' => 'uzlet-berendezes', 'name' => 'Üzlet Berendezés', 'nav_order' => 2],
                    ['id' => 'kiallitasi-butorok', 'name' => 'Kiállítási Bútorok', 'nav_order' => 3],
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
            Category::updateOrCreate(
                ['type' => $categoryData['type']],
                $categoryData
            );
        }
    }
}