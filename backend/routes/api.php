<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BootstrapController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;

use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\GalleryController as AdminGalleryController;
use App\Http\Controllers\Admin\SubcategoryController as AdminSubcategoryController;

Route::prefix('v1')->group(function () {
    // Auth endpoint-ok session/cookie middleware-ekkel (SPA authentikáció)
    Route::prefix('auth')->middleware([
        EncryptCookies::class,
        AddQueuedCookiesToResponse::class,
        StartSession::class,
        ShareErrorsFromSession::class,
        ValidateCsrfToken::class,
    ])->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        Route::post('logout', [AuthController::class, 'logout']);
    });

    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{slug}', [ProductController::class, 'show']);

    Route::get('categories', [CategoryController::class, 'getCategories']);
    Route::get('categories/{categoryId}/subcategories', [CategoryController::class, 'getSubcategoriesByCategory']);

    Route::get('bootstrap', BootstrapController::class);

    Route::prefix('gallery')->group(function () {
        Route::get('/', [GalleryController::class, 'index']);
        Route::get('/top', [GalleryController::class, 'top']);
        Route::get('/section/{section}', [GalleryController::class, 'section']);
    });

    // Publikus űrlapok (rate limited)
    Route::post('orders/submit', [OrderController::class, 'storePublic'])->middleware('throttle:20,1');
    Route::post('contact', [ContactController::class, 'store'])->middleware('throttle:20,1');

    // Bejelentkezett felhasználók
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('orders', [OrderController::class, 'store']);
        Route::get('orders/my', [OrderController::class, 'my']);
    });

    // Admin route-ok
    Route::prefix('admin')->middleware(['auth:sanctum', 'admin.api'])->group(function () {
        Route::get('me', [AdminAuthController::class, 'me']);
        Route::get('bootstrap', BootstrapController::class);
        Route::get('dashboard/stats', [AdminDashboardController::class, 'stats']);

        Route::apiResource('gallery', AdminGalleryController::class)->parameters(['gallery' => 'galleryItem']);
        Route::put('gallery/{galleryItem}/status', [AdminGalleryController::class, 'updateStatus']);
        Route::put('gallery/{galleryItem}/featured', [AdminGalleryController::class, 'updateFeaturedStatus']);

        Route::get('orders', [OrderController::class, 'index']);
        Route::get('orders/{order}', [OrderController::class, 'adminShow']);
        Route::put('orders/{order}/status', [OrderController::class, 'updateStatus']);
        Route::put('orders/{order}', [OrderController::class, 'updateAdmin']);
        Route::delete('orders/{order}', [OrderController::class, 'destroy']);
        Route::post('orders/{order}/confirm', [OrderController::class, 'sendConfirmation']);

        Route::apiResource('categories', AdminCategoryController::class)->except(['create', 'edit']);
        Route::post('categories/reorder', [AdminCategoryController::class, 'reorder']);
        
        Route::apiResource('subcategories', AdminSubcategoryController::class)->except(['create', 'edit']);
        Route::post('subcategories/reorder', [AdminSubcategoryController::class, 'reorder']);
    });
});
