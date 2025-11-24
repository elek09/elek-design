<?php

namespace App\Services;

use App\Models\Category;
use App\Models\GalleryItem;
use Illuminate\Support\Str;

class GalleryService
{
    public function mapItem(GalleryItem $item): array
    {
        $order = $this->parseOrderFromTitleOrPath($item->title, $item->image_path);
        [$url, $thumbUrl] = $this->buildUrls($item->image_path);

        return [
            'id' => $item->id,
            'title' => $item->title,
            'category' => $item->category ? [
                'id' => $item->category->id,
                'type' => $item->category->type,
                'name' => $item->category->name,
            ] : null,
            'subcategory' => $item->subcategory ? [
                'id' => $item->subcategory->id,
                'slug' => $item->subcategory->slug,
                'name' => $item->subcategory->name,
            ] : null,
            'description' => $item->description,
            'url' => $url,
            'thumb_url' => $thumbUrl,
            'order' => $order,
            'is_featured' => (bool) $item->is_featured,
            'is_active' => (bool) $item->is_active,
        ];
    }

    public function queryActive()
    {
        return GalleryItem::query()->where('is_active', true)->with(['category','subcategory']);
    }

    /**
     * Build a query for a given section identifier (top-level category type or subcategory slug).
     * Falls back to empty result if no match.
     */
    public function queryBySection(string $section)
    {
        $section = trim($section);
        if ($section === '') {
            return GalleryItem::query()->whereRaw('1=0');
        }

        // Try top-level category by type
        $category = Category::where('type', $section)->first();
        if ($category) {
            return GalleryItem::query()
                ->where('is_active', true)
                ->where('category_id', $category->id)
                ->with(['category','subcategory'])
                ->orderByRaw('COALESCE((SELECT nav_order FROM category_subcategories WHERE category_subcategories.id = gallery_items.subcategory_id), 100000) ASC')
                ->orderByDesc('created_at');
        }

        // Try subcategory by slug
        $subcategory = \App\Models\Subcategory::where('slug', $section)->first();
        if ($subcategory) {
            return GalleryItem::query()
                ->where('is_active', true)
                ->where('subcategory_id', $subcategory->id)
                ->with(['category','subcategory'])
                ->orderByDesc('created_at');
        }

        // No match -> empty
        return GalleryItem::query()->whereRaw('1=0');
    }

    /**
     * Map a collection of GalleryItem models using mapItem.
     * @param \Illuminate\Support\Collection<int,GalleryItem> $collection
     * @return array<int,array<string,mixed>>
     */
    public function mapItemCollection($collection): array
    {
        return $collection->map(fn($item) => $this->mapItem($item))->values()->all();
    }

    // Title-based slug not returned anymore; keep helper removed for clarity


    private function parseOrderFromTitleOrPath(?string $title, ?string $path): int
    {
        $title = (string) $title;
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

    // Legacy mapping helpers removed after normalization
}
