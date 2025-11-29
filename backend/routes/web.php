<?php

use Illuminate\Support\Facades\Route;

// Backend API - nincs web frontend
Route::get('/', function () {
    return response()->json([
        'app' => config('app.name'),
        'version' => '1.0',
        'api' => url('/api/v1'),
    ]);
});