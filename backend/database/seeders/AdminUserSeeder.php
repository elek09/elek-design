<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create or update main admin user without exposing plaintext password in source
        $passwordHash = env('ADMIN_DEFAULT_PASSWORD_HASH');
        $passwordPlain = env('ADMIN_DEFAULT_PASSWORD');

        if (!$passwordHash && $passwordPlain) {
            $passwordHash = Hash::make($passwordPlain);
        }

        $data = [
            'name' => 'Elek Design Admin',
            'admin' => true,
            'email_verified_at' => now(),
        ];

        if ($passwordHash) {
            $data['password'] = $passwordHash;
        }

        User::updateOrCreate(
            ['email' => 'admin@elekdesign.hu'],
            $data
        );
    }
}
