<?php

namespace App\Observers;

use App\Http\Controllers\BootstrapController;
use App\Models\GalleryItem;
use Illuminate\Support\Facades\Cache;

class GalleryItemObserver
{
    // galéria elem mentésekor cache invalidálás ha releváns mező változott
    public function saved(GalleryItem $item): void
    {
        $relevant = ['is_featured', 'is_active', 'image_path', 'title', 'category'];
        foreach ($relevant as $attr) {
            if ($item->wasChanged($attr)) {
                Cache::forget(BootstrapController::CACHE_KEY);
                break;
            }
        }
    }

    // galéria elem törlésekor cache invalidálás
    public function deleted(GalleryItem $item): void
    {
        Cache::forget(BootstrapController::CACHE_KEY);
    }
}
