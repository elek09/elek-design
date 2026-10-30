<?php

namespace App\Services;

use App\Models\Category;
use App\Models\GalleryItem;
use App\Models\Subcategory;

class GalleryService
{
    // GalleryItem -> frontend formátum konverzió
    public function mapItem(GalleryItem $item): array
    {
        [$url, $thumbUrl] = $this->buildUrls($item->image_path, $item->thumb_path);

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
            'order' => $item->sort_order,
            'sort_order' => $item->sort_order,
            'is_featured' => (bool) $item->is_featured,
            'is_active' => (bool) $item->is_active,
        ];
    }

    public function queryActive()
    {
        return GalleryItem::active()
            ->with(['category', 'subcategory'])
            ->orderBy('sort_order')
            ->latest('created_at');
    }

    /**
     * Galéria elemek szekció alapján (főkategória type vagy alkategória slug)
     * Ha nincs találat, üres query-t ad vissza
     */
    public function queryBySection(string $section)
    {
        $section = trim($section);
        if ($section === '') {
            return GalleryItem::query()->whereRaw('1=0');
        }

        // Főkategória keresés type alapján
        $category = Category::where('type', $section)->first();
        if ($category) {
            return GalleryItem::active()
                ->where('category_id', $category->id)
                ->with(['category', 'subcategory'])
                ->orderByRaw('COALESCE((SELECT nav_order FROM category_subcategories WHERE category_subcategories.id = gallery_items.subcategory_id), 100000) ASC')
                ->orderBy('sort_order')
                ->orderByDesc('created_at');
        }

        // Alkategória keresés slug alapján
        $subcategory = Subcategory::where('slug', $section)->first();
        if ($subcategory) {
            return GalleryItem::active()
                ->where('subcategory_id', $subcategory->id)
                ->with(['category', 'subcategory'])
                ->orderBy('sort_order')
                ->orderByDesc('created_at');
        }

        // Nincs találat
        return GalleryItem::query()->whereRaw('1=0');
    }

    // Kép URL-ek generálása (jelenleg thumb = teljes méret)
    private function buildUrls(string $imagePath, ?string $thumbPath = null): array
    {
        $url = asset('storage/'.ltrim($imagePath, '/'));
        $thumb = asset('storage/'.ltrim($thumbPath ?: $imagePath, '/'));

        return [$url, $thumb];
    }
}
