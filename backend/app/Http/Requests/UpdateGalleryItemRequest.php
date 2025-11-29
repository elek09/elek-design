<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGalleryItemRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => 'sometimes|required|string|max:255',
            'category_id' => ['sometimes', 'nullable', 'integer', 'exists:categories,id', 'required_without:subcategory_id'],
            'subcategory_id' => ['sometimes', 'nullable', 'integer', 'exists:category_subcategories,id', 'required_without:category_id'],
            'description' => 'nullable|string|max:1000',
            'image' => 'sometimes|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'file' => 'sometimes|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'is_active' => 'sometimes|required|boolean',
            'is_featured' => 'sometimes|required|boolean',
        ];
    }
}
