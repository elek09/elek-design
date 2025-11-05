<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'subcategories',
        'nav_order',
    ];

    protected $casts = [
        'subcategories' => \App\Casts\SubcategoriesCast::class,
        'nav_order' => 'integer',
    ];

    /**
     * Scope: order categories for navigation
     */
    public function scopeNavOrdered($query)
    {
        return $query
            ->orderByRaw('CASE WHEN nav_order IS NULL THEN 1 ELSE 0 END')
            ->orderBy('nav_order')
            ->orderBy('name');
    }
}