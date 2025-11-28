<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Services\GalleryService;

class GalleryItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Delegate to the service to keep a single source of truth for mapping
        $svc = app(GalleryService::class);
        return $svc->mapItem($this->resource);
    }
}
