<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Product;
use App\Http\Resources\OrderResource;
use App\Http\Requests\StoreOrderRequest;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $r)
    {
        $q = Order::query()->with('items.product');
        if ($st = $r->query('status'))
            $q->where('status', $st);
        return OrderResource::collection($q->latest()->paginate(20));
    }

    public function updateStatus(Request $r, Order $order)
    {
        $r->validate(['status' => ['required', 'in:new,accepted,rejected']]);
        $order->update(['status' => $r->status]);
        return new OrderResource($order->fresh('items.product'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreOrderRequest $req)
    {
        $data = $req->validated();
        $order = Order::create([
            'user_id' => optional($req->user())->id,
            'status' => 'new',
            'customer_name' => $data['customer_name'],
            'customer_email' => $data['customer_email'],
            'customer_phone' => $data['customer_phone'] ?? null,
            'total' => null,
        ]);
        foreach ($data['items'] as $it) {
            $p = Product::find($it['product_id']);
            $order->items()->create([
                'product_id' => $p->id,
                'quantity' => $it['quantity'],
                'unit_price' => $p->price,
                'options' => $it['options'] ?? [],
            ]);
        }
        return new OrderResource($order->load('items.product'));
    }

    public function my(Request $r)
    {
        return OrderResource::collection(
            Order::where('user_id', $r->user()->id)->latest()->paginate(20)
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
