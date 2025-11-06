<?php

namespace App\Services;

use Illuminate\Http\Request;

class CartService
{
    private const SESSION_KEY = 'cart.items';

    public function get(Request $request): array
    {
        return $request->session()->get(self::SESSION_KEY, []);
    }

    public function add(Request $request, int $productId, int $quantity, array $options = []): array
    {
        $items = $this->get($request);
        $existing = $items[$productId] ?? ['quantity' => 0, 'options' => []];

        $items[$productId] = [
            'product_id' => $productId,
            'quantity' => max(1, (int) $existing['quantity'] + $quantity),
            'options' => !empty($options) ? $options : ($existing['options'] ?? []),
        ];

        $this->put($request, $items);
        return $items;
    }

    public function update(Request $request, int $productId, int $quantity, ?array $options = null): array
    {
        $items = $this->get($request);
        if (!isset($items[$productId])) return $items;

        if ($quantity <= 0) {
            unset($items[$productId]);
        } else {
            $items[$productId]['quantity'] = $quantity;
            if ($options !== null) $items[$productId]['options'] = $options;
        }

        $this->put($request, $items);
        return $items;
    }

    public function remove(Request $request, int $productId): array
    {
        $items = $this->get($request);
        unset($items[$productId]);
        $this->put($request, $items);
        return $items;
    }

    public function clear(Request $request): void
    {
        $this->put($request, []);
    }

    public function put(Request $request, array $items): void
    {
        $request->session()->put(self::SESSION_KEY, $items);
    }
}
