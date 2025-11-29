<?php

namespace App\Services;

use App\Support\ImportEntry;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class GalleryImportService
{
    // Fájlok gyűjtése forrás könyvtárból
    public function collect(string $sourcePath): array
    {
        if (!File::exists($sourcePath)) {
            return [];
        }
        return File::files($sourcePath);
    }

    /**
     * Fájlok elemzése és ImportEntry objektumok létrehozása
     * - featured_ prefix → kiemelt kép
     * - (n) suffix → sorrend szám
     * - Fájlnév alapján kategória meghatározás config-ból
     */
    public function parseEntries(array $files): array
    {
        $entries = [];
        
        foreach ($files as $file) {
            $baseName = Str::lower($file->getFilenameWithoutExtension());

            // Featured prefix detektálás és levágás
            $isFeatured = str_starts_with($baseName, 'featured_');
            if ($isFeatured) {
                $baseName = substr($baseName, 9);
            }

            // Sorrend szám kinyerése: pl. konyha(3).jpg → 3
            $order = 0;
            if (preg_match('/\((\d+)\)/', $baseName, $matches)) {
                $order = (int) $matches[1];
            }

            // Kategória meghatározás fájlnévből
            $category = $this->resolveCategoryFromFilenameBase($baseName) ?? 'egyeb';
            
            // Cím készítés: konyha(3) → Konyha
            $title = Str::headline(preg_replace('/\(\d+\)/', '', $baseName));

            $entries[] = new ImportEntry($file, $category, $title, $order, $isFeatured);
        }
        
        return $entries;
    }

    /**
     * Duplikátumok szűrése kategória+cím alapján
     * Featured változat elsőbbséget élvez
     */
    public function dedupe(array $entries): array
    {
        $result = [];
        
        foreach ($entries as $entry) {
            $key = $entry->key();
            
            if (!isset($result[$key])) {
                $result[$key] = $entry;
                continue;
            }
            
            // Featured változat felülírja a sima verziót
            if ($entry->is_featured && !$result[$key]->is_featured) {
                $result[$key] = $entry;
            }
        }
        
        return array_values($result);
    }

    // Kategória meghatározás fájlnév alapján config-ból
    private function resolveCategoryFromFilenameBase(string $filename): ?string
    {
        $map = (array) config('gallery.keyword_category_map', []);
        
        foreach ($map as $keyword => $category) {
            if (str_starts_with($filename, $keyword)) {
                return $category;
            }
        }
        
        return null;
    }
}
