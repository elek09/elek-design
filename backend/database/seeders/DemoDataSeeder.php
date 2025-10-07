<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use App\Models\Product;
use App\Models\GalleryItem;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // pár termék
        foreach ([
            ['name' => 'Próba Termék 1', 'price' => 1990],
            ['name' => 'Próba Termék 2', 'price' => 3490],
            ['name' => 'Próba Termék 3', 'price' => null],
        ] as $p) {
            Product::updateOrCreate(
                ['slug' => Str::slug($p['name'])],
                ['name' => $p['name'], 'description' => 'Demo leírás', 'price' => $p['price'], 'active' => true]
            );
        }

        // Mintaképek bemásolása a public storage alá és rekordok létrehozása
        $sourceDir = database_path('seeders/_sample/gallery');
        if (File::isDirectory($sourceDir)) {
            // Biztosítsuk, hogy a cél mappa létezik a public diszken
            if (!Storage::disk('public')->exists('gallery')) {
                Storage::disk('public')->makeDirectory('gallery');
            }

            $files = collect(File::files($sourceDir))
                ->filter(fn($f) => in_array(strtolower($f->getExtension()), ['jpg', 'jpeg', 'png', 'webp']))
                ->values();

            foreach ($files as $file) {
                $filename = $file->getFilename();
                $targetPath = 'gallery/' . $filename;

                // Másolás a storage/public alá, ha még nincs ott
                if (!Storage::disk('public')->exists($targetPath)) {
                    Storage::disk('public')->put($targetPath, File::get($file->getPathname()));
                }

                // Cím a fájlnévből
                $title = Str::of($filename)->beforeLast('.')
                    ->replace(['-', '_'], ' ')
                    ->title();

                GalleryItem::updateOrCreate(
                    ['title' => $title],
                    [
                        'category' => 'demo',
                        'description' => 'Minta kép',
                        'image_path' => $targetPath,
                        'active' => true,
                    ]
                );
            }
        } else {
            // fallback egy darab demo rekordra (ha nincs mappa)
            GalleryItem::updateOrCreate(
                ['title' => 'Mintakép'],
                ['category' => 'demo', 'description' => 'Minta', 'image_path' => 'gallery/demo.jpg', 'active' => true]
            );
        }
    }
}
