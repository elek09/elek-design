<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Ensure JSON responses use unescaped Unicode and slashes for readability.
 */
class ForceJsonEncodingOptions
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        /** @var \Symfony\Component\HttpFoundation\Response $response */
        $response = $next($request);

        if ($response instanceof JsonResponse) {
            // Preserve existing options and add unescaped Unicode and slashes
            $response->setEncodingOptions(
                $response->getEncodingOptions()
                | JSON_UNESCAPED_UNICODE
                | JSON_UNESCAPED_SLASHES
            );

            // Optionally pretty-print in local environment for easier debugging
            if (app()->isLocal()) {
                $response->setEncodingOptions(
                    $response->getEncodingOptions() | JSON_PRETTY_PRINT
                );
            }
        }

        return $response;
    }
}
