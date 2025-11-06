<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\Mail;
use App\Mail\OrderConfirmationMail;

class OrderService
{
    /**
     * Recalculate and update order total from items, or set explicit override.
     */
    public function recalcTotal(Order $order, float $overrideTotal = null): Order
    {
        if ($overrideTotal !== null) {
            $order->total = $overrideTotal;
        } else {
            $sum = $order->items()->get()->reduce(function ($carry, $i) {
                $unit = is_null($i->unit_price) ? 0.0 : (float) $i->unit_price;
                return $carry + $unit * (int) $i->quantity;
            }, 0.0);
            $order->total = $sum;
        }
        $order->save();
        return $order;
    }

    /**
     * Send confirmation email using current order state and optional admin note.
     */
    public function sendConfirmation(Order $order, ?string $adminNote = null): void
    {
        $isQuote = $order->kind === 'quote';
        Mail::to($order->customer_email)
            ->send(new OrderConfirmationMail($order->fresh('items.product'), $isQuote, $adminNote ?? $order->admin_note));
    }

    /**
     * Create an order (or quote) from validated request-like data.
     * Expected keys: customer_name, customer_email, customer_phone?, is_quote, items[{product_id, quantity, options?}]
     */
    public function createFromData(array $data, ?int $userId = null): Order
    {
        $isQuote = (bool)($data['is_quote'] ?? false);
        $order = Order::create([
            'user_id' => $userId,
            'kind' => $isQuote ? 'quote' : 'order',
            'status' => 'new',
            'customer_name' => $data['customer_name'],
            'customer_email' => $data['customer_email'],
            'customer_phone' => $data['customer_phone'] ?? null,
            'total' => $isQuote ? null : 0,
        ]);

        $total = 0.0;
        foreach ($data['items'] as $it) {
            $p = Product::find($it['product_id']);
            if (!$p) { continue; }
            $qty = (int) $it['quantity'];
            $unit = (float) ($p->price ?? 0);
            $order->items()->create([
                'product_id' => $p->id,
                'quantity' => $qty,
                'unit_price' => $unit,
                'options' => $it['options'] ?? [],
            ]);
            if (!$isQuote) {
                $total += $qty * $unit;
            }
        }
        if (!$isQuote) {
            $order->update(['total' => $total]);
        }

        return $order->fresh('items.product');
    }
}
