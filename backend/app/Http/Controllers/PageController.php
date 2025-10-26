<?php

namespace App\Http\Controllers;

use App\Models\Page;
use Illuminate\Http\Request;

class PageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Page::all(['id', 'route', 'title']);
    }

    /**
     * Display the specified resource.
     */
    public function show($route)
    {
        $page = Page::where('route', $route)->first();
        return $page ? response()->json($page) : response()->json(['message' => 'Page not found'], 404);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'route' => 'required|string|unique:pages,route',
            'title' => 'required|string|max:255',
            'components' => 'sometimes|array'
        ]);

        $page = Page::create($validated);

        return response()->json($page, 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Page $page)
    {
        $validated = $request->validate([
            'route' => 'required|string|unique:pages,route,' . $page->id,
            'title' => 'required|string|max:255',
            'components' => 'sometimes|array'
        ]);

        $page->update($validated);

        return response()->json($page);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Page $page)
    {
        $page->delete();

        return response()->json(null, 204);
    }
}
