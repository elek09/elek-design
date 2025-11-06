<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Support\Str;

/**
 * Normalizes subcategories to an array of { id: string, name: string, nav_order?: int|null }
 * - Accepts array of strings or associative arrays
 * - Generates missing id from slug(name) and name from id if needed
 * - Preserves optional nav_order for frontend ordering (nulls come last)
 * - Deduplicates by id and ensures deterministic order by (nav_order asc, name asc)
 */
class SubcategoriesCast implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes)
    {
        $decoded = $value ? json_decode($value, true) : [];
        if (!is_array($decoded)) {
            return [];
        }
        $list = array_values($this->normalize($decoded));
        return $this->sortList($list);
    }

    public function set($model, string $key, $value, array $attributes)
    {
        if (empty($value) || !is_array($value)) {
            return json_encode([]);
        }
        $normalized = array_values($this->normalize($value));
        $sorted = $this->sortList($normalized);
        return json_encode($sorted, JSON_UNESCAPED_UNICODE);
    }

    /**
     * @param array<int, mixed> $items
     * @return array<string, array{id:string,name:string,nav_order: int|null}>
     */
    private function normalize(array $items): array
    {
        $result = [];
        foreach ($items as $item) {
            $name = null; $id = null; $navOrder = null;
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
                // Accept several possible keys for nav order
                $navKey = null;
                foreach (['nav_order', 'order', 'navOrder'] as $k) {
                    if (array_key_exists($k, $item)) { $navKey = $k; break; }
                }
                if ($navKey !== null) {
                    $raw = $item[$navKey];
                    if (is_numeric($raw)) {
                        $navOrder = (int) $raw;
                    }
                }
            }
            if ($id && $name) {
                $result[(string) $id] = [
                    'id' => (string) $id,
                    'name' => (string) $name,
                    'nav_order' => $navOrder,
                ];
            }
        }
        ksort($result);
        return $result;
    }

    /**
     * Sort list by nav_order asc (nulls last), then name asc, then id asc
     * @param array<int, array{id:string,name:string,nav_order:int|null}> $list
     * @return array<int, array{id:string,name:string,nav_order:int|null}>
     */
    private function sortList(array $list): array
    {
        usort($list, function ($a, $b) {
            $ao = $a['nav_order'] ?? null; $bo = $b['nav_order'] ?? null;
            $aHas = $ao !== null; $bHas = $bo !== null;
            if ($aHas && $bHas) {
                if ($ao !== $bo) return $ao <=> $bo;
            } elseif ($aHas !== $bHas) {
                // Items with null order come after those with explicit order
                return $aHas ? -1 : 1;
            }
            // Fallback: name then id
            $nameCmp = strcmp((string) $a['name'], (string) $b['name']);
            if ($nameCmp !== 0) return $nameCmp;
            return strcmp((string) $a['id'], (string) $b['id']);
        });
        return $list;
    }
}
