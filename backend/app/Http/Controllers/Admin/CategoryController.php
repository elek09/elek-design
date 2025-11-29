<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BootstrapController;
use App\Http\Controllers\Controller;
use App\Http\Requests\ReorderRequest;
use App\Http\Requests\UpsertCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\CategoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CategoryController extends Controller
{
    public function __construct(private CategoryService $service) {}

    /**
     * Kategóriák listázása alkategóriákkal
     * Navigációs sorrendben
     */
    public function index()
    {
        $categories = Category::navOrdered()->with('subcategories')->get();
        return CategoryResource::collection($categories);
    }

    /**
     * Új kategória létrehozása
     */
    public function store(UpsertCategoryRequest $request)
    {
        $category = $this->service->create($request->validated());
        return (new CategoryResource($category->load('subcategories')))->response()->setStatusCode(201);
    }

    /**
     * Egy kategória részletes adatai
     */
    public function show(Category $category)
    {
        return new CategoryResource($category->load('subcategories'));
    }

    /**
     * Kategória módosítása
     */
    public function update(UpsertCategoryRequest $request, Category $category)
    {
        $category = $this->service->update($category, $request->validated());
        return new CategoryResource($category->load('subcategories'));
    }

    /**
     * Kategória törlése
     */
    public function destroy(Category $category)
    {
        $this->service->delete($category);
        return response()->noContent();
    }

    /**
     * Kategóriák átrendezése tömeges művelettel
     * Payload: { items: [{id: number, nav_order: number}, ...] }
     */
    public function reorder(Request $request)
    {
        $data = $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'integer', 'exists:categories,id'],
            'items.*.nav_order' => ['required', 'integer', 'min:0', 'max:10000'],
        ]);

        DB::transaction(function () use ($data) {
            foreach ($data['items'] as $row) {
                Category::where('id', $row['id'])->update(['nav_order' => $row['nav_order']]);
            }
        });

        // Observer automatikusan törli a Bootstrap cache-t
        $updated = Category::navOrdered()->with('subcategories')->get();
        return CategoryResource::collection($updated);
    }
}
