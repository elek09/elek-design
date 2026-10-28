<?php

return [
    // Alkalmazás induló adatok cache élettartama (perc)
    'bootstrap_cache_ttl' => env('BOOTSTRAP_CACHE_TTL', 10),

    // Admin frontend alkalmazás URL (email linkekhez)
    'admin_app_url' => env('ADMIN_APP_URL', env('APP_URL', 'http://localhost')),
];
