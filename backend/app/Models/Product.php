<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'primary_image_url',
        'description',
        'price',
        'options', // JSON: termék opciók (pl. méretek, színek)
        'is_active',
    ];

    protected $casts = [
        'options' => 'array',
        'price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    // Csak aktív termékek szűrése
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // egy terméknek több rendelési tétele lehet
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }
}
