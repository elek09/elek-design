<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGalleryItemRequest;
use App\Models\GalleryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use App\Models\Category;

class GalleryController extends Controller
{
    public function index()
    {
        $items = GalleryItem::latest()->paginate(20);
        
        return response()->json([
            'success' => true,
            'data' => $items->items(),
            'pagination' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total()
            ]
        ]);
    }

    public function store(StoreGalleryItemRequest $request)
    {
        try {
            $validated = $request->validated();

            // Accept either 'image' or 'file' input name
            $hasUpload = $request->hasFile('image') || $request->hasFile('file');
            if ($hasUpload) {
                $image = $request->file('image') ?? $request->file('file');
                $categorySlug = Str::slug($validated['category']);
                $titleSlug = Str::slug($validated['title']);
                $timestamp = now()->timestamp;
                $extension = $image->getClientOriginalExtension();
                
                $filename = "{$titleSlug}-{$timestamp}.{$extension}";
                $directory = "gallery/{$categorySlug}";
                
                $path = $image->storeAs($directory, $filename, 'public');
                $validated['image_path'] = $path;
            }

            $galleryItem = GalleryItem::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Gallery item created successfully',
                'data' => $galleryItem->fresh()
            ], 201);

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
                'category' => ['sometimes', 'required', 'string', Rule::in($validCategories)],
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
                $category = $validated['category'] ?? $galleryItem->category;
                $title = $validated['title'] ?? $galleryItem->title;

                $categorySlug = Str::slug($category);
                $titleSlug = Str::slug($title);
                $timestamp = now()->timestamp;
                $extension = $image->getClientOriginalExtension();

                $filename = "{$titleSlug}-{$timestamp}.{$extension}";
                $directory = "gallery/{$categorySlug}";

                $path = $image->storeAs($directory, $filename, 'public');
                $validated['image_path'] = $path;
            }

            $galleryItem->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Gallery item updated successfully',
                'data' => $galleryItem->fresh()
            ]);

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
        $dbCats = Category::orderBy('name')->get();
        foreach ($dbCats as $cat) {
            $entry = [
                'label' => $cat->name,
                'value' => $cat->type,
            ];
            if (is_array($cat->subcategories) && count($cat->subcategories)) {
                $entry['subcategories'] = collect($cat->subcategories)
                    ->map(function ($s) {
                        return [
                            'label' => $s['name'] ?? $s['id'],
                            'value' => $s['id'] ?? Str::slug($s['name'] ?? '')
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