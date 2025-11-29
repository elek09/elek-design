<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGalleryItemRequest;
use App\Http\Requests\UpdateGalleryItemRequest;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\GalleryItemResource;
use App\Models\Category;
use App\Models\GalleryItem;
use App\Models\Subcategory;
use App\Services\GalleryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GalleryController extends Controller
{
    public function __construct(private GalleryService $gallery) {}

    /**
     * Galéria elemek listázása szűréssel (admin)
     * ?status=active|inactive, ?subcategory_id, ?search
     */
    public function index(Request $request)
    {
        // Admin láthatja az inaktívakat is
        $query = GalleryItem::with(['category', 'subcategory']);
        
        if ($request->has('status')) {
            if ($request->status === 'active') {
                $query->active();
            } else {
                $query->inactive();
            }
        }

        if ($request->has('category_id')) {
            $query->byCategory($request->category_id);
        }

        if ($request->has('subcategory_id')) {
            $query->bySubcategory($request->subcategory_id);
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
    public function update(UpdateGalleryItemRequest $request, GalleryItem $galleryItem)
    {
        $validated = $request->validated();

        if ($request->hasFile('image') || $request->hasFile('file')) {
            // Régi kép törlése
            if ($galleryItem->image_path && Storage::disk('public')->exists($galleryItem->image_path)) {
                Storage::disk('public')->delete($galleryItem->image_path);
            }
            
            $validated['image_path'] = $this->handleImageUpload($request, $validated, $galleryItem);
        }

        $galleryItem->update($validated);
        return new GalleryItemResource($galleryItem->load(['category', 'subcategory']));
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
        $request->validate(['is_active' => 'required|boolean']);
        $galleryItem->update(['is_active' => $request->is_active]);
        
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
        $request->validate(['is_featured' => 'required|boolean']);
        $galleryItem->update(['is_featured' => $request->is_featured]);
        
        return response()->json([
            'success' => true,
            'message' => 'Gallery item featured status updated successfully.',
            'data' => $galleryItem->fresh(),
        ]);
    }

    /**
     * Galéria admin felület konfigurációja
     * Kategóriák és alkategóriák listája dropdown-okhoz
     */
    public function config()
    {
        $categories = Category::with('subcategories')->navOrdered()->get();
        return CategoryResource::collection($categories);
    }

    /**
     * Kép feltöltés kezelése
     */
    private function handleImageUpload(Request $request, array $validated, ?GalleryItem $existingItem = null): string
    {
        $image = $request->file('image') ?? $request->file('file');
        
        // Kategória/alkategória meghatározása
        $cat = isset($validated['category_id']) ? Category::find($validated['category_id']) : null;
        $sub = isset($validated['subcategory_id']) ? Subcategory::find($validated['subcategory_id']) : null;
        
        // Fallback meglévő elemre (update esetén)
        if (!$cat && !$sub && $existingItem) {
            $cat = $existingItem->category;
            $sub = $existingItem->subcategory;
        }
        
        $categorySlug = Str::slug($sub?->slug ?? $cat?->type ?? 'uncategorized');
        $title = $validated['title'] ?? $existingItem?->title ?? 'untitled';
        $titleSlug = Str::slug($title);
        $timestamp = now()->timestamp;
        $extension = $image->getClientOriginalExtension();
        
        $filename = "{$titleSlug}-{$timestamp}.{$extension}";
        $directory = "gallery/{$categorySlug}";
        
        return $image->storeAs($directory, $filename, 'public');
    }
}
