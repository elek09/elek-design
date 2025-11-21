<?php

namespace App\Http\Controllers;

use App\Mail\OrderConfirmationMail;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class SimpleOrderController extends Controller
{
    /**
     * Minimal public endpoint demonstrating email sending with simple payload.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email'],
            'product' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        // Persist a minimal Order record mapped to current schema
        $order = Order::create([
            'user_id' => null,
            'kind' => 'order',
            'status' => 'new',
            'customer_name' => $data['name'],
            'customer_email' => $data['email'],
            'customer_phone' => null,
            'total' => null,
        ]);

        // Send confirmation email using the simple payload
        Mail::to($data['email'])->send(new OrderConfirmationMail($data));

        return response()->json([
            'message' => 'Rendelés rögzítve',
            'id' => $order->id,
        ], 201);
    }
}
