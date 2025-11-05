<?php

namespace App\Services;

use App\Support\Gallery\ImportEntry;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class GalleryImportService
{
    /**
     * Collect files from a source directory.
     * @return \Symfony\Component\Finder\SplFileInfo[]
     */
    public function collect(string $sourcePath): array
    {
        if (!File::exists($sourcePath)) {
            return [];
        }
        return File::files($sourcePath);
    }

    /**
     * Build ImportEntry list from files.
     * - Detect featured prefix
     * - Infer category from keyword map
     * - Extract order from (n) suffix inside the base filename
     * - Title is humanized from base name (without (n))
     *
     * @param \Symfony\Component\Finder\SplFileInfo[] $files
     * @return ImportEntry[]
     */
    public function parseEntries(array $files): array
    {
        $entries = [];
        foreach ($files as $file) {
            $base = Str::lower($file->getFilenameWithoutExtension());

            $is_featured = str_starts_with($base, 'featured_');
            if ($is_featured) {
                $base = substr($base, 9);
            }

            $order = 0;
            if (preg_match('/\((\d+)\)/', $base, $m)) {
                $order = (int) $m[1];
            }

            $category = $this->resolveCategoryFromFilenameBase($base) ?? 'egyeb';
            $title = Str::headline(preg_replace('/\(\d+\)/', '', $base));

            $entries[] = new ImportEntry($file, $category, $title, $order, $is_featured);
        }
        return $entries;
    }

    /**
     * Dedupe entries by category+title; prefer featured variant.
     * @param ImportEntry[] $entries
     * @return ImportEntry[]
     */
    public function dedupe(array $entries): array
    {
        $result = [];
        foreach ($entries as $e) {
            $key = $e->key();
            if (!isset($result[$key])) {
                $result[$key] = $e;
                continue;
            }
            if ($e->is_featured && !$result[$key]->is_featured) {
                $result[$key] = $e;
            }
        }
        return array_values($result);
    }

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
