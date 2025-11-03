<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\GalleryService;
use App\Services\NavigationService;
use Illuminate\Support\Facades\Cache;

class BootstrapController extends Controller
{
    public const CACHE_KEY = 'bootstrap:v1';

    public function __construct(
        private NavigationService $nav,
        private GalleryService $gallery
    ) {}

    /**
     * Return initial payload combining header, categories and featured gallery.
     */
    public function __invoke()
    {
        $payload = Cache::remember(self::CACHE_KEY, now()->addMinutes(5), function () {
            $headerItems = $this->nav->buildHeaderItems();

            $categories = Category::orderByRaw('CASE WHEN nav_order IS NULL THEN 1 ELSE 0 END')
                ->orderBy('nav_order')
                ->orderBy('name')
                ->get();

            // Top 12 featured items
            $featured = $this->gallery->queryActive()
                ->where('is_featured', true)
                ->latest()
                ->limit(12)
                ->get()
                ->map(fn($item) => $this->gallery->mapItem($item))
                ->values();

            return [
                'header' => ['items' => $headerItems],
                // Materialize resource to plain array for safe caching
                'categories' => CategoryResource::collection($categories)->resolve(),
                'featured_gallery' => $featured,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $payload,
        ]);
    }
}
