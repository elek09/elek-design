<?php

namespace App\Services;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthService
{
    public function register(array $data): array
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        Auth::login($user);
        request()->session()->regenerate();

        return $this->success(['user' => $this->userPayload($user)], 201);
    }

    public function login(array $credentials): array
    {
        $rememberRequested = (bool)($credentials['remember'] ?? false);
        $attemptCredentials = [
            'email' => $credentials['email'] ?? '',
            'password' => $credentials['password'] ?? ''
        ];

        // Mindig remember nélkül próbálunk, majd utólag kezeljük, hogy adminnál ne legyen tartós cookie.
        if (!Auth::attempt($attemptCredentials, false)) {
            return $this->error(['credentials' => ['Invalid credentials']], 401);
        }

        request()->session()->regenerate();
        $user = Auth::user();

        // Ha nem admin és kérte a remember-t, újralogin tartós módban.
        if ($user && !$user->admin && $rememberRequested) {
            Auth::login($user, true);
        }

        return $this->success(['user' => $this->userPayload($user)]);
    }

    public function logout(): array
    {
        Auth::guard('web')->logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();

        return $this->success(['message' => 'Logout successful']);
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'admin' => (bool) $user->admin,
        ];
    }

    private function success(array $data, int $status = 200): array
    {
        return [
            'success' => true,
            'status' => $status,
            'data' => $data,
            'errors' => []
        ];
    }

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
