<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Category;

class StoreGalleryItemRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required','string','max:255'],
            'category_id' => ['required_without:subcategory_id','nullable','integer','exists:categories,id'],
            'subcategory_id' => ['required_without:category_id','nullable','integer','exists:category_subcategories,id'],
            'description' => ['nullable','string'],
            'image' => ['required_without:file','image','mimes:jpeg,png,jpg,gif,webp','max:2048'],
            'file'  => ['required_without:image','image','mimes:jpeg,png,jpg,gif,webp','max:2048'],
            'is_active' => ['required','boolean'],
            'is_featured' => ['sometimes','boolean'],
        ];
    }
}
