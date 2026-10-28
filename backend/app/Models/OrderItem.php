<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'product_id',
        'quantity',
        'unit_price',
        'options', // JSON: termék opciók (pl. méret, szín)
    ];

    protected $casts = [
        'options' => 'array',
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
    ];

    // egy rendelési tétel egy rendeléshez tartozik
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    // egy rendelési tétel egy termékhez tartozik
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
