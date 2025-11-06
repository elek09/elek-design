<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\GalleryImageSeeder;
use Illuminate\Support\Str;
use App\Models\Category;
use Database\Seeders\ProductSeeder;
use Database\Seeders\OrderDemoSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'email_verified_at' => now(),
                'password' => bcrypt('password'),
                'remember_token' => Str::random(10),
            ]
        );

        $this->call([
            AdminUserSeeder::class,
            GalleryImageSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
            OrderDemoSeeder::class,
        ]);
    }
}
