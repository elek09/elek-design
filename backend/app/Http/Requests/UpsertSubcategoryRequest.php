<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertSubcategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Admin middleware already guards routes
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('slug') && $this->filled('slug')) {
            $this->merge([
                'slug' => str($this->input('slug'))
                    ->trim()
                    ->lower()
                    ->replace(' ', '-')
                    ->replace(['__','--'], '-')
                    ->value(),
            ]);
        }
    }

    public function rules(): array
    {
        $sub = $this->route('subcategory');
        $ignoreId = is_object($sub) ? $sub->id : (is_numeric($sub) ? (int) $sub : null);
        $isUpdate = !is_null($ignoreId);
        // On create: require category_id + name; slug required unless provided.
        // On update: allow partial update (only one or more fields). Slug uniqueness still enforced if present.
        return [
            'category_id' => [$isUpdate ? 'sometimes' : 'required','integer','exists:categories,id'],
            'name' => [$isUpdate ? 'sometimes' : 'required','string','max:255'],
            'slug' => [
                $isUpdate ? 'sometimes' : 'required','string','max:255',
                Rule::unique('category_subcategories','slug')->ignore($ignoreId),
            ],
            'nav_order' => ['sometimes','nullable','integer','min:0','max:1000'],
        ];
    }
}
