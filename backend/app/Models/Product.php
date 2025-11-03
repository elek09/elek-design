<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'price', 'options', 'is_active'];
    protected $casts = ['options' => 'array', 'price' => 'decimal:2', 'is_active' => 'boolean'];
}
