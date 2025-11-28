<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

class AuthController extends Controller
{
    public function me()
    {
        $user = request()->user();
        return response()->json([
            'success' => true,
            'status' => 200,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'admin' => (bool) $user->admin
                ]
            ],
            'errors' => []
        ], 200);
    }
}
