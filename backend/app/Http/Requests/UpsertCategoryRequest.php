<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Routes are already protected by admin middleware
        return true;
    }

    public function rules(): array
    {
        $category = $this->route('category');
        $ignoreId = is_object($category) ? $category->id : (is_numeric($category) ? (int) $category : null);

        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => [
                'required', 'string', 'max:255',
                Rule::unique('categories', 'type')->ignore($ignoreId),
            ],
            'nav_order' => ['nullable', 'integer', 'min:0', 'max:1000'],
            // subcategories normalization is handled by custom cast
            'subcategories' => ['nullable', 'array'],
        ];
    }
}
