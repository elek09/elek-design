<?php

namespace Database\Seeders;

use App\Models\GalleryItem;
use App\Services\GalleryImportService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GalleryImageSeeder extends Seeder
{
    public function run()
    {
        $this->command->info('--- Wiping old gallery data and files ---');
        Storage::disk('public')->deleteDirectory('gallery');
        Storage::disk('public')->makeDirectory('gallery');
        DB::table('gallery_items')->truncate();

        $service = app(GalleryImportService::class);
        $this->processImages($service);
    }

    private function processImages(GalleryImportService $service)
    {
        $sourcePath = database_path('seeders/_sample/gallery');

        if (!File::exists($sourcePath)) {
            $this->command->error('Source image directory not found: ' . $sourcePath);
            return;
        }

        $allFiles = collect($service->collect($sourcePath));

        if ($allFiles->isEmpty()) {
            $this->command->warn('No source images found in the gallery directory.');
            return;
        }

    // 1) Parse entries (NO DEDUPE — every file in the folder is unique by input contract)
    $entries = $service->parseEntries($allFiles->all());

    $this->command->info('--- Found ' . count($entries) . ' images. Copying & seeding... ---' . PHP_EOL);

        // 2) Physical copy and DB insertion from the deduplicated list
        $progressBar = $this->command->getOutput()->createProgressBar(count($entries));
        $progressBar->start();

        foreach ($entries as $entry) {
            /** @var \App\Support\Gallery\ImportEntry $entry */
            $file = $entry->file;
            $legacyCategory = $entry->category; // slug or subcategory slug
            $title = $entry->title;
            $order = (int) $entry->order;
            $is_featured = (bool) $entry->is_featured;

            $categorySlug = Str::slug($legacyCategory);
            $titleSlug = Str::slug($title);
            $extension = $file->getExtension();

            // Preserve the order number in the filename so the runtime parser can pick it up
            $orderSuffix = $order > 0 ? '(' . $order . ')' : '';
            $newFilename = $titleSlug . $orderSuffix . '-' . time() . rand(10, 99) . '.' . $extension;
            $destinationDirectory = 'gallery/' . $categorySlug;
            $newPath = $destinationDirectory . '/' . $newFilename;

            Storage::disk('public')->makeDirectory($destinationDirectory);
            File::copy($file->getPathname(), Storage::disk('public')->path($newPath));

            // Resolve normalized category / subcategory IDs
            $subcategory = \App\Models\Subcategory::where('slug', $legacyCategory)->first();
            $categoryModel = null;
            if (!$subcategory) {
                $categoryModel = \App\Models\Category::where('type', $legacyCategory)->first();
            }

            GalleryItem::create([
                'title' => $title,
                'category_id' => $subcategory ? $subcategory->category_id : ($categoryModel?->id),
                'subcategory_id' => $subcategory?->id,
                'description' => 'Automatikus leírás: ' . $title,
                'image_path' => $newPath,
                'is_active' => true,
                'is_featured' => $is_featured,
            ]);

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->command->info(PHP_EOL . '--- Gallery processing complete! ---');
    }
}