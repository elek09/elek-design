<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subcategory extends Model
{
    protected $table = 'category_subcategories';

    protected $fillable = [
        'category_id',
        'slug',
        'name',
        'nav_order',
    ];

    /**
     * Rendezés: null nav_order hátra, majd nav_order, majd név szerint
     */
    public function scopeNavOrdered($query)
    {
        return $query
            ->orderByRaw('CASE WHEN nav_order IS NULL THEN 1 ELSE 0 END')
            ->orderBy('nav_order')
            ->orderBy('name');
    }

    // egy alkategória egy kategóriához tartozik
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    // egy alkategóriának több galéria eleme van
    public function galleryItems()
    {
        return $this->hasMany(GalleryItem::class);
    }
}
