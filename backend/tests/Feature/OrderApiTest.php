<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Helpers\OrderTestHelpers;
use Tests\TestCase;

class OrderApiTest extends TestCase
{
    use RefreshDatabase, OrderTestHelpers;

    private User $admin;
    private User $user;
    private Product $product1;
    private Product $product2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['admin' => true]);
        $this->user = User::factory()->create(['admin' => false]);
        
        $this->product1 = Product::factory()->create([
            'name' => 'Konyhabútor Standard',
            'price' => 150000,
            'is_active' => true,
        ]);
        
        $this->product2 = Product::factory()->create([
            'name' => 'Gardróbszekrény Prémium',
            'price' => 250000,
            'is_active' => true,
        ]);
    }

    public function test_vendeg_leadhat_arajanlat_keres(): void
    {
        $quoteData = $this->getQuoteData(
            [$this->createOrderItem($this->product2->id, 1)],
            ['customer_name' => 'Kovács János', 'customer_email' => 'janos@example.com']
        );

        $response = $this->postJson('/api/v1/orders/submit', $quoteData);

        $response->assertStatus(200);

        $this->assertDatabaseHas('orders', [
            'user_id' => null,
            'kind' => 'quote',
            'customer_email' => 'janos@example.com',
        ]);
    }

    public function test_arajanlat_validalja_kotelezo_mezőket(): void
    {
        $response = $this->postJson('/api/v1/orders/submit', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['customer_name', 'customer_email', 'items']);
    }

    public function test_arajanlat_tobb_tetellel(): void
    {
        $quoteData = $this->getQuoteData(
            $this->createOrderItems([
                ['product_id' => $this->product1->id, 'quantity' => 3],
                ['product_id' => $this->product2->id, 'quantity' => 1],
            ]),
            ['customer_name' => 'Nagy Péter', 'customer_email' => 'peter@example.com']
        );

        $response = $this->postJson('/api/v1/orders/submit', $quoteData);

        $response->assertStatus(200);

        $order = Order::latest()->first();
        $this->assertEquals('quote', $order->kind);
        $this->assertNull($order->total); // Árajánlatnál nincs total
        $this->assertCount(2, $order->items);
    }

    public function test_arajanlat_kizarja_inaktiv_termekeket(): void
    {
        $inactiveProduct = Product::factory()->create([
            'name' => 'Inaktív Termék',
            'is_active' => false,
        ]);

        $quoteData = $this->getQuoteData(
            $this->createOrderItems([
                ['product_id' => $this->product1->id, 'quantity' => 1],
                ['product_id' => $inactiveProduct->id, 'quantity' => 5],
            ]),
            ['customer_email' => 'teszt@example.com']
        );

        $response = $this->postJson('/api/v1/orders/submit', $quoteData);

        $response->assertStatus(200);

        $order = Order::latest()->first();
        $this->assertCount(1, $order->items);
    }

    public function test_admin_lekerheti_az_osszes_arajanlat(): void
    {
        Order::factory()->count(5)->create(['kind' => 'quote']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/orders');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'kind', 'customer', 'total', 'status']
                ]
            ]);

        $this->assertCount(5, $response->json('data'));
    }

    public function test_nem_admin_nem_ferheti_hozza_admin_arajanlatok_listazasahoz(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/v1/admin/orders');

        $response->assertStatus(403);
    }

    public function test_admin_torolheti_arajanlat(): void
    {
        $order = Order::factory()->create(['kind' => 'quote']);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/v1/admin/orders/{$order->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('orders', ['id' => $order->id, 'deleted_at' => null]);
    }

    public function test_admin_modosithatja_arajanlat_statuszt(): void
    {
        $order = Order::factory()->create(['kind' => 'quote', 'status' => 'new']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/orders/{$order->id}/status", [
                'status' => 'accepted'
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'accepted',
        ]);
    }
}
