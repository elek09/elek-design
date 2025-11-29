<?php

namespace Database\Seeders;

use App\Models\GalleryItem;
use App\Models\Product;
use App\Models\Subcategory;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // Alkategória slug -> termék adatok mapping
        $productsBySubcategory = [
            'konyha' => [
                'name' => 'Konyhabútor',
                'slug' => 'konyhabutor',
                'description' => 'Egyedi konyhabútor testreszabható vasalattal és színösszeállítással.',
                'options' => [
                    'hardware_types' => ['Alap', 'Prémium', 'Soft-close'],
                    'color_schemes' => ['Világos', 'Sötét', 'Két színű'],
                ],
            ],
            'haloszoba' => [
                'name' => 'Hálószoba bútor',
                'slug' => 'haloszoba-butor',
                'description' => 'Egyedi hálószoba bútorok, gardrób és ágykeret opciókkal.',
                'options' => [
                    'hardware_types' => ['Alap', 'Prémium'],
                    'color_schemes' => ['Natúr', 'Fehér', 'Dió', 'Tölgy'],
                ],
            ],
            'gardrob' => [
                'name' => 'Gardrób',
                'slug' => 'gardrob',
                'description' => 'Egyedi gardróbszekrények tolóajtóval vagy nyíló ajtóval.',
                'options' => [
                    'hardware_types' => ['Tolóajtó rendszer', 'Nyíló ajtó zsanér'],
                    'color_schemes' => ['Fehér', 'Fekete', 'Tölgy', 'Dió'],
                ],
            ],
            'nappali' => [
                'name' => 'Nappali bútor',
                'slug' => 'nappali-butor',
                'description' => 'Nappali bútor összeállítások, TV fal és tároló elemek.',
                'options' => [
                    'hardware_types' => ['Alap', 'Soft-close'],
                    'color_schemes' => ['Világos', 'Sötét', 'Fafurnér'],
                ],
            ],
        ];

        foreach ($productsBySubcategory as $subcategorySlug => $productData) {
            // Keressünk egy képet az alkategóriából
            $subcategory = Subcategory::where('slug', $subcategorySlug)->first();
            $primaryImageUrl = null;

            if ($subcategory) {
                $galleryItem = GalleryItem::where('subcategory_id', $subcategory->id)
                    ->where('is_active', true)
                    ->orderBy('is_featured', 'desc')
                    ->first();

                if ($galleryItem) {
                    $primaryImageUrl = '/storage/' . $galleryItem->image_path;
                }
            }

            Product::updateOrCreate(
                ['slug' => $productData['slug']],
                array_merge($productData, [
                    'primary_image_url' => $primaryImageUrl,
                    'price' => null,
                ])
            );
        }

        $this->command->info('✓ ' . count($productsBySubcategory) . ' termék létrehozva');
    }
}
