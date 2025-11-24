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
            // Perform aggregation directly in SQL (more efficient for large item counts)
            $sum = $order->items()
                ->selectRaw('COALESCE(SUM(COALESCE(unit_price,0) * quantity),0) as agg_total')
                ->value('agg_total');
            $order->total = (float) $sum;
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
        // Normalize: if user provided, prefer snapshot from related user; otherwise require provided fields.
        $customerName = $data['customer_name'] ?? null;
        $customerEmail = $data['customer_email'] ?? null;
        $customerPhone = $data['customer_phone'] ?? null;
        if ($userId) {
            $u = \App\Models\User::find($userId);
            if ($u) {
                $customerName = $u->name;
                $customerEmail = $u->email;
            }
        }
        $order = Order::create([
            'user_id' => $userId,
            'kind' => $isQuote ? 'quote' : 'order',
            'status' => 'new',
            'customer_name' => $customerName,
            'customer_email' => $customerEmail,
            'customer_phone' => $customerPhone,
            'total' => $isQuote ? null : 0,
        ]);

        // Bulk load products to avoid N+1 queries
        $productIds = collect($data['items'])->pluck('product_id')->filter()->unique()->values();
        $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

        $prepared = [];
        $runningTotal = 0.0;
        foreach ($data['items'] as $it) {
            $pid = $it['product_id'] ?? null;
            if (!$pid || !isset($products[$pid])) { continue; }
            $p = $products[$pid];
            $qty = max(1, (int) $it['quantity']);
            $unit = (float) ($p->price ?? 0);
            $prepared[] = [
                'product_id' => $p->id,
                'quantity' => $qty,
                'unit_price' => $unit,
                'options' => $it['options'] ?? [],
                'created_at' => now(),
                'updated_at' => now(),
            ];
            if (!$isQuote) {
                $runningTotal += $qty * $unit;
            }
        }
        if (count($prepared)) {
            $order->items()->insert($prepared); // single bulk insert
        }
        if (!$isQuote) {
            $order->update(['total' => $runningTotal]);
        }

        return $order->fresh('items.product');
    }
}
