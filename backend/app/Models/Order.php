<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = ['user_id', 'kind', 'status', 'customer_name', 'customer_email', 'customer_phone', 'total', 'admin_note'];
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Normalized accessors prefer user data when present
    public function getEffectiveCustomerNameAttribute(): ?string
    {
        return $this->user?->name ?: $this->customer_name;
    }
    public function getEffectiveCustomerEmailAttribute(): ?string
    {
        return $this->user?->email ?: $this->customer_email;
    }
    public function getEffectiveCustomerPhoneAttribute(): ?string
    {
        return $this->customer_phone; // phone not stored on User currently
    }
}
