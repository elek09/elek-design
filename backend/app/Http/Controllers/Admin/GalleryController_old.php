<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGalleryItemRequest;
use App\Http\Resources\GalleryItemResource;
use App\Models\Category;
use App\Models\GalleryItem;
use App\Models\Subcategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GalleryController extends Controller
{
    /**
     * Galéria elemek listázása szűréssel (admin)
     * ?status=active|inactive, ?category_id, ?subcategory_id, ?search
     */
    public function index(Request $request)
    {
        $query = GalleryItem::with(['category', 'subcategory']);

        if ($request->has('status')) {
            $isActive = $request->status === 'active';
            $query->where('is_active', $isActive);
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('subcategory_id')) {
            $query->where('subcategory_id', $request->subcategory_id);
        }

        if ($request->has('search') && $search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'LIKE', "%{$search}%")
                    ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        $items = $query->latest()->paginate($request->input('per_page', 20));

        return GalleryItemResource::collection($items)
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

    /**
     * Új galéria elem létrehozása
     */
    public function store(StoreGalleryItemRequest $request)
    {
        $validated = $request->validated();
        
        if ($request->hasFile('image') || $request->hasFile('file')) {
            $validated['image_path'] = $this->handleImageUpload($request, $validated);
        }

        $galleryItem = GalleryItem::create($validated);
        return (new GalleryItemResource($galleryItem->load(['category', 'subcategory'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Galéria elem módosítása
     */
    public function update(Request $request, GalleryItem $galleryItem)
    {
        try {
            // Build dynamic category list from DB
            $types = Category::query()->pluck('type')->all();
            $subs = Category::query()
                ->pluck('subcategories')
                ->filter()
                ->flatMap(function ($arr) {
                    return collect($arr)->pluck('id'); })
                ->filter()->unique()->values()->all();
            $validCategories = array_values(array_unique(array_merge($types, $subs, ['featured', 'egyeb'])));

            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'category_id' => ['sometimes', 'nullable', 'integer', 'exists:categories,id', 'required_without:subcategory_id'],
                'subcategory_id' => ['sometimes', 'nullable', 'integer', 'exists:category_subcategories,id', 'required_without:category_id'],
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

            return new \App\Http\Resources\GalleryItemResource($galleryItem->load(['category', 'subcategory']));

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

    /**
     * Galéria elem törlése
     */
    public function destroy(GalleryItem $galleryItem)
    {
        if ($galleryItem->image_path && Storage::disk('public')->exists($galleryItem->image_path)) {
            Storage::disk('public')->delete($galleryItem->image_path);
        }

        $galleryItem->delete();
        return response()->json(['success' => true, 'message' => 'Gallery item deleted successfully.']);
    }

    /**
     * Galéria elem aktív státusz frissítése
     */
    public function updateStatus(Request $request, GalleryItem $galleryItem)
    {
        $validated = $request->validate(['is_active' => 'required|boolean']);
        $galleryItem->update(['is_active' => $validated['is_active']]);
        
        return response()->json([
            'success' => true,
            'message' => 'Gallery item status updated successfully.',
            'data' => $galleryItem->fresh(),
        ]);
    }

    /**
     * Galéria elem kiemelt státusz frissítése
     */
    public function updateFeaturedStatus(Request $request, GalleryItem $galleryItem)
    {
        $validated = $request->validate(['is_featured' => 'required|boolean']);
        $galleryItem->update(['is_featured' => $validated['is_featured']]);
        
        return response()->json([
            'success' => true,
            'message' => 'Gallery item featured status updated successfully.',
            'data' => $galleryItem->fresh(),
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