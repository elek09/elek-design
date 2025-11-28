<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\Category;
use App\Observers\CategoryObserver;
use App\Models\GalleryItem;
use App\Observers\GalleryItemObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        Gate::define('admin', fn(\App\Models\User $u) => (bool) $u->admin);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Category::observe(CategoryObserver::class);
        GalleryItem::observe(GalleryItemObserver::class);

    }
}
