<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GalleryItem;
use App\Models\Order;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics for admin overview
     * 
     * GET /api/v1/admin/dashboard/stats
     */
    public function stats()
    {
        // Gallery stats
        $totalGallery = GalleryItem::count();
        $activeGallery = GalleryItem::where('is_active', true)->count();
        $featuredGallery = GalleryItem::where('is_featured', true)->count();

        // Gallery by category
        $byCategory = GalleryItem::selectRaw('category_id, COUNT(*) as count')
            ->whereNotNull('category_id')
            ->groupBy('category_id')
            ->with('category:id,name,type')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->category->name ?? 'Unknown' => $item->count];
            });

        // Gallery by subcategory
        $bySubcategory = GalleryItem::selectRaw('subcategory_id, COUNT(*) as count')
            ->whereNotNull('subcategory_id')
            ->groupBy('subcategory_id')
            ->with('subcategory:id,name,slug')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->subcategory->name ?? 'Unknown' => $item->count];
            });

        // Recent gallery items
        $recentGallery = GalleryItem::with(['category:id,name,type', 'subcategory:id,name,slug'])
            ->latest()
            ->take(5)
            ->get();

        // Order stats
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
                    'recent' => \App\Http\Resources\GalleryItemResource::collection($recentGallery),
                ],
                'orders' => [
                    'total' => $totalOrders,
                    'byStatus' => $ordersByStatus,
                    'recent' => \App\Http\Resources\OrderResource::collection($recentOrders),
                ],
            ],
        ]);
    }
}
