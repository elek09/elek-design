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
        $query = $this->gallery->queryActive();
        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }
        return $this->paginateAndMap($query, 24);
    }

    // --- Custom endpoints ---

    public function top(Request $request)
    {
        $query = GalleryItem::query()->active()->featured();
        return $this->paginateAndMap($query, 24);
    }

    private function paginateAndMap($query, int $perPage = 24)
    {
        $paginator = $query->latest()->paginate($perPage);
        return \App\Http\Resources\GalleryItemResource::collection($paginator);
    }

    public function section(Request $request, string $section)
    {
        // Canonical, DB-driven section filtering via service
        $q = $this->gallery->queryBySection($section);
        return $this->paginateAndMap($q, 24);
    }
}
