<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\GalleryItem;
use Illuminate\Support\Str;
use App\Models\Category;

class GalleryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = GalleryItem::query()->where('is_active', true);
        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }
        return $this->paginateAndMap($query, 24);
    }

    // --- Custom endpoints ---

    public function top(Request $request)
    {
        $query = GalleryItem::query()->where('is_active', true)->where('is_featured', true);
        return $this->paginateAndMap($query, 24);
    }

    public function eletter(Request $request)
    {
        // Items whose category equals the main type 'eletter' OR any of its subcategory ids
        [$typeToSection, $subToType] = $this->buildCategoryMaps();
        $subIds = array_keys(array_filter($subToType, fn($t) => $t === 'eletter'));
        $query = GalleryItem::query()->where('is_active', true)
            ->where(function ($q) use ($subIds) {
                $q->where('category', 'eletter')
                  ->orWhereIn('category', $subIds);
            });
        return $this->paginateAndMap($query, 24);
    }

    public function uzletter(Request $request)
    {
        [$typeToSection, $subToType] = $this->buildCategoryMaps();
        $subIds = array_keys(array_filter($subToType, fn($t) => $t === 'uzletter'));
        $query = GalleryItem::query()->where('is_active', true)
            ->where(function ($q) use ($subIds) {
                $q->where('category', 'uzletter')
                  ->orWhereIn('category', $subIds);
            });
        return $this->paginateAndMap($query, 24);
    }

    public function wallCladding(Request $request)
    {
        // Map Hungarian type '3d-falboritas' to section 'wall-cladding'
        $query = GalleryItem::query()->where('is_active', true)
            ->where('category', '3d-falboritas');
        return $this->paginateAndMap($query, 24);
    }

    public function curvedFurniture(Request $request)
    {
        // Map Hungarian type 'ives-butorok' to section 'curved-furniture'
        $query = GalleryItem::query()->where('is_active', true)
            ->where('category', 'ives-butorok');
        return $this->paginateAndMap($query, 24);
    }

    private function paginateAndMap($query, int $perPage = 24)
    {
        return $query->latest()->paginate($perPage)->through(function ($item) {
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
                'is_featured' => $item->is_featured,
                'is_active' => $item->is_active,
            ];
        });
    }

    /** Build a stable ASCII root slug from title (e.g., "Fürdőszoba(2)" -> "furdoszoba"). */
    private function makeRootSlug(string $title): string
    {
        // remove trailing (n)
        $base = preg_replace('/\(\d+\)$/', '', $title);
        // to ascii, lowercase, keep only a-z0-9
        $base = Str::ascii($base);
        $base = strtolower($base);
        $base = preg_replace('/[^a-z0-9]+/', '', $base);
        return $base ?: 'item';
    }

    /** Infer section and subcategory primarily from the item's category using DB categories; fallback to keywords. */
    private function detectSectionAndSubcategory(GalleryItem $item): array
    {
        $category = (string) ($item->category ?? '');
        [$typeToSection, $subToType] = $this->buildCategoryMaps();

        if ($category !== '') {
            // If category matches a main type
            if (isset($typeToSection[$category])) {
                $section = $typeToSection[$category];
                $sub = null;
                return [$section, $sub];
            }
            // If category matches a subcategory id, resolve its parent type, then map to section
            if (isset($subToType[$category])) {
                $parentType = $subToType[$category];
                $section = $typeToSection[$parentType] ?? $parentType;
                return [$section, $category];
            }
        }

        // Fallback: derive from title/path keywords
        $hay = strtolower(($item->title ?? '') . ' ' . ($item->image_path ?? ''));
        $in = fn(array $needles) => collect($needles)->first(fn($n) => str_contains($hay, $n));

        if ($hit = $in(['nappali', 'konyha', 'furdoszoba', 'haloszoba', 'gardrob', 'lepcso'])) {
            return ['eletter', $this->normalizeKey($hit)];
        }
        if ($hit = $in(['iroda', 'uzlet', 'kiallitas'])) {
            return ['uzletter', $this->normalizeKey($hit)];
        }
        if ($hit = $in(['3dfal', '3d', 'fal'])) {
            $sub = str_contains($hay, '3dfal') ? '3dfal' : $this->normalizeKey($hit);
            return ['wall-cladding', $sub];
        }
        if ($hit = $in(['ivesbutorok', 'ives'])) {
            return ['curved-furniture', 'ivesbutorok'];
        }
        return ['unknown', null];
    }

    private function normalizeKey(string $s): string
    {
        $s = Str::ascii($s);
        $s = strtolower($s);
        $s = preg_replace('/[^a-z0-9]+/', '', $s);
        return $s ?: 'misc';
    }

    /** Parse order from title like "Name(3)" or from filename segments; default 0. */
    private function parseOrderFromTitleOrPath(?string $title, ?string $path): int
    {
        $title = (string) $title;
        if (preg_match('/\((\d+)\)\s*$/', $title, $m)) {
            return (int) $m[1];
        }
        $file = strtolower(pathinfo((string) $path, PATHINFO_FILENAME));
        if (preg_match('/\((\d+)\)$/', $file, $m)) {
            return (int) $m[1];
        }
        return 0;
    }

    /** Build absolute URLs for main and thumb; currently thumb mirrors main. */
    private function buildUrls(string $imagePath): array
    {
        $url = asset('storage/' . ltrim($imagePath, '/'));
        $thumb = $url; // placeholder until thumbnail pipeline exists
        return [$url, $thumb];
    }

    /** Build maps from DB categories: type->section and subId->parentType. */
    private function buildCategoryMaps(): array
    {
        $typeToSection = [];
        $subToType = [];
        $mapTypeToSection = function (string $type): string {
            return match ($type) {
                'eletter' => 'eletter',
                'uzletter' => 'uzletter',
                '3d-falboritas' => 'wall-cladding',
                'ives-butorok' => 'curved-furniture',
                default => $type,
            };
        };

        $cats = Category::all();
        foreach ($cats as $cat) {
            $type = (string) $cat->type;
            $typeToSection[$type] = $mapTypeToSection($type);
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

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:60'],
            'description' => ['nullable', 'string'],
            'image' => ['required', 'image', 'max:5120'],
        ]);
        $imagePath = $request->file('image')->store('gallery', 'public');
        $galleryItem = GalleryItem::create([
            'title' => $request->title,
            'category' => $request->category,
            'description' => $request->description,
            'image_path' => $imagePath,
        ]);
        return response()->json([
            'id' => $galleryItem->id,
            'title' => $galleryItem->title,
            'url' => asset('storage/' . $galleryItem->image_path),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        // ...
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        // ...
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        // ...
    }
}
