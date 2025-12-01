<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Seedek futtatása függőségek szerint
        $this->call([
            AdminUserSeeder::class,
            CategorySeeder::class,        // Product és Gallery függ tőle
            GalleryImageSeeder::class,
            ProductSeeder::class,
            OrderDemoSeeder::class,
        ]);
    }
}
