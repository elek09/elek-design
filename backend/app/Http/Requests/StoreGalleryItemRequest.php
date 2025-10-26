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
        // Build allowed categories dynamically from DB
        $types = Category::query()->pluck('type')->all();
        $subs = Category::query()
            ->pluck('subcategories')
            ->filter()
            ->flatMap(function ($arr) {
                return collect($arr)->pluck('id');
            })->filter()->unique()->values()->all();
        $validCategories = array_values(array_unique(array_merge($types, $subs, ['featured', 'egyeb'])));

        return [
            'title' => 'required|string|max:255',
            'category' => ['required', 'string', Rule::in($validCategories)],
            'description' => 'nullable|string',
            // Accept either 'image' or 'file' as the upload field name
            'image' => 'required_without:file|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'file'  => 'required_without:image|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'is_active' => 'required|boolean',
            'is_featured' => 'sometimes|boolean',
        ];
    }
}
