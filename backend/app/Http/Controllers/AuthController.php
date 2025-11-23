<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Services\AuthService;

class AuthController extends Controller
{
    public function __construct(private AuthService $authService)
    {
    }

    public function register(RegisterRequest $request)
    {
        $result = $this->authService->register($request->validated());
        return response()->json($result, $result['status']);
    }

    public function login(LoginRequest $request)
    {
        $result = $this->authService->login($request->validated());
        return response()->json($result, $result['status']);
    }

    public function logout()
    {
        $result = $this->authService->logout();
        return response()->json($result, $result['status']);
    }
}


