<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Category;

class StoreGalleryItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization is handled by the 'admin.api' middleware in the route.
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required','string','max:255'],
            // Either a top-level category OR a subcategory must be provided
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
