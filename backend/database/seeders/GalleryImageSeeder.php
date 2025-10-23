<?php

namespace Database\Seeders;

use App\Models\GalleryItem;
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

        $this->processImages();
    }

    private function processImages()
    {
        $sourcePath = database_path('seeders/_sample/gallery');

        if (!File::exists($sourcePath)) {
            $this->command->error('Source image directory not found: ' . $sourcePath);
            return;
        }

        $allFiles = collect(File::files($sourcePath));

        if ($allFiles->isEmpty()) {
            $this->command->warn('No source images found in the gallery directory.');
            return;
        }

        $this->command->info("--- Found {$allFiles->count()} total images. Processing... ---");
        $progressBar = $this->command->getOutput()->createProgressBar($allFiles->count());
        $progressBar->start();

        foreach ($allFiles as $file) {
            $filename = $file->getFilename();
            $baseName = Str::lower($file->getFilenameWithoutExtension());
            
            $is_featured = str_starts_with($baseName, 'featured_');
            if ($is_featured) {
                $baseName = substr($baseName, 9); // "featured_" length
            }
            
            $category = $this->findCategoryByKeyword($baseName);

            // If no category can be determined, it's a utility file.
            if ($category === null) {
                // Copy to the root of the public gallery folder.
                $destination = Storage::disk('public')->path('gallery/' . $filename);
                File::copy($file->getPathname(), $destination);
            } else {
                // It's a content file, process and add to database.
                $title = Str::headline(str_replace(['(1)','(2)','(3)'], '', $baseName));
                $categorySlug = Str::slug($category);
                $titleSlug = Str::slug($title);
                $extension = $file->getExtension();
                
                $newFilename = "{$titleSlug}-" . time() . rand(10, 99) . ".{$extension}";
                $destinationDirectory = "gallery/{$categorySlug}";
                $newPath = "{$destinationDirectory}/{$newFilename}";

                Storage::disk('public')->makeDirectory($destinationDirectory);
                File::copy($file->getPathname(), Storage::disk('public')->path($newPath));

                GalleryItem::create([
                    'title' => $title,
                    'category' => $category,
                    'description' => "Automatikus leírás: {$title}",
                    'image_path' => $newPath,
                    'is_active' => true,
                    'is_featured' => $is_featured,
                ]);
            }
            
            $progressBar->advance();
        }

        $progressBar->finish();
        $this->command->info("\n--- Gallery processing complete! ---");
    }

    private function findCategoryByKeyword(string $filename): ?string
    {
        $keywordMap = [
            'konyha' => 'konyha', 'nappali' => 'nappali', 'furdoszoba' => 'furdoszoba',
            'haloszoba' => 'haloszoba', 'gardrob' => 'gardrob', 'lepcso' => 'lepcso',
            'iroda' => 'iroda-berendezes', 'uzlet' => 'uzlet-berendezes',
            'kiallitasibutorok' => 'kiallitasi-butorok', '3d' => '3d-falboritas',
            '3dfal' => '3d-falboritas', 'ivesbutorok' => 'ives-butorok', 'ives' => 'ives-butorok',
        ];

        foreach ($keywordMap as $keyword => $category) {
            if (str_starts_with($filename, $keyword)) {
                return $category;
            }
        }

        return null;
    }
}