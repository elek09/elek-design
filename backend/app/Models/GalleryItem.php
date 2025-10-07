<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GalleryItem extends Model
{
    protected $fillable = ['title', 'category', 'description', 'image_path', 'active'];
    protected $casts = ['active' => 'boolean'];
}
