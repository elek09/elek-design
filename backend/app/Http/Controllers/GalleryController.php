<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\GalleryItem;
use App\Services\GalleryService;

class GalleryController extends Controller
{
    public function __construct(private GalleryService $gallery)
    {
    }
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = $this->resolvePerPage($request);
        $query = $this->gallery->queryActive();
        if ($param = $request->query('category')) {
            $param = trim($param);
            if ($param !== '') {
                // Resolve as category type or subcategory slug
                $cat = \App\Models\Category::where('type', $param)->first();
                $sub = null;
                if (!$cat) {
                    $sub = \App\Models\Subcategory::where('slug', $param)->first();
                }
                if ($cat) {
                    $query->where('category_id', $cat->id)
                        ->orderByRaw('COALESCE((SELECT nav_order FROM category_subcategories WHERE category_subcategories.id = gallery_items.subcategory_id), 100000) ASC')
                        ->orderByDesc('created_at');
                } elseif ($sub) {
                    $query->where('subcategory_id', $sub->id)
                        ->orderByDesc('created_at');
                } else {
                    // No match -> force empty result
                    $query->whereRaw('1=0');
                }
            }
        }
        return $this->paginateAndMap($request, $query, $perPage);
    }

    // --- Custom endpoints ---

    public function top(Request $request)
    {
        $perPage = $this->resolvePerPage($request);
        $query = GalleryItem::query()->active()->featured()->with(['category','subcategory']);
        return $this->paginateAndMap($request, $query, $perPage);
    }

    private function paginateAndMap(Request $request, $query, int $perPage = 24)
    {
        $hasOrdering = !empty($query->getQuery()->orders);
        if ($request->boolean('all')) {
            if (!$hasOrdering) {
                $query->latest();
            }
            $collection = $query->get();
            return \App\Http\Resources\GalleryItemResource::collection($collection);
        }
        if (!$hasOrdering) {
            $query->latest();
        }
        $paginator = $query->paginate($perPage)->appends($request->query());
        return \App\Http\Resources\GalleryItemResource::collection($paginator);
    }

    private function resolvePerPage(Request $request): int
    {
        $perPage = (int) $request->query('per_page', 24);
        if ($perPage < 1) $perPage = 1;
        if ($perPage > 1000) $perPage = 1000;
        return $perPage;
    }

    public function section(Request $request, string $section)
    {
        $perPage = $this->resolvePerPage($request);
        $q = $this->gallery->queryBySection($section);
        return $this->paginateAndMap($request, $q, $perPage);
    }
}
