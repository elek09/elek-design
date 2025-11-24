<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGalleryItemRequest;
use App\Models\GalleryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use App\Models\Category;

class GalleryController extends Controller
{
    public function index()
    {
        $items = GalleryItem::with(['category','subcategory'])->latest()->paginate(20);
        return \App\Http\Resources\GalleryItemResource::collection($items)
            ->additional([
                'success' => true,
                'pagination' => [
                    'current_page' => $items->currentPage(),
                    'last_page' => $items->lastPage(),
                    'per_page' => $items->perPage(),
                    'total' => $items->total(),
                ],
            ]);
    }

    public function store(StoreGalleryItemRequest $request)
    {
        try {
            $validated = $request->validated();
            $cat = isset($validated['category_id']) ? Category::find($validated['category_id']) : null;
            $sub = isset($validated['subcategory_id']) ? \App\Models\Subcategory::find($validated['subcategory_id']) : null;

            // Accept either 'image' or 'file' input name
            $hasUpload = $request->hasFile('image') || $request->hasFile('file');
            if ($hasUpload) {
                $image = $request->file('image') ?? $request->file('file');
                $categorySlug = Str::slug($sub?->slug ?? $cat?->type ?? 'uncategorized');
                $titleSlug = Str::slug($validated['title']);
                $timestamp = now()->timestamp;
                $extension = $image->getClientOriginalExtension();

                $filename = "{$titleSlug}-{$timestamp}.{$extension}";
                $directory = "gallery/{$categorySlug}";

                $path = $image->storeAs($directory, $filename, 'public');
                $validated['image_path'] = $path;
            }

            $galleryItem = new GalleryItem($validated);
            $galleryItem->save();

            // Invalidate bootstrap cache as featured list might change
            Cache::forget(\App\Http\Controllers\BootstrapController::CACHE_KEY);

            return new \App\Http\Resources\GalleryItemResource($galleryItem->load(['category','subcategory']));

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create gallery item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(GalleryItem $galleryItem)
    {
        return response()->json([
            'success' => true,
            'data' => $galleryItem
        ]);
    }

    public function edit(GalleryItem $galleryItem)
    {
        return response()->json([
            'success' => true,
            'data' => $galleryItem,
            'categories' => ['featured', 'work', 'ui', 'misc']
        ]);
    }

    /**
     * Update the specified gallery item
     */
    public function update(Request $request, GalleryItem $galleryItem)
    {
        try {
            // Build dynamic category list from DB
            $types = Category::query()->pluck('type')->all();
            $subs = Category::query()
                ->pluck('subcategories')
                ->filter()
                ->flatMap(function ($arr) { return collect($arr)->pluck('id'); })
                ->filter()->unique()->values()->all();
            $validCategories = array_values(array_unique(array_merge($types, $subs, ['featured', 'egyeb'])));

            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'category_id' => ['sometimes','nullable','integer','exists:categories,id','required_without:subcategory_id'],
                'subcategory_id' => ['sometimes','nullable','integer','exists:category_subcategories,id','required_without:category_id'],
                'description' => 'nullable|string|max:1000',
                'image' => 'sometimes|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'file' => 'sometimes|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'is_active' => 'sometimes|required|boolean',
                'is_featured' => 'sometimes|required|boolean',
            ]);

            if ($request->hasFile('image') || $request->hasFile('file')) {
                if ($galleryItem->image_path && Storage::disk('public')->exists($galleryItem->image_path)) {
                    Storage::disk('public')->delete($galleryItem->image_path);
                }

                $image = $request->file('image') ?? $request->file('file');
                $cat = isset($validated['category_id']) ? Category::find($validated['category_id']) : null;
                $sub = isset($validated['subcategory_id']) ? \App\Models\Subcategory::find($validated['subcategory_id']) : null;
                $categorySlug = Str::slug($sub?->slug ?? $cat?->type ?? ($galleryItem->subcategory?->slug ?? $galleryItem->category?->type) ?? 'uncategorized');
                $title = $validated['title'] ?? $galleryItem->title;

                $titleSlug = Str::slug($title);
                $timestamp = now()->timestamp;
                $extension = $image->getClientOriginalExtension();

                $filename = "{$titleSlug}-{$timestamp}.{$extension}";
                $directory = "gallery/{$categorySlug}";

                $path = $image->storeAs($directory, $filename, 'public');
                $validated['image_path'] = $path;
            }

            $galleryItem->update($validated);

            // Invalidate bootstrap cache as featured or active state might affect it
            Cache::forget(\App\Http\Controllers\BootstrapController::CACHE_KEY);

            return new \App\Http\Resources\GalleryItemResource($galleryItem->load(['category','subcategory']));

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update gallery item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(GalleryItem $galleryItem)
    {
        // Delete image file
        if ($galleryItem->image_path && Storage::disk('public')->exists($galleryItem->image_path)) {
            Storage::disk('public')->delete($galleryItem->image_path);
        }

        $galleryItem->delete();

        // Invalidate bootstrap cache as featured list might change
        Cache::forget(\App\Http\Controllers\BootstrapController::CACHE_KEY);

        return response()->json([
            'success' => true,
            'message' => 'Gallery item deleted successfully.'
        ]);
    }

    public function updateStatus(Request $request, GalleryItem $galleryItem)
    {
        $validated = $request->validate([
            'is_active' => 'required|boolean',
        ]);

        $galleryItem->update(['is_active' => $validated['is_active']]);
        Cache::forget(\App\Http\Controllers\BootstrapController::CACHE_KEY);
        
        return response()->json([
            'success' => true,
            'message' => 'Gallery item status updated successfully.',
            'data' => $galleryItem->fresh()
        ]);
    }

    public function updateFeaturedStatus(Request $request, GalleryItem $galleryItem)
    {
        $validated = $request->validate([
            'is_featured' => 'required|boolean',
        ]);

        $galleryItem->update(['is_featured' => $validated['is_featured']]);
        Cache::forget(\App\Http\Controllers\BootstrapController::CACHE_KEY);
        
        return response()->json([
            'success' => true,
            'message' => 'Gallery item featured status updated successfully.',
            'data' => $galleryItem->fresh()
        ]);
    }

    /**
     * Provide configuration data for the gallery admin UI.
     */
    public function config()
    {
        // Build categories dynamically from DB for the admin UI
        $categories = [];
        $dbCats = Category::with('subcategories')->orderBy('name')->get();
        foreach ($dbCats as $cat) {
            $entry = [
                'label' => $cat->name,
                'value' => $cat->type,
            ];
            if ($cat->subcategories->count()) {
                $entry['subcategories'] = $cat->subcategories->map(function ($s) {
                    return [
                        'label' => $s->name,
                        'value' => $s->id,
                    ];
                })->values()->all();
            }
            $categories[] = $entry;
        }
        // Add "Egyéb" static option at the end
        $categories[] = [
            'label' => 'Egyéb',
            'value' => 'egyeb'
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'categories' => $categories
            ]
        ]);
    }
}