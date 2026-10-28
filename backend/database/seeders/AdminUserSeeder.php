<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user létrehozása env-ből vett jelszóval (hash vagy plaintext)
        $passwordHash = env('ADMIN_DEFAULT_PASSWORD_HASH');
        $passwordPlain = env('ADMIN_DEFAULT_PASSWORD');

        if (!$passwordHash && !$passwordPlain) {
            $this->command->error('❌ Hiányzik az ADMIN_DEFAULT_PASSWORD vagy ADMIN_DEFAULT_PASSWORD_HASH env változó!');
            return;
        }

        if (!$passwordHash && $passwordPlain) {
            $passwordHash = Hash::make($passwordPlain);
        }

        User::updateOrCreate(
            ['email' => 'admin@elekdesign.hu'],
            [
                'name' => 'Elek Design Admin',
                'admin' => true,
                'email_verified_at' => now(),
                'password' => $passwordHash,
            ]
        );

        $this->command->info('✓ Admin user létrehozva/frissítve: admin@elekdesign.hu');
    }
}
