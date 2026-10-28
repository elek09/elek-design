<?php

namespace App\Http\Controllers;

use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\GalleryService;
use App\Services\NavigationService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Request;

class BootstrapController extends Controller
{
    public const CACHE_KEY = 'bootstrap:v1';

    public function __construct(
        private NavigationService $nav,
        private GalleryService $gallery
    ) {}

    /**
     * Alkalmazás induló adatok: header menü, kategóriák, kiemelt galéria
     * Cache-elt válasz, admin ?fresh=1 paraméterrel újratöltheti
     */
    public function __invoke(Request $request)
    {
        $isAdmin = $request->user()?->admin ?? false;
        $bypassCache = $isAdmin && $request->boolean('fresh');

        if ($bypassCache) {
            Cache::forget(self::CACHE_KEY);
        }

        $ttl = (int) config('services.bootstrap_cache_ttl', 10);
        
        $payload = Cache::remember(self::CACHE_KEY, now()->addMinutes($ttl), function () {
            $headerItems = $this->nav->buildHeaderItems();
            $categories = Category::navOrdered()->with('subcategories')->get();
            $featured = $this->gallery->queryActive()
                ->featured()
                ->latest()
                ->limit(12)
                ->get()
                ->map(fn($item) => $this->gallery->mapItem($item))
                ->values();

            return [
                'header' => ['items' => $headerItems],
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
