<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create main admin user
        User::updateOrCreate(
            ['email' => 'admin@elekdesign.hu'],
            [
                'name' => 'Elek Design Admin',
                'password' => Hash::make('ElekAdmin2025!'),
                'admin' => true,
                'email_verified_at' => now()
            ]
        );

        // Backup admin user
        User::updateOrCreate(
            ['email' => 'admin@localhost'],
            [
                'name' => 'Local Admin',
                'password' => Hash::make('password123'),
                'admin' => true,
                'email_verified_at' => now()
            ]
        );
    }
}
