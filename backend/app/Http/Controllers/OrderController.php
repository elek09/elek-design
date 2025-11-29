<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdminUpdateOrderRequest;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Mail\QuoteRejectedMail;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class OrderController extends Controller
{
    public function __construct(private OrderService $orders) {}

    /**
     * Rendelések listázása (admin)
     * ?status=new|accepted|rejected - szűrés állapot szerint
     */
    public function index(Request $request)
    {
        $query = Order::with('items.product');
        
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        
        return OrderResource::collection($query->latest()->paginate(20));
    }

    /**
     * Rendelés státusz frissítése (admin)
     * new|accepted|rejected
     */
    public function updateStatus(Request $request, Order $order)
    {
        $request->validate(['status' => ['required', 'in:new,accepted,rejected']]);
        $oldStatus = $order->status;
        $order->update(['status' => $request->status]);
        
        // Elutasított árajánlat email küldése
        if ($request->status === 'rejected' && $order->kind === 'quote' && $oldStatus !== 'rejected') {
            try {
                Mail::to($order->customer_email)->send(
                    new QuoteRejectedMail($order, $order->admin_note)
                );
            } catch (\Throwable $e) {
                Log::warning('Quote rejected email failed: ' . $e->getMessage());
            }
        }
        
        return new OrderResource($order->fresh('items.product'));
    }

    /**
     * Rendelés részletes szerkesztése (admin)
     * Tételek mennyisége/ára, admin megjegyzés, státusz, végösszeg felülírás
     */
    public function updateAdmin(AdminUpdateOrderRequest $request, Order $order)
    {
        $data = $request->validated();

        // Tételek frissítése
        if (!empty($data['items'])) {
            $this->orders->updateOrderItems($order, $data['items']);
        }

        // Admin megjegyzés
        if (array_key_exists('admin_note', $data)) {
            $order->admin_note = $data['admin_note'];
        }

        // Státusz
        $oldStatus = $order->status;
        if (array_key_exists('status', $data)) {
            $order->status = $data['status'];
        }

        // Végösszeg: felülírás vagy újraszámolás
        $this->orders->recalcTotal($order, array_key_exists('total', $data) ? (float) $data['total'] : null);
        
        // Elutasított árajánlat email küldése
        if (isset($data['status']) && $data['status'] === 'rejected' && $order->kind === 'quote' && $oldStatus !== 'rejected') {
            try {
                Mail::to($order->customer_email)->send(
                    new QuoteRejectedMail($order, $order->admin_note)
                );
            } catch (\Throwable $e) {
                Log::warning('Quote rejected email failed: ' . $e->getMessage());
            }
        }

        return new OrderResource($order->fresh('items.product'));
    }

    /**
     * Megerősítő email küldése (admin)
     * Jelenlegi rendelés állapot és admin megjegyzés alapján
     */
    public function sendConfirmation(Request $request, Order $order)
    {
        try {
            $this->orders->sendConfirmation($order, $order->admin_note, true);
        } catch (\Throwable $e) {
            Log::warning('Admin send confirmation failed: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Email sending failed'], 500);
        }
        
        return response()->json(['success' => true]);
    }

    /**
     * Új rendelés/árajánlat létrehozása (bejelentkezett felhasználó)
     */
    public function store(StoreOrderRequest $request)
    {
        $data = $request->validated();
        $order = $this->orders->createFromData($data, $request->user()?->id);
        
        // Megerősítő email küldése
        try {
            $this->orders->sendConfirmation($order);
        } catch (\Throwable $e) {
            Log::warning('Order confirmation email failed: ' . $e->getMessage());
        }

        return new OrderResource($order);
    }

    /**
     * Publikus rendelés leadás (nem kötelező bejelentkezés)
     * Ugyanaz mint a store(), de nincs user_id
     */
    public function storePublic(StoreOrderRequest $request)
    {
        return $this->store($request);
    }

    /**
     * Saját rendelések listázása (bejelentkezett felhasználó)
     */
    public function my(Request $request)
    {
        return OrderResource::collection(
            Order::where('user_id', $request->user()->id)->latest()->paginate(20)
        );
    }

    /**
     * Egy rendelés részletes megtekintése (admin)
     */
    public function adminShow(Order $order)
    {
        return new OrderResource($order->load('items.product'));
    }

    /**
     * Rendelés/árajánlat törlése (admin)
     * Cascade-del törli a kapcsolódó order_items tételeket is
     */
    public function destroy(Order $order)
    {
        $order->delete();
        
        return response()->json([
            'message' => 'Rendelés sikeresen törölve'
        ]);
    }
}
