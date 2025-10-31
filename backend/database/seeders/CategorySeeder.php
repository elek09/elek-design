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
                    ['id' => 'konyha', 'name' => 'Konyha'],
                    ['id' => 'nappali', 'name' => 'Nappali'],
                    ['id' => 'furdoszoba', 'name' => 'Fürdőszoba'],
                    ['id' => 'haloszoba', 'name' => 'Hálószoba'],
                    ['id' => 'gardrob', 'name' => 'Gardrób'],
                    ['id' => 'lepcso', 'name' => 'Lépcső'],
                ]
            ],
            [
                'name' => 'Üzlettér',
                'type' => 'uzletter',
                'nav_order' => 2,
                'subcategories' => [
                    ['id' => 'iroda-berendezes', 'name' => 'Iroda Berendezés'],
                    ['id' => 'uzlet-berendezes', 'name' => 'Üzlet Berendezés'],
                    ['id' => 'kiallitasi-butorok', 'name' => 'Kiállítási Bútorok'],
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