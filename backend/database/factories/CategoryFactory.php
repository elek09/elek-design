<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        $name = $this->faker->words(2, true);
        
        return [
            'name' => ucfirst($name),
            'type' => $this->faker->randomElement(['product', 'gallery', 'general']),
            'nav_order' => $this->faker->numberBetween(1, 100),
        ];
    }
}
