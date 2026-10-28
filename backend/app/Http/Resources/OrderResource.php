<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kind' => $this->kind,
            'status' => $this->status,
            'total' => $this->total,
            'note' => $this->admin_note,
            'customer' => [
                'name' => $this->customer_name,
                'email' => $this->customer_email,
                'phone' => $this->customer_phone,
            ],
            'items' => $this->items->map(fn($i) => [
                'id' => $i->id,
                'product' => [
                    'id' => $i->product->id,
                    'name' => $i->product->name,
                    'slug' => $i->product->slug,
                ],
                'quantity' => $i->quantity,
                'unit_price' => $i->unit_price,
                'options' => $i->options,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
