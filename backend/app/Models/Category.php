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
     * Navigációs rendezés: null nav_order értékek a végére, majd nav_order, majd név szerint
     * Használat: Category::navOrdered()->get()
     */
    public function scopeNavOrdered($query)
    {
        return $query
            ->orderByRaw('CASE WHEN nav_order IS NULL THEN 1 ELSE 0 END')
            ->orderBy('nav_order')
            ->orderBy('name');
    }

    /**
     * Kapcsolat: egy kategóriának több alkategóriája van (már rendezve)
     */
    public function subcategories()
    {
        return $this->hasMany(Subcategory::class)->navOrdered();
    }
}