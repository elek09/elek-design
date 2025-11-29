<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReorderRequest;
use App\Http\Requests\UpsertSubcategoryRequest;
use App\Http\Resources\SubcategoryResource;
use App\Models\Subcategory;
use App\Services\CategoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SubcategoryController extends Controller
{
    public function __construct(private CategoryService $categories) {}

    // alkategóriák listázása navigációs sorrendben
    public function index()
    {
        $subs = Subcategory::with('category')->navOrdered()->get();
        return SubcategoryResource::collection($subs);
    }

    // új alkategória létrehozása
    public function store(UpsertSubcategoryRequest $request)
    {
        $data = $request->validated();
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        $sub = Subcategory::create($data);
        return (new SubcategoryResource($sub))->response()->setStatusCode(201);
    }

    // egy alkategória részleteinek lekérése
    public function show(Subcategory $subcategory)
    {
        return new SubcategoryResource($subcategory);
    }

    // alkategória módosítása
    public function update(UpsertSubcategoryRequest $request, Subcategory $subcategory)
    {
        $data = $request->validated();
        // meglévő slug megtartása ha nincs új megadva
        if (!array_key_exists('slug', $data)) {
            $data['slug'] = $subcategory->slug;
        }
        $subcategory->update($data);
        return new SubcategoryResource($subcategory);
    }

    // alkategória törlése
    public function destroy(Subcategory $subcategory)
    {
        $subcategory->delete();
        return response()->noContent();
    }

    /**
     * Alkategóriák tömeges átrendezése
     * Payload: { items: [{id: number, nav_order: number}, ...] }
     */
    public function reorder(ReorderRequest $request)
    {
        $data = $request->validated();

        $items = collect($data['items']);
        // ellenőrizzük hogy minden alkategória ugyanahhoz a kategóriához tartozik-e
        $subs = Subcategory::whereIn('id', $items->pluck('id'))->get()->keyBy('id');
        $categoryId = $subs->first()?->category_id;
        if ($subs->isNotEmpty() && $subs->some(fn($s) => $s->category_id !== $categoryId)) {
            return response()->json([
                'success' => false,
                'message' => 'Minden alkategóriának ugyanahhoz a kategóriához kell tartoznia.'
            ], 422);
        }

        DB::transaction(function () use ($items) {
            foreach ($items as $row) {
                Subcategory::where('id',$row['id'])->update(['nav_order' => $row['nav_order']]);
            }
        });

        $updated = Subcategory::whereIn('id', $items->pluck('id'))
            ->navOrdered()
            ->get();

        return SubcategoryResource::collection($updated);
    }
}
