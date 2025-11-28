<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\UpsertCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Services\CategoryService;

class CategoryController extends Controller
{
    public function __construct(private CategoryService $service) {}

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $categories = Category::navOrdered()->with('subcategories')->get();
        return CategoryResource::collection($categories);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UpsertCategoryRequest $request)
    {
        $category = $this->service->create($request->validated());
        // Invalidate cached categories and bootstrap payload
        Cache::forget('categories.with.subs.v1');
        Cache::forget(\App\Http\Controllers\BootstrapController::CACHE_KEY);
        return (new CategoryResource($category->load('subcategories')))->response()->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Category $category)
    {
        return new CategoryResource($category->load('subcategories'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpsertCategoryRequest $request, Category $category)
    {
        $category = $this->service->update($category, $request->validated());
        Cache::forget('categories.with.subs.v1');
        Cache::forget(\App\Http\Controllers\BootstrapController::CACHE_KEY);
        return new CategoryResource($category->load('subcategories'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Category $category)
    {
        $this->service->delete($category);
        Cache::forget('categories.with.subs.v1');
        Cache::forget(\App\Http\Controllers\BootstrapController::CACHE_KEY);
        return response()->noContent();
    }

    /**
     * Bulk reorder categories.
     * Payload: { items: [{id: number, nav_order: number}, ...] }
     */
    public function reorder(Request $request)
    {
        // Allow frontend to send either 'items' (documented) or legacy 'orders'
        if ($request->has('orders') && !$request->has('items')) {
            $request->merge(['items' => $request->input('orders')]);
        }
        $data = $request->validate([
            'items' => ['required','array'],
            'items.*.id' => ['required','integer','exists:categories,id'],
            'items.*.nav_order' => ['required','integer','min:0','max:10000'],
        ]);

        $items = collect($data['items']);

        DB::transaction(function () use ($items) {
            foreach ($items as $row) {
                Category::where('id',$row['id'])->update(['nav_order' => $row['nav_order']]);
            }
        });

        // Invalidate bootstrap cache (header order depends on nav_order)
        Cache::forget(\App\Http\Controllers\BootstrapController::CACHE_KEY);

        $updated = Category::navOrdered()->with('subcategories')->get();
        return \App\Http\Resources\CategoryResource::collection($updated);
    }
}
