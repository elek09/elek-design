<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
        $validCategories = [
            // Main categories
            'featured',
            'eletter',
            'uzletter',
            '3d-falboritas',
            'ives-butorok',
            'egyeb',

            // Subcategories of 'eletter'
            'konyha',
            'nappali',
            'furdoszoba',
            'haloszoba',
            'gardrob',
            'lepcso',

            // Subcategories of 'uzletter'
            'iroda-berendezes',
            'uzlet-berendezes',
            'kiallitasi-butorok',
        ];

        return [
            'title' => 'required|string|max:255',
            'category' => ['required', 'string', Rule::in($validCategories)],
            'description' => 'nullable|string',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'is_active' => 'required|boolean',
            'is_featured' => 'sometimes|boolean',
        ];
    }
}
