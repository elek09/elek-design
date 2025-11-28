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

    protected function prepareForValidation(): void
    {
        // Normalize incoming type to slug form (spaces -> dash, lowercase) if provided
        if ($this->has('type')) {
            $normalized = str($this->input('type'))
                ->trim()
                ->lower()
                ->replace([' '], '-')
                ->replace(['__','--'], '-')
                ->value();
            $this->merge(['type' => $normalized]);
        }
    }

    public function rules(): array
    {
        $category = $this->route('category');
        $ignoreId = is_object($category) ? $category->id : (is_numeric($category) ? (int) $category : null);
        $isUpdate = !is_null($ignoreId);
        $typeRules = [];
        if ($isUpdate) {
            // If updating and provided type matches existing, skip unique check entirely.
            if ($this->has('type') && is_object($category) && $this->input('type') === $category->type) {
                $typeRules = ['sometimes','string','max:255'];
            } else {
                $typeRules = ['sometimes','string','max:255', Rule::unique('categories','type')->ignore($ignoreId,'id')];
            }
        } else {
            // Create: enforce unique
            $typeRules = ['required','string','max:255', Rule::unique('categories','type')];
        }

        return [
            'name' => ['required','string','max:255'],
            'type' => $typeRules,
            'nav_order' => ['nullable','integer','min:0','max:1000'],
        ];
    }
}
