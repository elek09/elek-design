<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContactMessageRequest;
use App\Mail\ContactMessageMail;
use App\Mail\ContactMessageUserMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;

class ContactController extends Controller
{
    /**
     * Kapcsolatfelvételi üzenet küldése
     * Egyszerű spam szűrés: URL limit + ismétlődő karakterek
     * Admin és user email küldés (hibák csak logolva, nem blokkol)
     */
    public function store(StoreContactMessageRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Spam heurisztika: max 3 URL és 10 ismétlődő karakter
        $urlCount = preg_match_all('/https?:\/\//i', $data['message'] ?? '', $m);
        if ($urlCount > 3) {
            return response()->json([
                'success' => false,
                'errors' => ['message' => ['Túl sok link az üzenetben.']],
            ], 422);
        }
        if (preg_match('/(.)\1{9,}/', $data['message'])) {
            return response()->json([
                'success' => false,
                'errors' => ['message' => ['Gyanús ismétlődő karakterek.']],
            ], 422);
        }

        $payload = [
            'name' => $data['name'],
            'email' => $data['email'],
            'subject' => $data['subject'],
            'message' => $data['message'],
            'ip' => $request->ip(),
        ];

        $mailSent = true;
        $userMailSent = true;
        try {
            // Admin email: config admin_recipients első elem, fallback a globális from address
            $adminTo = config('mail.admin_recipients')[0] ?? config('mail.from.address');
            Mail::to($adminTo)->send(new ContactMessageMail($payload));
        } catch (\Throwable $e) {
            $mailSent = false;
            Log::warning('Contact form email send failed', [ 'error' => $e->getMessage() ]);
        }

        try {
            Mail::to($payload['email'])->send(new ContactMessageUserMail($payload));
        } catch (\Throwable $e) {
            $userMailSent = false;
            Log::warning('Contact form user confirmation failed', [ 'error' => $e->getMessage() ]);
        }

        return response()->json([
            'success' => true,
            'admin_mail_sent' => $mailSent,
            'user_mail_sent' => $userMailSent,
        ], 201);
    }
}
