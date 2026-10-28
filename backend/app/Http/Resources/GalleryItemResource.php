<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Services\GalleryService;

class GalleryItemResource extends JsonResource
{
    // galéria elem adatainak frontend formátumra alakítása (GalleryService delegálás)
    public function toArray(Request $request): array
    {
        $svc = app(GalleryService::class);
        return $svc->mapItem($this->resource);
    }
}
