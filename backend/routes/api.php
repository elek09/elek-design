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
use App\Http\Controllers\NavigationController;

Route::prefix('v1')->group(function () {
    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login']);
        Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    });

    // Publikus
    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{slug}', [ProductController::class, 'show']);

    // Public Category route
    Route::get('categories', [AdminCategoryController::class, 'index']);
    // Public header navigation config
    Route::get('navigation/header', [NavigationController::class, 'header']);
    // Alias for clients calling /api/v1/header
    Route::get('header', [NavigationController::class, 'header']);

    // Gallery routes
    Route::prefix('gallery')->group(function () {
        Route::get('/', [GalleryController::class, 'index']);
        Route::get('/top', [GalleryController::class, 'top']);
        Route::get('/eletter', [GalleryController::class, 'eletter']);
        Route::get('/uzletter', [GalleryController::class, 'uzletter']);
        Route::get('/wall-cladding', [GalleryController::class, 'wallCladding']);
        Route::get('/curved-furniture', [GalleryController::class, 'curvedFurniture']);
        // Dynamic, DB-driven section route (e.g., eletter, uzletter, wall-cladding, curved-furniture)
        Route::get('/section/{section}', [GalleryController::class, 'section']);
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
            Route::get('gallery/config', [AdminGalleryController::class, 'config']);
            Route::apiResource('gallery', AdminGalleryController::class)->parameters([
                'gallery' => 'galleryItem'
            ]);
            Route::put('gallery/{galleryItem}/status', [AdminGalleryController::class, 'updateStatus']);
            Route::put('gallery/{galleryItem}/featured', [AdminGalleryController::class, 'updateFeaturedStatus']);
            
            // Orders management
            Route::get('orders', [OrderController::class, 'index']);
            Route::put('orders/{order}/status', [OrderController::class, 'updateStatus']);

            // Category management
            Route::apiResource('categories', AdminCategoryController::class)->except(['index']);
        });
    });

    // Legacy admin routes (to be removed later)
    Route::middleware(['auth:sanctum', 'can:admin'])->group(function () {
        Route::post('gallery', [GalleryController::class, 'store']);
    });
});
