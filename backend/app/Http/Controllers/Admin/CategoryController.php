<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use App\Http\Resources\AdminCategoryResource;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $categories = Category::orderByRaw('CASE WHEN nav_order IS NULL THEN 1 ELSE 0 END')
            ->orderBy('nav_order')
            ->orderBy('name')
            ->get();
    return AdminCategoryResource::collection($categories);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $input = $request->all();
        // Normalize subcategories to expected shape: [{ id, name }, ...]
        $input['subcategories'] = $this->normalizeSubcategories($input['subcategories'] ?? null);

        $validated = Validator::make($input, [
            'name' => 'required|string|max:255',
            'type' => 'required|string|unique:categories,type|max:255',
            'nav_order' => 'nullable|integer|min:0|max:1000',
            'subcategories' => 'nullable|array',
            'subcategories.*.id' => 'required_with:subcategories|string',
            'subcategories.*.name' => 'required_with:subcategories|string',
        ])->validate();

    $category = Category::create($validated);
    // Invalidate cached bootstrap payload so public site reflects changes
    Cache::forget(\App\Http\Controllers\BootstrapController::CACHE_KEY);

    return (new AdminCategoryResource($category))->response()->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Category $category)
    {
    return new AdminCategoryResource($category);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Category $category)
    {
        $input = $request->all();
        // Normalize subcategories to expected shape: [{ id, name }, ...]
        $input['subcategories'] = $this->normalizeSubcategories($input['subcategories'] ?? null);

        $validated = Validator::make($input, [
            'name' => 'required|string|max:255',
            'type' => ['required', 'string', 'max:255', Rule::unique('categories')->ignore($category->id)],
            'nav_order' => 'nullable|integer|min:0|max:1000',
            'subcategories' => 'nullable|array',
            'subcategories.*.id' => 'required_with:subcategories|string',
            'subcategories.*.name' => 'required_with:subcategories|string',
        ])->validate();

    $category->update($validated);
    // Invalidate cached bootstrap payload so public site reflects changes
    Cache::forget(\App\Http\Controllers\BootstrapController::CACHE_KEY);

    return new AdminCategoryResource($category);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Category $category)
    {
    $category->delete();
    // Invalidate cached bootstrap payload so public site reflects changes
    Cache::forget(\App\Http\Controllers\BootstrapController::CACHE_KEY);

        return response()->noContent();
    }

    /**
     * Normalize various subcategory input shapes to [{ id, name }, ...]
     * - Accepts array of strings => id from slug(name), name from string
     * - Accepts array of objects with optional id/name/slug/label/title
     * - Deduplicates by id
     */
    private function normalizeSubcategories($subcategories): array
    {
        if (empty($subcategories) || !is_array($subcategories)) {
            return [];
        }
        $result = [];
        foreach ($subcategories as $item) {
            $name = null; $id = null;
            if (is_string($item)) {
                $name = trim($item);
                $id = Str::slug($name);
            } elseif (is_array($item)) {
                $name = $item['name'] ?? $item['label'] ?? $item['title'] ?? null;
                $id = $item['id'] ?? $item['slug'] ?? null;
                if (!$id && $name) {
                    $id = Str::slug($name);
                }
                if (!$name && $id) {
                    $name = ucwords(str_replace(['-', '_'], ' ', $id));
                }
            }
            if ($id && $name) {
                $result[$id] = ['id' => (string) $id, 'name' => (string) $name];
            }
        }
        // Return de-duplicated values preserving associative keys by id
        return array_values($result);
    }
}
