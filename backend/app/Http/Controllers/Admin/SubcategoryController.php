<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpsertSubcategoryRequest;
use App\Http\Resources\SubcategoryResource;
use App\Models\Subcategory;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Http\Controllers\BootstrapController;

class SubcategoryController extends Controller
{
    public function index()
    {
        $subs = Subcategory::with('category')->navOrdered()->get();
        return SubcategoryResource::collection($subs);
    }

    public function store(UpsertSubcategoryRequest $request)
    {
        $data = $request->validated();
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        $sub = Subcategory::create($data);
        return (new SubcategoryResource($sub))->response()->setStatusCode(201);
    }

    public function show(Subcategory $subcategory)
    {
        return new SubcategoryResource($subcategory);
    }

    public function update(UpsertSubcategoryRequest $request, Subcategory $subcategory)
    {
        $data = $request->validated();
        // Keep existing slug if none provided
        if (!array_key_exists('slug', $data)) {
            $data['slug'] = $subcategory->slug;
        }
        $subcategory->update($data);
        return new SubcategoryResource($subcategory);
    }

    public function destroy(Subcategory $subcategory)
    {
        $subcategory->delete();
        return response()->noContent();
    }

    /**
     * Bulk reorder subcategories.
     * Payload: { items: [{id: number, nav_order: number}, ...] }
     */
    public function reorder(Request $request)
    {
        // Accept 'orders' alias from frontend if 'items' not provided
        if ($request->has('orders') && !$request->has('items')) {
            $request->merge(['items' => $request->input('orders')]);
        }
        $data = $request->validate([
            'items' => ['required','array'],
            'items.*.id' => ['required','integer','exists:category_subcategories,id'],
            'items.*.nav_order' => ['required','integer','min:0','max:10000'],
        ]);

        $items = collect($data['items']);
        // Optional: ensure all belong to same category for consistency
        $subs = Subcategory::whereIn('id', $items->pluck('id'))->get()->keyBy('id');
        $categoryId = $subs->first()?->category_id;
        if ($subs->isNotEmpty() && $subs->some(fn($s) => $s->category_id !== $categoryId)) {
            return response()->json([
                'success' => false,
                'message' => 'All subcategories must belong to the same category.'
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

        // Invalidate bootstrap cache (it includes categories + subcategories ordering)
        Cache::forget(BootstrapController::CACHE_KEY);
        return SubcategoryResource::collection($updated);
    }
}
