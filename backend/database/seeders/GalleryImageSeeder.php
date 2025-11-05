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

        // 2) Fizikai másolás és DB beszúrás a deduplikált listából
        $progressBar = $this->command->getOutput()->createProgressBar(count($entries));
        $progressBar->start();

        foreach ($entries as $entry) {
            /** @var \App\Support\Gallery\ImportEntry $entry */
            $file = $entry->file;
            $category = $entry->category;
            $title = $entry->title;
            $order = (int) $entry->order;
            $is_featured = (bool) $entry->is_featured;

            $categorySlug = Str::slug($category);
            $titleSlug = Str::slug($title);
            $extension = $file->getExtension();

            // Őrizzük meg az rendelési számot a fájlnévben, hogy a runtime parser fel tudja venni
            $orderSuffix = $order > 0 ? '(' . $order . ')' : '';
            $newFilename = $titleSlug . $orderSuffix . '-' . time() . rand(10, 99) . '.' . $extension;
            $destinationDirectory = 'gallery/' . $categorySlug;
            $newPath = $destinationDirectory . '/' . $newFilename;

            Storage::disk('public')->makeDirectory($destinationDirectory);
            File::copy($file->getPathname(), Storage::disk('public')->path($newPath));

            GalleryItem::create([
                'title' => $title,
                'category' => $category,
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

    // Keyword mapping now lives in config/gallery.php and is used by GalleryImportService
}