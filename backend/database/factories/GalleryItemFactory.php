<?php

namespace Database\Factories;

use App\Models\GalleryItem;
use Illuminate\Database\Eloquent\Factories\Factory;

class GalleryItemFactory extends Factory
{
    protected $model = GalleryItem::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(3),
            'image_path' => 'gallery/' . $this->faker->uuid() . '.jpg',
            'category_id' => null,
            'subcategory_id' => null,
            'description' => $this->faker->optional()->sentence(),
            'is_featured' => $this->faker->boolean(30),
            'is_active' => $this->faker->boolean(80),
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
        ]);
    }

    public function featured(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
        ]);
    }
}
