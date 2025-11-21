<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\Mail;
use App\Mail\OrderConfirmationMail;
use App\Mail\QuoteReceivedAdminMail;
use App\Mail\OrderReceivedAdminMail;
use App\Mail\QuoteAcceptedMail;

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
    public function sendConfirmation(Order $order, ?string $adminNote = null, bool $byAdmin = false): void
    {
        $isQuote = $order->kind === 'quote';
        $fresh = $order->fresh('items.product');
        if ($byAdmin && $isQuote) {
            // Admin elfogadta az árajánlatot: új email sablon, ár mutatása
            Mail::to($fresh->customer_email)
                ->send(new \App\Mail\QuoteAcceptedMail($fresh, $adminNote ?? $fresh->admin_note));
        } else {
            // Régi logika: árajánlat leadásakor vagy sima rendelés
            $showPrices = $byAdmin ? true : null;
            Mail::to($fresh->customer_email)
                ->send(new OrderConfirmationMail($fresh, $isQuote, $adminNote ?? $fresh->admin_note, $showPrices));
        }

        if (!$byAdmin) {
            $admins = (array) config('mail.admin_recipients', []);
            foreach ($admins as $rcpt) {
                if (!empty($rcpt)) {
                    if ($isQuote) {
                        Mail::to($rcpt)->send(new QuoteReceivedAdminMail($fresh));
                    } else {
                        Mail::to($rcpt)->send(new OrderReceivedAdminMail($fresh));
                    }
                }
            }
        }
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
