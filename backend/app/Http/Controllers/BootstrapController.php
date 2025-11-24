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
     * Return initial payload combining header, categories and featured gallery.
     */
    public function __invoke(Request $request)
    {
        $build = function () {
            $headerItems = $this->nav->buildHeaderItems();
            $categories = Category::navOrdered()->with('subcategories')->get();
            $featured = $this->gallery->queryActive()
                ->where('is_featured', true)
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
        };

        $bypass = $request->boolean('fresh')
            || $request->boolean('noCache')
            || $request->header('X-Bypass-Cache')
            || ($request->user()?->admin && $request->boolean('adminFresh'));

        if ($bypass) {
            $payload = $build();
        } else {
            $ttl = (int) config('services.bootstrap_cache_ttl', 10);
            $payload = Cache::remember(self::CACHE_KEY, now()->addMinutes($ttl), $build);
        }

        return response()->json([
            'success' => true,
            'cache' => $bypass ? 'bypassed' : 'cached',
            'data' => $payload,
        ]);
    }
}
