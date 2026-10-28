<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\GalleryItem;
use App\Models\Subcategory;
use App\Services\GalleryImportService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GalleryImageSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('--- Galéria adatok és fájlok törlése ---');
        Storage::disk('public')->deleteDirectory('gallery');
        Storage::disk('public')->makeDirectory('gallery');
        DB::table('gallery_items')->truncate();

        $service = app(GalleryImportService::class);
        $this->processImages($service);
    }

    private function processImages(GalleryImportService $service): void
    {
        $sourcePath = database_path('seeders/_sample/gallery');

        if (!File::exists($sourcePath)) {
            $this->command->error('❌ Forrásmappa nem található: ' . $sourcePath);
            return;
        }

        $allFiles = collect($service->collect($sourcePath));

        if ($allFiles->isEmpty()) {
            $this->command->warn('⚠️  Nincs kép a galéria mappában.');
            return;
        }

        // Bejegyzések parse-olása a GalleryImportService által
        $entries = $service->parseEntries($allFiles->all());

        $this->command->info('--- ' . count($entries) . ' kép feldolgozása... ---' . PHP_EOL);

        $progressBar = $this->command->getOutput()->createProgressBar(count($entries));
        $progressBar->start();

        foreach ($entries as $entry) {
            $file = $entry->file;
            $legacyCategory = $entry->category;
            $title = $entry->title;
            $order = (int) $entry->order;
            $isFeatured = (bool) $entry->is_featured;

            $categorySlug = Str::slug($legacyCategory);
            $titleSlug = Str::slug($title);
            $extension = $file->getExtension();

            // Sorrend megőrzése a fájlnévben (runtime parsing miatt)
            $orderSuffix = $order > 0 ? '(' . $order . ')' : '';
            $newFilename = $titleSlug . $orderSuffix . '-' . time() . rand(10, 99) . '.' . $extension;
            $destinationDirectory = 'gallery/' . $categorySlug;
            $newPath = $destinationDirectory . '/' . $newFilename;

            Storage::disk('public')->makeDirectory($destinationDirectory);
            File::copy($file->getPathname(), Storage::disk('public')->path($newPath));

            // Kategória/alkategória ID feloldása
            $subcategory = Subcategory::where('slug', $legacyCategory)->first();
            $categoryId = null;
            $subcategoryId = null;

            if ($subcategory) {
                $categoryId = $subcategory->category_id;
                $subcategoryId = $subcategory->id;
            } else {
                $categoryModel = Category::where('type', $legacyCategory)->first();
                $categoryId = $categoryModel?->id;
            }

            GalleryItem::create([
                'title' => $title,
                'category_id' => $categoryId,
                'subcategory_id' => $subcategoryId,
                'description' => 'Automatikus leírás: ' . $title,
                'image_path' => $newPath,
                'is_active' => true,
                'is_featured' => $isFeatured,
            ]);

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->command->info(PHP_EOL . '✓ Galéria feldolgozás kész! ' . count($entries) . ' kép importálva.');
    }
}