<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Admin\GalleryController as AdminGalleryController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Models\Category;
use App\Http\Resources\CategoryResource as PublicCategoryResource;
use App\Http\Controllers\NavigationController;
use App\Http\Controllers\CartController;

Route::prefix('v1')->group(function () {
    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    });

    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{slug}', [ProductController::class, 'show']);

    Route::get('categories', [NavigationController::class, 'getCategories']);

    // Bootstrap: consolidated startup payload (header, categories, featured)
    Route::get('bootstrap', \App\Http\Controllers\BootstrapController::class);

    // Gallery routes
    Route::prefix('gallery')->group(function () {
        Route::get('/', [GalleryController::class, 'index']);
        Route::get('/top', [GalleryController::class, 'top']);
        // Dynamic, DB-driven section route (e.g., eletter, uzletter, 3d-falboritas, ives-butorok)
        Route::get('/section/{section}', [GalleryController::class, 'section']);
    });

    // Cart (session-based, guest-friendly). Attach session middleware only to these routes.
    Route::prefix('cart')->middleware([
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
    ])->group(function () {
        Route::get('/', [CartController::class, 'index']);
        Route::post('items', [CartController::class, 'add']);
        Route::put('items/{productId}', [CartController::class, 'update']);
        Route::delete('items/{productId}', [CartController::class, 'remove']);
        Route::delete('/', [CartController::class, 'clear']);
        Route::post('checkout', [CartController::class, 'checkout']);
    });

    // Bejelentkezett
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('orders', [OrderController::class, 'store']);
        Route::get('orders/my', [OrderController::class, 'my']);
    });

    // Admin Authentication
    Route::prefix('admin')->group(function () {
        Route::post('login', [AdminAuthController::class, 'login']);
        
        Route::middleware(['auth:sanctum', 'admin.api'])->group(function () {
            Route::post('logout', [AdminAuthController::class, 'logout']);
            Route::get('me', [AdminAuthController::class, 'me']);

            // Page management
            Route::post('pages', [PageController::class, 'store']);
            Route::put('pages/{page}', [PageController::class, 'update']);
            Route::delete('pages/{page}', [PageController::class, 'destroy']);
            
            // Gallery management
            Route::apiResource('gallery', AdminGalleryController::class)->parameters([
                'gallery' => 'galleryItem'
            ]);
            Route::put('gallery/{galleryItem}/status', [AdminGalleryController::class, 'updateStatus']);
            Route::put('gallery/{galleryItem}/featured', [AdminGalleryController::class, 'updateFeaturedStatus']);
            
            // Orders management
            Route::get('orders', [OrderController::class, 'index']);
            Route::put('orders/{order}/status', [OrderController::class, 'updateStatus']);

            // Category management (include index for admin UI)
            Route::get('categories', [AdminCategoryController::class, 'index']);
            Route::apiResource('categories', AdminCategoryController::class)->except(['create', 'edit']);
        });
    });
});
