<?php

namespace App\Services;

use App\Models\Category;
use App\Models\GalleryItem;
use Illuminate\Support\Str;

class GalleryService
{
    /**
     * Canonical, section-based query builder for gallery listing.
     * - If $section is a main category type, include its direct items and all its subcategory ids.
     * - Otherwise, fall back to exact category match.
     */
    public function queryBySection(string $section)
    {
        [$typeToSection, $subToType] = $this->buildCategoryMaps();

        // Collect subcategory ids that belong to this section (if any)
        $subIds = [];
        foreach ($subToType as $subId => $parentType) {
            if ($parentType === $section) {
                $subIds[] = $subId;
            }
        }

        $q = $this->queryActive();
        if (isset($typeToSection[$section]) || count($subIds) > 0) {
            // Section is a known main type (or has subs) -> include own and subs
            return $q->where(function ($x) use ($section, $subIds) {
                $x->orWhere('category', $section);
                if (!empty($subIds)) {
                    $x->orWhereIn('category', $subIds);
                }
            });
        }

        // Fallback: exact match to a plain category value
        return $q->where('category', $section);
    }
    public function mapItem(GalleryItem $item): array
    {
        [$section, $subcategory] = $this->detectSectionAndSubcategory($item);
        $slug = $this->makeRootSlug($item->title);
        $order = $this->parseOrderFromTitleOrPath($item->title, $item->image_path);
        [$url, $thumbUrl] = $this->buildUrls($item->image_path);

        return [
            'id' => $item->id,
            'title' => $item->title,
            'slug' => $slug,
            'section' => $section,
            'subcategory' => $subcategory,
            'category' => $item->category,
            'url' => $url,
            'thumb_url' => $thumbUrl,
            'order' => $order,
            'is_featured' => (bool) $item->is_featured,
            'is_active' => (bool) $item->is_active,
        ];
    }

    public function queryActive()
    {
        return GalleryItem::query()->where('is_active', true);
    }

    private function makeRootSlug(string $title): string
    {
        $base = preg_replace('/\(\d+\)$/', '', $title);
        $base = Str::ascii($base);
        $base = strtolower($base);
        $base = preg_replace('/[^a-z0-9]+/', '', $base);
        return $base ?: 'item';
    }

    private function detectSectionAndSubcategory(GalleryItem $item): array
    {
        $category = (string) ($item->category ?? '');
        [$typeToSection, $subToType] = $this->buildCategoryMaps();

        if ($category !== '') {
            if (isset($typeToSection[$category])) {
                $section = $typeToSection[$category];
                return [$section, null];
            }
            if (isset($subToType[$category])) {
                $parentType = $subToType[$category];
                $section = $typeToSection[$parentType] ?? $parentType;
                return [$section, $category];
            }
        }

        // No fallback inference: if the category is not recognized, return nulls.
        return [null, null];
    }

    private function parseOrderFromTitleOrPath(?string $title, ?string $path): int
    {
        $title = (string) $title;
        // Title végén lévő (n) mint ábécésorrend segéd
        if (preg_match('/\((\d+)\)\s*$/', $title, $m)) {
            return (int) $m[1];
        }
        $file = strtolower(pathinfo((string) $path, PATHINFO_FILENAME));
        // Fájlnévben bárhol előforduló (n), pl. konyha(3)-1699999999.jpg
        if (preg_match('/\((\d+)\)/', $file, $m)) {
            return (int) $m[1];
        }
        return 0;
    }

    private function buildUrls(string $imagePath): array
    {
        $url = asset('storage/' . ltrim($imagePath, '/'));
        $thumb = $url;
        return [$url, $thumb];
    }

    private function buildCategoryMaps(): array
    {
        $typeToSection = [];
        $subToType = [];

        $cats = Category::all();
        foreach ($cats as $cat) {
            $type = (string) $cat->type;
            // Keep Hungarian identifiers in API output: section equals the stored type
            $typeToSection[$type] = $type;
            if (is_array($cat->subcategories)) {
                foreach ($cat->subcategories as $sub) {
                    if (!empty($sub['id'])) {
                        $subToType[(string) $sub['id']] = $type;
                    }
                }
            }
        }
        return [$typeToSection, $subToType];
    }
}
