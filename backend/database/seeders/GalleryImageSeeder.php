<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Http\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\GalleryItem;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

class GalleryImageSeeder extends Seeder
{
    public function run(): void
    {
        $src = base_path('database/seeders/_sample/gallery');
        if (!is_dir($src)) {
            $this->command->warn("Missing: $src");
            return;
        }

        $allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG', 'WEBP', 'ico', 'ICO'];
        $uiKeepOriginal = ['hamburger.png', 'left.png', 'right.png', 'elekdesign_logo.jpg', 'designicon.ico'];

        $it = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($src, \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($it as $fi) {
            if (!$fi->isFile())
                continue;

            $basename = $fi->getFilename();
            $ext = $fi->getExtension();
            if (!in_array($ext, $allowedExt, true))
                continue;

            $fullpath = $fi->getPathname();
            $parent = basename($fi->getPath());

            // Kategória a mappa szerint
            $category = match (Str::lower($parent)) {
                'fokepek' => 'featured',
                'kepek' => 'work',
                default => 'misc',
            };

            // UI fájlok változatlan névvel, külön kategóriába
            if (in_array($basename, $uiKeepOriginal, true)) {
                $target = 'gallery/ui/' . $basename;
                // ha már megvan, ne duplázzuk
                if (!Storage::disk('public')->exists($target)) {
                    Storage::disk('public')->putFileAs('gallery/ui', new File($fullpath), $basename);
                }
                GalleryItem::updateOrCreate(
                    ['image_path' => $target],
                    ['title' => pathinfo($basename, PATHINFO_FILENAME), 'category' => 'ui', 'active' => true]
                );
                $this->command->info("UI: $target");
                continue;
            }

            // --- Fotók: egyszerű alapnév + (index) ---
            $nameNoExt = pathinfo($basename, PATHINFO_FILENAME);

            // ha a végén (n) van, vedd le a sorszámot az "alap" meghatározásához
            $base = preg_replace('/\(\d+\)$/', '', $nameNoExt);

            // normalizáld: ascii, kisbetű, csak a-z0-9 és zárójel marad
            $base = Str::ascii($base);
            $base = strtolower($base);
            $base = preg_replace('/[^a-z0-9\(\)]+/', '', $base);
            $base = trim($base);
            if ($base === '')
                $base = 'kep';

            // találj szabad nevet: base.ext, base(1).ext, base(2).ext...
            $finalName = $this->nextFreeName($base, $ext, $category);

            $targetDir = "gallery/{$category}";
            $storedPath = $targetDir . '/' . $finalName;

            if (!Storage::disk('public')->exists($storedPath)) {
                Storage::disk('public')->putFileAs($targetDir, new File($fullpath), $finalName);
            }

            GalleryItem::updateOrCreate(
                ['image_path' => $storedPath],
                ['title' => $nameNoExt, 'category' => $category, 'active' => true]
            );

            $this->command->info("OK: $storedPath");
        }

        $this->command->info('Gallery seeding finished.');
    }

    private function nextFreeName(string $base, string $ext, string $category): string
    {
        $ext = ltrim($ext, '.');
        $targetDir = "gallery/{$category}";

        // első próbálkozás: "base.ext"
        $candidate = "{$base}.{$ext}";
        $i = 1;

        while (Storage::disk('public')->exists($targetDir . '/' . $candidate)) {
            $candidate = "{$base}({$i}).{$ext}";
            $i++;
        }

        return $candidate;
    }
}
