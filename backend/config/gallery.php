<?php

return [
    /**
     * Fájlnév prefix → kategória/alkategória slug mapping
     * 
     * A GalleryImportService használja a seeder során:
     * - Ha fájlnév 'konyha'-val kezdődik → 'konyha' kategória
     * - Ha 'iroda'-val → 'iroda-berendezes' alkategória
     * - Ha nincs találat → 'egyeb'
     */
    'keyword_category_map' => [
        // Főkategóriák (type)
        'konyha' => 'konyha',
        'nappali' => 'nappali',
        'furdoszoba' => 'furdoszoba',
        'haloszoba' => 'haloszoba',
        'gardrob' => 'gardrob',
        'lepcso' => 'lepcso',
        'iroda' => 'iroda-berendezes',
        'uzlet' => 'uzlet-berendezes',
        'kiallitasibutorok' => 'kiallitasi-butorok',
        '3d' => '3d-falboritas',
        '3dfal' => '3d-falboritas',
        'ivesbutorok' => 'ives-butorok',
        'ives' => 'ives-butorok',
        
        // Egyéb (logo, brand asset)
        'elekdesign_logo' => 'egyeb',
        'elekdesign-logo' => 'egyeb',
        'logo' => 'egyeb',
        'elek_imre' => 'egyeb',
        'elekimre' => 'egyeb',
    ],
];
