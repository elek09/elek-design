<?php

namespace App\Observers;

use App\Http\Controllers\BootstrapController;
use App\Models\GalleryItem;
use Illuminate\Support\Facades\Cache;

class GalleryItemObserver
{
    public function saved(GalleryItem $item): void
    {
        // Invalidate bootstrap payload if featured visibility could change
        $relevant = ['is_featured', 'is_active', 'image_path', 'title', 'category'];
        foreach ($relevant as $attr) {
            if ($item->wasChanged($attr)) {
                Cache::forget(BootstrapController::CACHE_KEY);
                break;
            }
        }
    }

    public function deleted(GalleryItem $item): void
    {
        Cache::forget(BootstrapController::CACHE_KEY);
    }
}
