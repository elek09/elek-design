<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\AuthController;

Route::prefix('v1')->group(function () {
    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login']);
        Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    });

    // Publikus
    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{slug}', [ProductController::class, 'show']);

    // Gallery routes
    Route::prefix('gallery')->group(function () {
        Route::get('/', [GalleryController::class, 'index']);
        Route::get('/top', [GalleryController::class, 'top']);
        Route::get('/eletter', [GalleryController::class, 'eletter']);
        Route::get('/uzletter', [GalleryController::class, 'uzletter']);
        Route::get('/wall-cladding', [GalleryController::class, 'wallCladding']);
        Route::get('/curved-furniture', [GalleryController::class, 'curvedFurniture']);
    });

    // Bejelentkezett
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('orders', [OrderController::class, 'store']);
        Route::get('orders/my', [OrderController::class, 'my']);
    });

    // Admin
    Route::middleware(['auth:sanctum', 'can:admin'])->group(function () {
        Route::get('orders', [OrderController::class, 'index']);
        Route::put('orders/{order}/status', [OrderController::class, 'updateStatus']);
        Route::post('gallery', [GalleryController::class, 'store']);
    });
});
