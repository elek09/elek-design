<?php

namespace App\Http\Controllers;

use App\Http\Resources\GalleryItemResource;
use App\Models\GalleryItem;
use App\Services\GalleryService;
use Illuminate\Http\Request;

class GalleryController extends Controller
{
    public function __construct(private GalleryService $gallery) {}

    /**
     * Galéria elemek listázása opcionális szűréssel
     * ?category=type_vagy_slug - főkategória vagy alkategória szerinti szűrés
     * ?per_page=24 - oldalankénti elemszám (1-1000)
     * ?all=1 - teljes lista lapozás nélkül
     */
    public function index(Request $request)
    {
        $perPage = $this->resolvePerPage($request);
        
        $category = $request->query('category');
        $query = $category 
            ? $this->gallery->queryBySection($category)
            : $this->gallery->queryActive();
        
        return $this->paginateAndMap($request, $query, $perPage);
    }

    /**
     * Kiemelt galéria elemek listázása
     * Csak aktív és featured elemek, legfrissebb sorrendben
     */
    public function top(Request $request)
    {
        $perPage = $this->resolvePerPage($request);
        $query = GalleryItem::active()->featured()->with(['category', 'subcategory']);
        return $this->paginateAndMap($request, $query, $perPage);
    }

    /**
     * Query lapozása és Resource wrapping
     * Ha ?all=1 akkor teljes lista, egyébként pagináció
     * Ha nincs ordering, latest() alapértelmezett
     */
    private function paginateAndMap(Request $request, $query, int $perPage = 24)
    {
        $hasOrdering = !empty($query->getQuery()->orders);
        
        if ($request->boolean('all')) {
            if (!$hasOrdering) {
                $query->latest();
            }
            $collection = $query->get();
            return GalleryItemResource::collection($collection);
        }
        
        if (!$hasOrdering) {
            $query->latest();
        }
        $paginator = $query->paginate($perPage)->appends($request->query());
        return GalleryItemResource::collection($paginator);
    }

    /**
     * per_page paraméter validálása (1-1000)
     * Alapértelmezett: 24
     */
    private function resolvePerPage(Request $request): int
    {
        $perPage = (int) $request->query('per_page', 24);
        if ($perPage < 1) $perPage = 1;
        if ($perPage > 1000) $perPage = 1000;
        return $perPage;
    }

    /**
     * Galéria elemek szekció szerint (főkategória type vagy alkategória slug)
     * Route parameter alapján szűr
     */
    public function section(Request $request, string $section)
    {
        $perPage = $this->resolvePerPage($request);
        $query = $this->gallery->queryBySection($section);
        return $this->paginateAndMap($request, $query, $perPage);
    }
}
