<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Admin\GalleryController as AdminGalleryController;
use App\Http\Controllers\Admin\SubcategoryController as AdminSubcategoryController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Models\Category;
use App\Http\Resources\CategoryResource as PublicCategoryResource;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\SimpleOrderController;
use App\Http\Controllers\ContactController;

Route::prefix('v1')->group(function () {
    // Auth (SPA cookie-based via Sanctum / session)
    Route::prefix('auth')->middleware([
        \Illuminate\Cookie\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ])->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        // Logout legyen idempotens: ne igényeljen auth middleware-t, ha a session már nincs.
        Route::post('logout', [AuthController::class, 'logout']);
    });

    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{slug}', [ProductController::class, 'show']);

    Route::get('categories', [CategoryController::class, 'getCategories']);
    Route::get('categories/{categoryId}/subcategories', [CategoryController::class, 'getSubcategoriesByCategory']);

    // Bootstrap: consolidated startup payload (header, categories, featured)
    Route::get('bootstrap', \App\Http\Controllers\BootstrapController::class);

    // Gallery routes
    Route::prefix('gallery')->group(function () {
        Route::get('/', [GalleryController::class, 'index']);
        Route::get('/top', [GalleryController::class, 'top']);
        // Dynamic, DB-driven section route (e.g., eletter, uzletter, 3d-falboritas, ives-butorok)
        Route::get('/section/{section}', [GalleryController::class, 'section']);
    });


    Route::post('orders/submit', [OrderController::class, 'storePublic'])->middleware('throttle:20,1');
    // Minimal example endpoint for simple email sending (name/email/product/quantity)

    // Contact form endpoint (rate limited & public)
    Route::post('contact', [ContactController::class, 'store'])->middleware('throttle:20,1');

    // Bejelentkezett
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('orders', [OrderController::class, 'store']);
        Route::get('orders/my', [OrderController::class, 'my']);
    });

    // Admin endpoints (use general auth login; protect with admin middleware)
    Route::prefix('admin')->group(function () {
        Route::middleware(['auth:sanctum', 'admin.api'])->group(function () {
            Route::get('me', [AdminAuthController::class, 'me']);
            // Admin bootstrap (supports cache bypass via ?fresh=1)
            Route::get('bootstrap', \App\Http\Controllers\BootstrapController::class);

            // Dashboard stats
            Route::get('dashboard/stats', [AdminDashboardController::class, 'stats']);

            // Gallery management
            Route::apiResource('gallery', AdminGalleryController::class)->parameters([
                'gallery' => 'galleryItem'
            ]);
            Route::put('gallery/{galleryItem}/status', [AdminGalleryController::class, 'updateStatus']);
            Route::put('gallery/{galleryItem}/featured', [AdminGalleryController::class, 'updateFeaturedStatus']);

            // Orders management
            Route::get('orders', [OrderController::class, 'index']);
            Route::get('orders/{order}', [OrderController::class, 'adminShow']);
            Route::put('orders/{order}/status', [OrderController::class, 'updateStatus']);
            Route::put('orders/{order}', [OrderController::class, 'updateAdmin']);
            Route::delete('orders/{order}', [OrderController::class, 'destroy']);
            Route::post('orders/{order}/confirm', [OrderController::class, 'sendConfirmation']);

            // Category management
            Route::apiResource('categories', AdminCategoryController::class)->except(['create', 'edit']);
            Route::post('categories/reorder', [AdminCategoryController::class, 'reorder']);
            // Subcategory management
            Route::apiResource('subcategories', AdminSubcategoryController::class)->except(['create', 'edit']);
            Route::post('subcategories/reorder', [AdminSubcategoryController::class, 'reorder']);
        });
    });
});
