<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    // kategória adatainak frontend formátumra alakítása
    public function toArray(Request $request): array
    {
        $isAdmin = str_contains($request->path(), '/api/v1/admin/');
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'nav_order' => $this->nav_order,
            'subcategories' => $this->whenLoaded('subcategories', function () use ($isAdmin) {
                return $this->subcategories->map(function ($sub) use ($isAdmin) {
                    $data = [
                        'id' => $sub->id,
                        'name' => $sub->name,
                        'slug' => $sub->slug ?? null,
                    ];
                    if ($isAdmin) {
                        $data['nav_order'] = $sub->nav_order;
                        $data['category_id'] = $sub->category_id;
                    }
                    return $data;
                });
            }, []),
            'admin' => $this->when($isAdmin, true),
            'created_at' => optional($this->created_at)?->toISOString(),
            'updated_at' => optional($this->updated_at)?->toISOString(),
        ];
    }
}
