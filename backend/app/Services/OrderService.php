<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\Mail;
use App\Mail\OrderConfirmationMail;
use App\Mail\QuoteReceivedAdminMail;
use App\Mail\QuoteAcceptedMail;

class OrderService
{
    /**
     * Rendelés végösszeg újraszámolása a tételek alapján, vagy explicit felülírás
     */
    public function recalcTotal(Order $order, float $overrideTotal = null): Order
    {
        if ($overrideTotal !== null) {
            $order->total = $overrideTotal;
        } else {
            // SQL aggregáció (hatékonyabb sok tétel esetén)
            $sum = $order->items()
                ->selectRaw('COALESCE(SUM(COALESCE(unit_price,0) * quantity),0) as agg_total')
                ->value('agg_total');
            $order->total = (float) $sum;
        }
        $order->save();
        return $order;
    }

    /**
     * Rendelés tételeinek frissítése (mennyiség, egységár)
     * Csak az adott rendeléshez tartozó tételeket módosítja
     */
    public function updateOrderItems(Order $order, array $items): void
    {
        if (empty($items)) {
            return;
        }

        $itemsById = $order->items()->get()->keyBy('id');
        
        foreach ($items as $row) {
            $id = (int) $row['id'];
            
            if (!$itemsById->has($id)) {
                continue; // Biztonság: csak a rendeléshez tartozó tételek
            }
            
            $update = [];
            if (array_key_exists('quantity', $row)) {
                $update['quantity'] = (int) $row['quantity'];
            }
            if (array_key_exists('unit_price', $row)) {
                $update['unit_price'] = (float) $row['unit_price'];
            }
            
            if (!empty($update)) {
                $itemsById[$id]->update($update);
            }
        }
    }

    /**
     * Megerősítő email küldése a vásárlónak és admin-nak
     */
    public function sendConfirmation(Order $order, ?string $adminNote = null, bool $byAdmin = false): void
    {
        $isQuote = $order->kind === 'quote';
        $fresh = $order->fresh('items.product');
        
        if ($byAdmin && $isQuote) {
            // Admin elfogadta az árajánlatot: QuoteAcceptedMail sablon, árak mutatása
            Mail::to($fresh->customer_email)
                ->send(new QuoteAcceptedMail($fresh, $adminNote ?? $fresh->admin_note));
        } else {
            // Árajánlat/rendelés leadásakor: OrderConfirmationMail
            $showPrices = $byAdmin ? true : null;
            Mail::to($fresh->customer_email)
                ->send(new OrderConfirmationMail($fresh, $isQuote, $adminNote ?? $fresh->admin_note, $showPrices));
        }

        // Admin értesítés (csak új árajánlat esetén, később bővíthető rendelésekkel is)
        if (!$byAdmin) {
            $admins = (array) config('mail.admin_recipients', []);
            foreach ($admins as $rcpt) {
                if (!empty($rcpt) && $isQuote) {
                    // TODO: Itt később hozzáadható OrderReceivedAdminMail a sima rendelésekhez is
                    Mail::to($rcpt)->send(new QuoteReceivedAdminMail($fresh));
                }
            }
        }
    }

    /**
     * Rendelés/árajánlat létrehozása validált adatokból
     * Elvárt mezők: customer_name, customer_email, customer_phone?, is_quote, items[{product_id, quantity, options?}]
     */
    public function createFromData(array $data, ?int $userId = null): Order
    {
        $isQuote = (bool)($data['is_quote'] ?? false);
        
        $order = Order::create([
            'user_id' => $userId,
            'kind' => $isQuote ? 'quote' : 'order',
            'status' => 'new',
            'customer_name' => $data['customer_name'] ?? null,
            'customer_email' => $data['customer_email'] ?? null,
            'customer_phone' => $data['customer_phone'] ?? null,
            'total' => $isQuote ? null : 0,
        ]);

        // Termékek tömeges betöltése N+1 query elkerülésére
        $productIds = collect($data['items'])->pluck('product_id')->filter()->unique()->values();
        $products = Product::active()->whereIn('id', $productIds)->get()->keyBy('id');

        $prepared = [];
        $runningTotal = 0.0;
        
        foreach ($data['items'] as $item) {
            $productId = $item['product_id'] ?? null;
            
            if (!$productId || !isset($products[$productId])) { 
                continue; 
            }
            
            $product = $products[$productId];
            $quantity = max(1, (int) $item['quantity']);
            $unitPrice = (float) ($product->price ?? 0);
            
            $prepared[] = [
                'order_id' => $order->id,
                'product_id' => $productId,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'options' => json_encode($item['options'] ?? []),
                'created_at' => now(),
                'updated_at' => now(),
            ];
            
            if (!$isQuote) {
                $runningTotal += $quantity * $unitPrice;
            }
        }
        
        if (count($prepared)) {
            $order->items()->insert($prepared); // Egyetlen bulk insert
        }
        
        if (!$isQuote) {
            $order->update(['total' => $runningTotal]);
        }

        return $order->fresh('items.product');
    }
}
