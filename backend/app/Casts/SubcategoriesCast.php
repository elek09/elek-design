<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Support\Str;

/**
 * Normalizes subcategories to an array of { id: string, name: string }
 * - Accepts array of strings or associative arrays
 * - Generates missing id from slug(name) and name from id if needed
 * - Deduplicates by id and ensures deterministic order
 */
class SubcategoriesCast implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes)
    {
        $decoded = $value ? json_decode($value, true) : [];
        if (!is_array($decoded)) {
            return [];
        }
        return array_values($this->normalize($decoded));
    }

    public function set($model, string $key, $value, array $attributes)
    {
        if (empty($value) || !is_array($value)) {
            return json_encode([]);
        }
        $normalized = array_values($this->normalize($value));
        return json_encode($normalized, JSON_UNESCAPED_UNICODE);
    }

    /**
     * @param array<int, mixed> $items
     * @return array<string, array{id:string,name:string}>
     */
    private function normalize(array $items): array
    {
        $result = [];
        foreach ($items as $item) {
            $name = null; $id = null;
            if (is_string($item)) {
                $name = trim($item);
                $id = Str::slug($name);
            } elseif (is_array($item)) {
                $name = $item['name'] ?? $item['label'] ?? $item['title'] ?? null;
                $id = $item['id'] ?? $item['slug'] ?? null;
                if (!$id && $name) {
                    $id = Str::slug($name);
                }
                if (!$name && $id) {
                    $name = ucwords(str_replace(['-', '_'], ' ', (string) $id));
                }
            }
            if ($id && $name) {
                $result[(string) $id] = ['id' => (string) $id, 'name' => (string) $name];
            }
        }
        ksort($result);
        return $result;
    }
}
