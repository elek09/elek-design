<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\GalleryItem;

class GalleryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = GalleryItem::query()->where('active', true);
        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }
        return $query->latest()->paginate(24)->through(fn($item) => [
            'id' => $item->id,
            'title' => $item->title,
            'category' => $item->category,
            'url' => asset('storage/' . $item->image_path),
        ]);
    }

    private function sanitizeBase(string $title): string
    {
        $base = preg_replace('/\(\d+\)$/', '', $title);     // vedd le a végéről a (n)-t
        $base = \Illuminate\Support\Str::ascii($base);
        $base = strtolower($base);
        $base = preg_replace('/[^a-z0-9\(\)]+/', '', $base);
        return $base ?: 'kep';
    }

    private function nextFreeName(string $base, string $ext, string $category): string
    {
        $ext = ltrim($ext, '.');
        $dir = "gallery/{$category}";
        $candidate = "{$base}.{$ext}";
        $i = 1;
        while (\Storage::disk('public')->exists($dir . '/' . $candidate)) {
            $candidate = "{$base}({$i}).{$ext}";
            $i++;
        }
        return $candidate;
    }

    public function store(Request $r)
    {
        $r->validate([
            'title' => ['required', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:60'],
            'image' => ['required', 'image', 'max:5120'],
        ]);

        $category = $r->input('category', 'work'); // default
        $base = $this->sanitizeBase($r->input('title'));
        $ext = $r->file('image')->getClientOriginalExtension();
        $name = $this->nextFreeName($base, $ext, $category);

        $path = \Storage::disk('public')->putFileAs("gallery/{$category}", $r->file('image'), $name);

        $item = GalleryItem::create([
            'title' => $r->input('title'),
            'category' => $category,
            'image_path' => $path,
            'active' => true,
        ]);

        return response()->json([
            'id' => $item->id,
            'title' => $item->title,
            'url' => asset('storage/' . $item->image_path),
            'category' => $item->category,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
