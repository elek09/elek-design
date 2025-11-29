<?php

namespace Database\Factories;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'user_id' => null,
            'kind' => 'order',
            'status' => 'new',
            'customer_name' => fake()->name(),
            'customer_email' => fake()->safeEmail(),
            'customer_phone' => fake()->phoneNumber(),
            'total' => 0,
            'admin_note' => null,
        ];
    }

    public function quote(): static
    {
        return $this->state(fn (array $attributes) => [
            'kind' => 'quote',
            'total' => null,
        ]);
    }
}
