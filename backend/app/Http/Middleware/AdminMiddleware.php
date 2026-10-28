<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    // bejövő kérés feldolgozása - admin web védelem
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check()) {
            return redirect()->route('login');
        }

        if (!auth()->user()->admin) {
            abort(403, 'Hozzáférés megtagadva. Admin jogosultság szükséges.');
        }

        return $next($request);
    }
}