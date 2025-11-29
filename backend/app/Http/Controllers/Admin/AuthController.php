<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    /**
     * Bejelentkezett admin felhasználó adatainak lekérése
     * Middleware biztosítja, hogy csak admin férjen hozzá
     */
    public function me(): JsonResponse
    {
        $user = request()->user();
        
        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'admin' => (bool) $user->admin,
                ],
            ],
        ]);
    }
}
