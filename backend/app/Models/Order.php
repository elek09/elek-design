<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'kind',
        'status',
        'customer_name',
        'customer_email',
        'customer_phone',
        'total',
        'admin_note',
    ];

    protected $casts = [
        'total' => 'decimal:2',
    ];

    //  egy rendelésnek több tétele van
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    // egy rendelés tartozhat egy felhasználóhoz
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
