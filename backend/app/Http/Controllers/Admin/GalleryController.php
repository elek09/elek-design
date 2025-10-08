<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GalleryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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

    public function create()
    {
        // For API, this can return available categories
        return response()->json([
            'success' => true,
            'categories' => ['featured', 'work', 'ui', 'misc']
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|in:featured,work,ui,misc',
            'description' => 'nullable|string',
            'image' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
            'active' => 'boolean'
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $category = $request->category;
            
            // Generate unique filename
            $filename = time() . '_' . Str::slug($request->title) . '.' . $image->getClientOriginalExtension();
            
            // Store in category subfolder
            $path = $image->storeAs("gallery/{$category}", $filename, 'public');
            
            // Create gallery item
            GalleryItem::create([
                'title' => $request->title,
                'category' => $category,
                'description' => $request->description,
                'image_path' => $path,
                'active' => $request->boolean('active', true)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Gallery item created successfully.',
                'data' => GalleryItem::latest()->first()
            ], 201);
        }

        return response()->json([
            'success' => false,
            'message' => 'Image upload failed.'
        ], 400);
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

    public function update(Request $request, GalleryItem $galleryItem)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|in:featured,work,ui,misc',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'active' => 'boolean'
        ]);

        $data = [
            'title' => $request->title,
            'category' => $request->category,
            'description' => $request->description,
            'active' => $request->boolean('active', true)
        ];

        // Handle new image upload if provided
        if ($request->hasFile('image')) {
            // Delete old image
            if ($galleryItem->image_path && Storage::disk('public')->exists($galleryItem->image_path)) {
                Storage::disk('public')->delete($galleryItem->image_path);
            }

            $image = $request->file('image');
            $category = $request->category;
            $filename = time() . '_' . Str::slug($request->title) . '.' . $image->getClientOriginalExtension();
            $path = $image->storeAs("gallery/{$category}", $filename, 'public');
            
            $data['image_path'] = $path;
        }

        $galleryItem->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Gallery item updated successfully.',
            'data' => $galleryItem->fresh()
        ]);
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

    public function toggleActive(GalleryItem $galleryItem)
    {
        $galleryItem->update(['active' => !$galleryItem->active]);
        
        return response()->json([
            'success' => true,
            'message' => 'Gallery item status updated.',
            'data' => $galleryItem->fresh()
        ]);
    }
}