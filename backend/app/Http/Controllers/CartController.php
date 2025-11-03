<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Order;
use Illuminate\Support\Arr;

class CartController extends Controller
{
    private const SESSION_KEY = 'cart.items';

    public function index(Request $request)
    {
        $items = $this->getCart($request);
        return $this->cartResponse($items);
    }

    public function add(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'options' => ['sometimes', 'array'],
        ]);

        $items = $this->getCart($request);
        $pid = (int) $data['product_id'];
        $existing = $items[$pid] ?? ['quantity' => 0, 'options' => []];

        $items[$pid] = [
            'product_id' => $pid,
            'quantity' => (int) $existing['quantity'] + (int) $data['quantity'],
            'options' => $data['options'] ?? $existing['options'] ?? [],
        ];

        $this->putCart($request, $items);
        return $this->cartResponse($items);
    }

    public function update(Request $request, int $productId)
    {
        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:0'],
            'options' => ['sometimes', 'array'],
        ]);

        $items = $this->getCart($request);
        if (!isset($items[$productId])) {
            return response()->json(['message' => 'Item not in cart'], 404);
        }

        if ($data['quantity'] === 0) {
            unset($items[$productId]);
        } else {
            $items[$productId]['quantity'] = (int) $data['quantity'];
            if (array_key_exists('options', $data)) {
                $items[$productId]['options'] = $data['options'];
            }
        }

        $this->putCart($request, $items);
        return $this->cartResponse($items);
    }

    public function remove(Request $request, int $productId)
    {
        $items = $this->getCart($request);
        unset($items[$productId]);
        $this->putCart($request, $items);
        return $this->cartResponse($items);
    }

    public function clear(Request $request)
    {
        $this->putCart($request, []);
        return $this->cartResponse([]);
    }

    public function checkout(Request $request)
    {
        $payload = $request->validate([
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_email' => ['required', 'email'],
            'customer_phone' => ['nullable', 'string', 'max:40'],
        ]);

        $items = $this->getCart($request);
        if (empty($items)) {
            return response()->json(['message' => 'Cart is empty'], 422);
        }

        // Create order
        $order = Order::create([
            'user_id' => optional($request->user())->id,
            'status' => 'new',
            'customer_name' => $payload['customer_name'],
            'customer_email' => $payload['customer_email'],
            'customer_phone' => $payload['customer_phone'] ?? null,
            'total' => 0,
        ]);

        $total = 0;
        $productIds = array_keys($items);
        $products = Product::whereIn('id', $productIds)->where('is_active', true)->get()->keyBy('id');

        foreach ($items as $pid => $row) {
            $p = $products[$pid] ?? null;
            if (!$p) continue; // skip inactive/missing
            $qty = max(1, (int) ($row['quantity'] ?? 1));
            $unit = (float) ($p->price ?? 0);
            $order->items()->create([
                'product_id' => $p->id,
                'quantity' => $qty,
                'unit_price' => $unit,
                'options' => $row['options'] ?? [],
            ]);
            $total += $qty * $unit;
        }
        $order->update(['total' => $total]);

        // Clear cart after successful checkout
        $this->putCart($request, []);

        return new \App\Http\Resources\OrderResource($order->load('items.product'));
    }

    private function getCart(Request $request): array
    {
        return $request->session()->get(self::SESSION_KEY, []);
    }

    private function putCart(Request $request, array $items): void
    {
        $request->session()->put(self::SESSION_KEY, $items);
    }
}
