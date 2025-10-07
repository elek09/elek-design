<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'price', 'options', 'active'];
    protected $casts = ['options' => 'array', 'price' => 'decimal:2', 'active' => 'boolean'];
}
