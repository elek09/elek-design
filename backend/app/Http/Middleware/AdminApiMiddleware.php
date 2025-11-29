<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminApiMiddleware
{
    // bejövő kérés feldolgozása - admin API védelem
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Hitelesítés szükséges'
            ], 401);
        }

        if (!$request->user()->admin) {
            return response()->json([
                'success' => false,
                'message' => 'Hozzáférés megtagadva. Admin jogosultság szükséges.'
            ], 403);
        }

        return $next($request);
    }
}