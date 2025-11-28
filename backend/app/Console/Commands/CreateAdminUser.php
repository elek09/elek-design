<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
// Str import nem szükséges, eltávolítva

class CreateAdminUser extends Command
{
    /**
     * A parancs aláírása.
     */
    protected $signature = 'user:create-admin {email} {name} {password} {--force : Felülírja, ha már létezik user ezzel az emaillel}';

    /**
     * Leírás.
     */
    protected $description = 'Új admin felhasználó létrehozása (email, kötelező név és jelszó).';

    /**
     * Parancs futtatása.
     */
    public function handle(): int
    {
        $email = trim($this->argument('email'));
        $name = trim($this->argument('name'));
        $password = (string) $this->argument('password');
        $force = (bool) $this->option('force');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Hibás email formátum.');
            return 1;
        }

        $existing = User::where('email', $email)->first();
        if ($existing && !$force) {
            $this->error('Már létezik felhasználó ezzel az emaillel. Használd a --force kapcsolót a felülíráshoz.');
            return 1;
        }
        
        // Egyszerű jelszó validáció (minimum 8 karakter)
        if (strlen($password) < 8) {
            $this->error('A jelszó legyen legalább 8 karakter.');
            return 1;
        }

        if ($existing && $force) {
            $existing->update([
                'name' => $name,
                'password' => $password,
                'admin' => true,
                'email_verified_at' => now(),
            ]);
            $this->info('Admin felhasználó frissítve: ' . $existing->email);
            return 0;
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password, // Hashed automatikusan a model cast miatt
            'admin' => true,
            'email_verified_at' => now(),
        ]);

        $this->info('Admin létrehozva: ' . $user->email);
        return 0;
    }

    // Automatikus jelszógenerálás eltávolítva – szándékosan nincs segédfüggvény.
}