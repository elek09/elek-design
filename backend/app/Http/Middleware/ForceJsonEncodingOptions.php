<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * JSON válaszok UTF-8 karakterek és URL-ek escape-elés nélkül (magyar karakterek, olvashatóság)
 */
class ForceJsonEncodingOptions
{
    // bejövő kérés feldolgozása
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        if ($response instanceof JsonResponse) {
            $response->setEncodingOptions(
                $response->getEncodingOptions()
                | JSON_UNESCAPED_UNICODE
                | JSON_UNESCAPED_SLASHES
            );

            // lokális környezetben pretty-print a könnyebb debuggoláshoz
            if (app()->isLocal()) {
                $response->setEncodingOptions(
                    $response->getEncodingOptions() | JSON_PRETTY_PRINT
                );
            }
        }

        return $response;
    }
}
