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
        'nav_order',
    ];

    protected $casts = [
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

    public function subcategories()
    {
        return $this->hasMany(Subcategory::class)->navOrdered();
    }
}