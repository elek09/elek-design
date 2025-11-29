<?php

namespace Tests\Unit;

use App\Models\Order;
use App\Models\Product;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Helpers\OrderTestHelpers;
use Tests\TestCase;

class OrderServiceTest extends TestCase
{
    use RefreshDatabase, OrderTestHelpers;

    private OrderService $orderService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->orderService = new OrderService();
    }

    public function test_createFromData_arajanlat_eseten_total_null(): void
    {
        $product = Product::factory()->create(['price' => 15000, 'is_active' => true]);

        $data = $this->getQuoteData(
            [$this->createOrderItem($product->id, 3)],
            ['customer_name' => 'Teszt Ügyfél', 'customer_email' => 'ugyfel@example.com']
        );

        $quote = $this->orderService->createFromData($data);

        $this->assertEquals('quote', $quote->kind);
        $this->assertNull($quote->total);
    }

    public function test_createFromData_arajanlat_tobb_tetellel(): void
    {
        $product1 = Product::factory()->create(['price' => 5000, 'is_active' => true]);
        $product2 = Product::factory()->create(['price' => 8000, 'is_active' => true]);

        $data = $this->getQuoteData(
            $this->createOrderItems([
                ['product_id' => $product1->id, 'quantity' => 2],
                ['product_id' => $product2->id, 'quantity' => 1],
            ]),
            ['customer_name' => 'Többtételes Vásárló', 'customer_email' => 'multi@example.com']
        );

        $quote = $this->orderService->createFromData($data);

        $this->assertEquals('quote', $quote->kind);
        $this->assertNull($quote->total); // Árajánlatnál nincs total
        $this->assertCount(2, $quote->items);
    }

    public function test_createFromData_arajanlat_inaktiv_termeket_kihagyja(): void
    {
        $activeProduct = Product::factory()->create(['price' => 1000, 'is_active' => true]);
        $inactiveProduct = Product::factory()->create(['price' => 2000, 'is_active' => false]);

        $data = $this->getQuoteData(
            $this->createOrderItems([
                ['product_id' => $activeProduct->id, 'quantity' => 1],
                ['product_id' => $inactiveProduct->id, 'quantity' => 1],
            ]),
            ['customer_name' => 'Teszt', 'customer_email' => 'test@example.com']
        );

        $quote = $this->orderService->createFromData($data);

        $this->assertCount(1, $quote->items);
        $this->assertNull($quote->total);
    }

    public function test_createFromData_ures_items_lista_eseten_ures_arajanlat(): void
    {
        $data = $this->getQuoteData(
            [],
            ['customer_name' => 'Üres Árajánlat', 'customer_email' => 'ures@example.com']
        );

        $quote = $this->orderService->createFromData($data);

        $this->assertNull($quote->total);
        $this->assertCount(0, $quote->items);
    }

    public function test_recalcTotal_ujraszamolja_a_tetelek_osszeset(): void
    {
        $product1 = Product::factory()->create(['price' => 3000]);
        $product2 = Product::factory()->create(['price' => 5000]);
        
        $order = Order::factory()->create(['total' => 0]);
        $order->items()->create(['product_id' => $product1->id, 'quantity' => 2, 'unit_price' => 3000]);
        $order->items()->create(['product_id' => $product2->id, 'quantity' => 1, 'unit_price' => 5000]);

        $updated = $this->orderService->recalcTotal($order);

        $this->assertEquals(11000, $updated->total); // (2*3000) + (1*5000)
    }

    public function test_recalcTotal_felulirja_explicit_ertekkel(): void
    {
        $product = Product::factory()->create(['price' => 3000]);
        $order = Order::factory()->create(['total' => 0]);
        $order->items()->create(['product_id' => $product->id, 'quantity' => 2, 'unit_price' => 3000]);

        $updated = $this->orderService->recalcTotal($order, 50000);

        $this->assertEquals(50000, $updated->total);
    }

    public function test_recalcTotal_null_unit_price_eseten_nullakent_szamol(): void
    {
        $product = Product::factory()->create();
        $order = Order::factory()->create(['total' => 0]);
        $order->items()->create(['product_id' => $product->id, 'quantity' => 3, 'unit_price' => null]);

        $updated = $this->orderService->recalcTotal($order);

        $this->assertEquals(0, $updated->total);
    }

    public function test_updateOrderItems_modositja_mennyiseget_es_egysegarat(): void
    {
        $product = Product::factory()->create();
        $order = Order::factory()->create();
        $item = $order->items()->create([
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => 1000,
        ]);

        $this->orderService->updateOrderItems($order, [
            ['id' => $item->id, 'quantity' => 5, 'unit_price' => 2000],
        ]);

        $item->refresh();
        $this->assertEquals(5, $item->quantity);
        $this->assertEquals(2000, $item->unit_price);
    }

    public function test_updateOrderItems_csak_sajat_teteleket_modositja(): void
    {
        $product1 = Product::factory()->create();
        $product2 = Product::factory()->create();
        
        $order1 = Order::factory()->create();
        $order2 = Order::factory()->create();
        
        $item1 = $order1->items()->create(['product_id' => $product1->id, 'quantity' => 1, 'unit_price' => 1000]);
        $item2 = $order2->items()->create(['product_id' => $product2->id, 'quantity' => 2, 'unit_price' => 2000]);

        $this->orderService->updateOrderItems($order1, [
            ['id' => $item2->id, 'quantity' => 999],
        ]);

        $item2->refresh();
        $this->assertEquals(2, $item2->quantity); // Nem változott
    }
}
