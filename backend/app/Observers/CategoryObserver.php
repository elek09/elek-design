<?php

namespace App\Observers;

use App\Http\Controllers\BootstrapController;
use App\Models\Category;
use Illuminate\Support\Facades\Cache;

class CategoryObserver
{
    public function saved(Category $category): void
    {
        $relevant = ['name', 'type', 'subcategories', 'nav_order'];
        foreach ($relevant as $attr) {
            if ($category->wasChanged($attr)) {
                Cache::forget(BootstrapController::CACHE_KEY);
                break;
            }
        }
    }

    public function deleted(Category $category): void
    {
        Cache::forget(BootstrapController::CACHE_KEY);
    }
}
