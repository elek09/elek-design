<?php

namespace App\Services;

use Illuminate\Support\Facades\Auth;
use App\Models\User;

class AuthService
{
    /**
     * Új felhasználó regisztrálása és automatikus bejelentkeztetés
     */
    public function register(array $data): array
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'], // hashed User modelben
        ]);

        Auth::login($user);
        request()->session()->regenerate();

        return $this->success(['user' => $this->userPayload($user)], 201);
    }

    /**
     * admin-nál nincs "remember me", vendégnél van
     */
    public function login(array $credentials): array
    {
        $rememberRequested = (bool)($credentials['remember'] ?? false);
        $attemptCredentials = [
            'email' => $credentials['email'] ?? '',
            'password' => $credentials['password'] ?? ''
        ];

        if (!Auth::attempt($attemptCredentials, false)) {
            return $this->error(['credentials' => ['Invalid credentials']], 401);
        }

        request()->session()->regenerate();
        $user = Auth::user();

        // Ha nem admin és kérte a remember-t, újralogin tokennel
        if ($user && !$user->admin && $rememberRequested) {
            Auth::login($user, true);
        }

        return $this->success(['user' => $this->userPayload($user)]);
    }

    /**
     * Kijelentkezés: session törlése
     */
    public function logout(): array
    {
        Auth::guard('web')->logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();

        return $this->success(['message' => 'Logout successful']);
    }

    /**
     * User adat formázása API válaszhoz
     */
    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'admin' => (bool) $user->admin,
        ];
    }

    /**
     * Sikeres válasz formátum
     */
    private function success(array $data, int $status = 200): array
    {
        return [
            'success' => true,
            'status' => $status,
            'data' => $data,
            'errors' => []
        ];
    }

    /**
     * Hiba válasz formátum
     */
    private function error(array $errors, int $status): array
    {
        return [
            'success' => false,
            'status' => $status,
            'data' => null,
            'errors' => $errors
        ];
    }
}
