<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreContactMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Public endpoint
    }

    public function rules(): array
    {
        return [
            'name' => ['required','string','min:2','max:150'],
            'email' => ['required','email:rfc','max:200'],
            'subject' => ['required','string','min:3','max:200'],
            'message' => ['required','string','min:10','max:4000'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Basic HTML stripping & trim to mitigate spam / unnecessary markup.
        $input = $this->all();
        foreach (['name','email','subject','message'] as $field) {
            if (isset($input[$field]) && is_string($input[$field])) {
                $input[$field] = trim(strip_tags($input[$field]));
            }
        }
        $this->replace($input);
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Név kötelező.',
            'email.required' => 'Email kötelező.',
            'email.email' => 'Érvényes email formátum szükséges.',
            'subject.required' => 'Tárgy kötelező.',
            'message.required' => 'Üzenet kötelező.',
            'message.min' => 'Üzenet túl rövid.',
            'message.max' => 'Üzenet túl hosszú.',
        ];
    }
}
