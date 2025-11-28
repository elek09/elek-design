<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    /**
     * Seed the application's products for webshop basics.
     */
    public function run(): void
    {
        $products = [
            [
                'name' => 'Konyhabútor',
                'slug' => 'konyhabutor',
                'description' => 'Egyedi konyhabútor testreszabható vasalattal és színösszeállítással.',
                'price' => null,
                'options' => [
                    'hardware_types' => ['Alap', 'Prémium', 'Soft-close'],
                    'color_schemes' => ['Világos', 'Sötét', 'Két színű'],
                ],
            ],
            [
                'name' => 'Hálószoba bútor',
                'slug' => 'haloszoba-butor',
                'description' => 'Egyedi hálószoba bútorok, gardrób és ágykeret opciókkal.',
                'price' => null,
                'options' => [
                    'hardware_types' => ['Alap', 'Prémium'],
                    'color_schemes' => ['Natúr', 'Fehér', 'Dió', 'Tölgy'],
                ],
            ],
            [
                'name' => 'Gardrób',
                'slug' => 'gardrob',
                'description' => 'Egyedi gardróbszekrények tolóajtóval vagy nyíló ajtóval.',
                'price' => null,
                'options' => [
                    'hardware_types' => ['Tolóajtó rendszer', 'Nyíló ajtó zsanér'],
                    'color_schemes' => ['Fehér', 'Fekete', 'Tölgy', 'Dió'],
                ],
            ],
            [
                'name' => 'Nappali bútor',
                'slug' => 'nappali-butor',
                'description' => 'Nappali bútor összeállítások, TV fal és tároló elemek.',
                'price' => null,
                'options' => [
                    'hardware_types' => ['Alap', 'Soft-close'],
                    'color_schemes' => ['Világos', 'Sötét', 'Fafurnér'],
                ],
            ],
        ];

        foreach ($products as $p) {
            Product::updateOrCreate(
                ['slug' => $p['slug']],
                $p
            );
        }
    }
}
