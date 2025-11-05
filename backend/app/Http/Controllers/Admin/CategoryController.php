<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Http\Requests\UpsertCategoryRequest;
use App\Http\Resources\AdminCategoryResource;
use App\Services\CategoryService;

class CategoryController extends Controller
{
    public function __construct(private CategoryService $service) {}

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $categories = Category::navOrdered()->get();
    return AdminCategoryResource::collection($categories);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UpsertCategoryRequest $request)
    {
        $category = $this->service->create($request->validated());
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
    public function update(UpsertCategoryRequest $request, Category $category)
    {
        $category = $this->service->update($category, $request->validated());
        return new AdminCategoryResource($category);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Category $category)
    {
        $this->service->delete($category);
        return response()->noContent();
    }
}
