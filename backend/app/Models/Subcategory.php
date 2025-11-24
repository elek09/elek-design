<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subcategory extends Model
{
    protected $table = 'category_subcategories';
    protected $fillable = ['category_id','slug','name','nav_order'];

    // Scope: order subcategories for navigation (nulls last) then name
    public function scopeNavOrdered($query)
    {
        return $query
            ->orderByRaw('CASE WHEN nav_order IS NULL THEN 1 ELSE 0 END')
            ->orderBy('nav_order')
            ->orderBy('name');
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function galleryItems()
    {
        return $this->hasMany(GalleryItem::class, 'subcategory_id');
    }
}
