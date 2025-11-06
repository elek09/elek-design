<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\Product;

class OrderDemoSeeder extends Seeder
{
    public function run(): void
    {
        // Resolve some demo products by slug
        $slugs = ['konyhabutor', 'haloszoba-butor', 'gardrob', 'nappali-butor'];
        $products = Product::whereIn('slug', $slugs)->get()->keyBy('slug');

        // 1) Quote (árajánlat) with no prices yet
        $quote = Order::create([
            'user_id' => null,
            'kind' => 'quote',
            'status' => 'new',
            'customer_name' => 'Árajánlat Ügyfél',
            'customer_email' => 'quote@example.com',
            'customer_phone' => '+36 30 000 0000',
            'total' => null,
            'admin_note' => 'Első egyeztetés szükséges a pontos igényekről.',
        ]);
        if ($p = $products->get('konyhabutor')) {
            $quote->items()->create([
                'product_id' => $p->id,
                'quantity' => 1,
                'unit_price' => null, // nincs még ár
                'options' => [
                    'hardware_type' => 'Prémium',
                    'color_scheme' => 'Világos',
                ],
            ]);
        }
        if ($p = $products->get('nappali-butor')) {
            $quote->items()->create([
                'product_id' => $p->id,
                'quantity' => 1,
                'unit_price' => null,
                'options' => [
                    'hardware_type' => 'Soft-close',
                    'color_scheme' => 'Sötét',
                ],
            ]);
        }

        // 2) Order (rendelés) with prices and computed total
        $order = Order::create([
            'user_id' => null,
            'kind' => 'order',
            'status' => 'accepted',
            'customer_name' => 'Rendelés Ügyfél',
            'customer_email' => 'order@example.com',
            'customer_phone' => '+36 20 111 1111',
            'total' => 0,
            'admin_note' => 'Elfogadva. Várható szállítás 2 hét.',
        ]);
        $total = 0.0;
        if ($p = $products->get('haloszoba-butor')) {
            $order->items()->create([
                'product_id' => $p->id,
                'quantity' => 1,
                'unit_price' => 150000,
                'options' => [
                    'hardware_type' => 'Alap',
                    'color_scheme' => 'Dió',
                ],
            ]);
            $total += 150000;
        }
        if ($p = $products->get('gardrob')) {
            $order->items()->create([
                'product_id' => $p->id,
                'quantity' => 2,
                'unit_price' => 210000,
                'options' => [
                    'hardware_type' => 'Tolóajtó rendszer',
                    'color_scheme' => 'Fekete',
                ],
            ]);
            $total += 2 * 210000;
        }
        $order->update(['total' => $total]);
    }
}
