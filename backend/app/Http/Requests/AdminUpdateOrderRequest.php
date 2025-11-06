<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdminUpdateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route is protected by admin middleware
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'in:new,accepted,rejected'],
            'total' => ['sometimes', 'numeric', 'min:0'],
            'admin_note' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'items' => ['sometimes', 'array'],
            'items.*.id' => ['required', 'integer', 'exists:order_items,id'],
            'items.*.quantity' => ['sometimes', 'integer', 'min:1'],
            'items.*.unit_price' => ['sometimes', 'numeric', 'min:0'],
        ];
    }
}
