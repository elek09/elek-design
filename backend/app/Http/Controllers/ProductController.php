<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;

class ProductController extends Controller
{
    public function index(Request $r)
    {
        $q = Product::query()->active();
        if ($s = $r->query('q'))
            $q->where(fn($x) => $x->where('name', 'like', "%$s%")->orWhere('description', 'like', "%$s%"));
        return $q->latest()->paginate(20);
    }

    public function store(Request $request)
    {
        //
    }

    public function show($slug)
    {
        return Product::active()->where('slug', $slug)->firstOrFail();
    }

    public function update(Request $request, string $id)
    {
        //
    }

    public function destroy(string $id)
    {
        //
    }
}
