<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Product;
use App\Http\Resources\OrderResource;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\AdminUpdateOrderRequest;
use App\Services\OrderService;

class OrderController extends Controller
{
    public function __construct(private OrderService $orders) {}
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
     * Admin: update order details (items price/qty, total override, admin note, optional status).
     */
    public function updateAdmin(AdminUpdateOrderRequest $r, Order $order)
    {
        $data = $r->validated();

        // Update items
        if (!empty($data['items'])) {
            $itemsById = $order->items()->get()->keyBy('id');
            foreach ($data['items'] as $row) {
                $id = (int) $row['id'];
                if (!$itemsById->has($id)) continue; // ensure belongs to this order
                $update = [];
                if (array_key_exists('quantity', $row)) $update['quantity'] = (int) $row['quantity'];
                if (array_key_exists('unit_price', $row)) $update['unit_price'] = (float) $row['unit_price'];
                if (!empty($update)) {
                    $itemsById[$id]->update($update);
                }
            }
        }

        // Admin note
        if (array_key_exists('admin_note', $data)) {
            $order->admin_note = $data['admin_note'];
        }

        // Status
        if (array_key_exists('status', $data)) {
            $order->status = $data['status'];
        }

        // Total: override or recalc via service
        $this->orders->recalcTotal($order, array_key_exists('total', $data) ? (float) $data['total'] : null);

        return new OrderResource($order->fresh('items.product'));
    }

    /**
     * Admin: send confirmation email reflecting current order state and admin note.
     */
    public function sendConfirmation(Request $r, Order $order)
    {
        $isQuote = $order->kind === 'quote';
        try {
            // Admin manuálisan küldi: jelöljük a szolgáltatásnak
            $this->orders->sendConfirmation($order, $order->admin_note, true);
        } catch (\Throwable $e) {
            \Log::warning('Admin send confirmation failed: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Email sending failed'], 500);
        }
        return response()->json(['success' => true]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreOrderRequest $req)
    {
        $data = $req->validated();
        $isQuote = (bool)($data['is_quote'] ?? false);
        $order = Order::create([
            'user_id' => optional($req->user())->id,
            'kind' => $isQuote ? 'quote' : 'order',
            'status' => 'new',
            'customer_name' => $data['customer_name'],
            'customer_email' => $data['customer_email'],
            'customer_phone' => $data['customer_phone'] ?? null,
            'total' => $isQuote ? null : 0,
        ]);
        $total = 0;
        foreach ($data['items'] as $it) {
            $p = Product::find($it['product_id']);
            $order->items()->create([
                'product_id' => $p->id,
                'quantity' => $it['quantity'],
                'unit_price' => $p->price,
                'options' => $it['options'] ?? [],
            ]);
            if (!$isQuote) {
                $total += ((float) ($p->price ?? 0)) * (int) $it['quantity'];
            }
        }
        if (!$isQuote) $order->update(['total' => $total]);
        // Send confirmation email (quote-style if requested)
        try {
            $this->orders->sendConfirmation($order);
        } catch (\Throwable $e) {
            // Swallow mail errors to not break API; logs will capture
            \Log::warning('Order confirmation email failed: ' . $e->getMessage());
        }

        return new OrderResource($order->load('items.product'));
    }

        /**
         * Public submission endpoint (no session, no auth required).
         * Accepts same payload as StoreOrderRequest; uses is_quote to determine kind.
         */
        public function storePublic(StoreOrderRequest $req)
        {
            return $this->store($req);
        }

    public function my(Request $r)
    {
        return OrderResource::collection(
            Order::where('user_id', $r->user()->id)->latest()->paginate(20)
        );
    }

    // Admin: get a single order with items
    public function adminShow(Order $order)
    {
        return new OrderResource($order->load('items.product'));
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
