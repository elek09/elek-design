<?php

namespace App\Services;

use App\Models\Category;
use App\Models\GalleryItem;
use App\Models\Subcategory;
use Illuminate\Support\Str;

class GalleryService
{
    // GalleryItem -> frontend formátum konverzió
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
        return GalleryItem::active()->with(['category', 'subcategory']);
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
                ->orderByDesc('created_at');
        }

        // Alkategória keresés slug alapján
        $subcategory = Subcategory::where('slug', $section)->first();
        if ($subcategory) {
            return GalleryItem::active()
                ->where('subcategory_id', $subcategory->id)
                ->with(['category', 'subcategory'])
                ->orderByDesc('created_at');
        }

        // Nincs találat
        return GalleryItem::query()->whereRaw('1=0');
    }

    // Sorrend szám kinyerése címből vagy fájlnévből: pl. "Konyha (3)" vagy "konyha(3)-timestamp.jpg" → 3
    private function parseOrderFromTitleOrPath(?string $title, ?string $path): int
    {
        $title = (string) $title;
        if (preg_match('/\((\d+)\)\s*$/', $title, $matches)) {
            return (int) $matches[1];
        }
        
        $filename = strtolower(pathinfo((string) $path, PATHINFO_FILENAME));
        if (preg_match('/\((\d+)\)/', $filename, $matches)) {
            return (int) $matches[1];
        }
        
        return 0;
    }

    // Kép URL-ek generálása (jelenleg thumb = teljes méret)
    private function buildUrls(string $imagePath): array
    {
        $url = asset('storage/' . ltrim($imagePath, '/'));
        $thumb = $url; // TODO: később thumbnail generálás
        return [$url, $thumb];
    }
}
