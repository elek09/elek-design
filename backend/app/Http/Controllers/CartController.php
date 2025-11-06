<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Services\CartService;
use App\Services\OrderService;

class CartController extends Controller
{
    public function __construct(private CartService $cart, private OrderService $orders) {}

    public function index(Request $request)
    {
        $items = $this->cart->get($request);
        return $this->cartResponse($items);
    }

    public function add(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'options' => ['sometimes', 'array'],
        ]);

        $pid = (int) $data['product_id'];
        $items = $this->cart->add($request, $pid, (int) $data['quantity'], $data['options'] ?? []);
        return $this->cartResponse($items);
    }

    public function update(Request $request, int $productId)
    {
        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:0'],
            'options' => ['sometimes', 'array'],
        ]);

        $items = $this->cart->get($request);
        if (!isset($items[$productId])) {
            return response()->json(['message' => 'Item not in cart'], 404);
        }

        $items = $this->cart->update(
            $request,
            (int) $productId,
            (int) $data['quantity'],
            array_key_exists('options', $data) ? $data['options'] : null
        );
        return $this->cartResponse($items);
    }

    public function remove(Request $request, int $productId)
    {
        $items = $this->cart->remove($request, (int) $productId);
        return $this->cartResponse($items);
    }

    public function clear(Request $request)
    {
        $this->cart->clear($request);
        return $this->cartResponse([]);
    }

    public function checkout(Request $request)
    {
        $payload = $request->validate([
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_email' => ['required', 'email'],
            'customer_phone' => ['nullable', 'string', 'max:40'],
        ]);

        $items = $this->cart->get($request);
        if (empty($items)) {
            return response()->json(['message' => 'Cart is empty'], 422);
        }

        // Build submit-like payload from session cart
        $submitItems = [];
        foreach ($items as $pid => $row) {
            $submitItems[] = [
                'product_id' => (int) $pid,
                'quantity' => max(1, (int) ($row['quantity'] ?? 1)),
                'options' => $row['options'] ?? [],
            ];
        }

        $data = [
            'customer_name' => $payload['customer_name'],
            'customer_email' => $payload['customer_email'],
            'customer_phone' => $payload['customer_phone'] ?? null,
            'is_quote' => false,
            'items' => $submitItems,
        ];

        // Create order via service
        $order = $this->orders->createFromData($data, optional($request->user())->id);

        // Clear cart after successful checkout
        $this->cart->clear($request);

        // Send order confirmation email via service
        try {
            $this->orders->sendConfirmation($order);
        } catch (\Throwable $e) {
            \Log::warning('Cart checkout confirmation email failed: ' . $e->getMessage());
        }

        return new \App\Http\Resources\OrderResource($order->load('items.product'));
    }

    private function cartResponse(array $items)
    {
        $productIds = array_keys($items);
        $products = Product::whereIn('id', $productIds)->get()->keyBy('id');
        $result = [];
        foreach ($items as $pid => $row) {
            $p = $products->get((int) $pid);
            if (!$p) continue;
            $qty = (int) ($row['quantity'] ?? 1);
            $unit = (float) ($p->price ?? 0);
            $result[] = [
                'product' => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'price' => $p->price,
                ],
                'quantity' => $qty,
                'options' => $row['options'] ?? [],
                'subtotal' => $qty * $unit,
            ];
        }
        return response()->json(['items' => array_values($result)]);
    }
}
