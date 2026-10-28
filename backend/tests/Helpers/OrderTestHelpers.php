<?php

namespace Tests\Helpers;

trait OrderTestHelpers
{
    /**
     * Alapértelmezett vásárlói adatok
     */
    protected function getCustomerData(string $name = 'Teszt Vásárló', string $email = 'vasarlo@example.com'): array
    {
        return [
            'customer_name' => $name,
            'customer_email' => $email,
            'customer_phone' => '+36301234567',
            'customer_address' => 'Budapest, Fő utca 1.',
        ];
    }

    /**
     * Árajánlat létrehozó adatok (is_quote = true)
     */
    protected function getQuoteData(array $items, array $customerOverrides = []): array
    {
        return array_merge(
            [
                'is_quote' => true,
                'items' => $items,
            ],
            $this->getCustomerData(),
            $customerOverrides
        );
    }

    /**
     * Egy tételes rendelési elem
     */
    protected function createOrderItem(int $productId, int $quantity = 1, ?array $options = null): array
    {
        $item = [
            'product_id' => $productId,
            'quantity' => $quantity,
        ];

        if ($options !== null) {
            $item['options'] = $options;
        }

        return $item;
    }

    /**
     * Több tételes rendelési elemek tömb
     */
    protected function createOrderItems(array $productsWithQuantities): array
    {
        return array_map(
            fn($item) => $this->createOrderItem($item['product_id'], $item['quantity'], $item['options'] ?? null),
            $productsWithQuantities
        );
    }
}
