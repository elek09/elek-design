<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\GalleryItemResource;
use App\Http\Resources\OrderResource;
use App\Models\GalleryItem;
use App\Models\Order;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Admin dashboard statisztikák
     * Galéria és rendelés adatok összegzése
     */
    public function stats(): JsonResponse
    {
        // Galéria statisztikák
        $totalGallery = GalleryItem::count();
        $activeGallery = GalleryItem::active()->count();
        $featuredGallery = GalleryItem::featured()->count();

        // Galéria elemek kategóriánként
        $byCategory = GalleryItem::selectRaw('category_id, COUNT(*) as count')
            ->whereNotNull('category_id')
            ->groupBy('category_id')
            ->with('category:id,name,type')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->category->name ?? 'Unknown' => $item->count];
            });

        // Galéria elemek alkategóriánként
        $bySubcategory = GalleryItem::selectRaw('subcategory_id, COUNT(*) as count')
            ->whereNotNull('subcategory_id')
            ->groupBy('subcategory_id')
            ->with('subcategory:id,name,slug')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->subcategory->name ?? 'Unknown' => $item->count];
            });

        // Legújabb galéria elemek
        $recentGallery = GalleryItem::with(['category:id,name,type', 'subcategory:id,name,slug'])
            ->latest()
            ->take(5)
            ->get();

        // Rendelés statisztikák
        $totalOrders = Order::count();
        $ordersByStatus = Order::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $recentOrders = Order::with(['items.product', 'user'])
            ->latest()
            ->take(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'gallery' => [
                    'total' => $totalGallery,
                    'active' => $activeGallery,
                    'inactive' => $totalGallery - $activeGallery,
                    'featured' => $featuredGallery,
                    'byCategory' => $byCategory->merge($bySubcategory)->toArray(),
                    'recent' => GalleryItemResource::collection($recentGallery),
                ],
                'orders' => [
                    'total' => $totalOrders,
                    'byStatus' => $ordersByStatus,
                    'recent' => OrderResource::collection($recentOrders),
                ],
            ],
        ]);
    }
}
