<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class DeleteAdminUser extends Command
{
    protected $signature = 'user:delete-admin {email} {--soft : Nem törli, csak elveszi az admin jogot} {--force : Megerősítés nélkül fut}';

    protected $description = 'Admin felhasználó törlése vagy admin jogának visszavonása.';

    public function handle(): int
    {
        $email = trim($this->argument('email'));
        $soft = (bool) $this->option('soft');
        $force = (bool) $this->option('force');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Hibás email formátum.');
            return 1;
        }

        $user = User::where('email', $email)->first();
        if (!$user) {
            $this->error('Nincs ilyen felhasználó: ' . $email);
            return 1;
        }

        if (!$force) {
            $question = $soft
                ? 'Biztosan visszavonod az admin jogot ettől a felhasználótól? (' . $email . ')'
                : 'Biztosan TÖRLÖD az admin felhasználót? (' . $email . ') Ez végleges.';
            if (!$this->confirm($question)) {
                $this->info('Megszakítva.');
                return 0;
            }
        }

        if ($soft) {
            $user->update(['admin' => false]);
            $this->info('Admin jog visszavonva: ' . $email);
            return 0;
        }

        $user->delete();
        $this->info('Admin felhasználó törölve: ' . $email);
        return 0;
    }
}