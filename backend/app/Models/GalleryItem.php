<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GalleryItem extends Model
{
    protected $fillable = [
        'title',
        'category_id',
        'subcategory_id',
        'description',
        'image_path',
        'is_active',
        'is_featured',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
    ];

    // aktív galéria elemek szűrése
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // inaktív galéria elemek szűrése
    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    // kiemelt galéria elemek szűrése
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    // egy galéria elem egy kategóriához tartozik
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    // egy galéria elem egy alkategóriához tartozik
    public function subcategory()
    {
        return $this->belongsTo(Subcategory::class);
    }
}
