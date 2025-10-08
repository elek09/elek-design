<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\GalleryItem;
use Illuminate\Support\Str;

class GalleryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = GalleryItem::query()->where('active', true);
        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }
        return $this->paginateAndMap($query, 24);
    }

    // --- Custom endpoints ---

    public function top(Request $request)
    {
        $query = GalleryItem::query()->where('active', true)->where('category', 'featured');
        return $this->paginateAndMap($query, 24);
    }

    public function eletter(Request $request)
    {
        $needles = ['nappali', 'konyha', 'furdoszoba', 'haloszoba', 'gardrob'];
        $query = $this->queryByTitleNeedles($needles);
        return $this->paginateAndMap($query, 24);
    }

    public function uzletter(Request $request)
    {
        $needles = ['iroda', 'uzlet', 'kiallitas'];
        $query = $this->queryByTitleNeedles($needles);
        return $this->paginateAndMap($query, 24);
    }

    public function wallCladding(Request $request)
    {
        $needles = ['3dfal', '3d', 'fal'];
        $query = $this->queryByTitleNeedles($needles);
        return $this->paginateAndMap($query, 24);
    }

    public function curvedFurniture(Request $request)
    {
        $needles = ['ivesbutorok', 'ives'];
        $query = $this->queryByTitleNeedles($needles);
        return $this->paginateAndMap($query, 24);
    }

    private function queryByTitleNeedles(array $needles)
    {
        $q = GalleryItem::query()->where('active', true);
        $q->where(function ($sub) use ($needles) {
            foreach ($needles as $n) {
                $sub->orWhere('title', 'like', "%{$n}%")
                    ->orWhere('image_path', 'like', "%{$n}%");
            }
        });
        return $q;
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

    /** Infer section and subcategory from title/image_path keywords. */
    private function detectSectionAndSubcategory(GalleryItem $item): array
    {
        $hay = strtolower(($item->title ?? '') . ' ' . ($item->image_path ?? ''));

        $in = fn(array $needles) => collect($needles)->first(fn($n) => str_contains($hay, $n));

        if ($hit = $in(['nappali', 'konyha', 'furdoszoba', 'haloszoba', 'gardrob'])) {
            return ['eletter', $this->normalizeKey($hit)];
        }
        if ($hit = $in(['iroda', 'uzlet', 'kiallitas'])) {
            return ['uzletter', $this->normalizeKey($hit)];
        }
        if ($hit = $in(['3dfal', '3d', 'fal'])) {
            // prefer 3dfal subcategory where possible
            $sub = str_contains($hay, '3dfal') ? '3dfal' : $this->normalizeKey($hit);
            return ['wall-cladding', $sub];
        }
        if ($hit = $in(['ivesbutorok', 'ives'])) {
            return ['curved-furniture', 'ivesbutorok'];
        }
        return ['unknown', 'misc'];
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
        // If later you generate thumbs under e.g. gallery/_thumbs/, adjust below.
        $thumb = $url; // placeholder until thumbnail pipeline exists
        return [$url, $thumb];
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
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
