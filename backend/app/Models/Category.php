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
        'subcategories' => 'array',
        'nav_order' => 'integer',
    ];
}