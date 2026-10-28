<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

// rendelés/árajánlat visszaigazoló email a vevőnek
class OrderConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Order|array $order,
        public bool $isQuote = false,
        public ?string $adminNote = null,
        public ?bool $showPrices = null
    ) {}

    public function build()
    {
        $subject = $this->isQuote
            ? 'Árajánlat kérése – visszaigazolás'
            : 'Rendelés visszaigazolása';

        $payload = $this->order;
        if ($payload instanceof Order) {
            $payload = $payload->load('items.product');
        }

        // árak megjelenítése - alapból rendelésnél igen, árajánlatnál nem
        $computedShowPrices = $this->showPrices !== null ? (bool) $this->showPrices : !$this->isQuote;
        if ($this->order instanceof Order) {
            $hasPositivePrice = (float) ($this->order->total ?? 0) > 0;
            if (!$hasPositivePrice) {
                foreach ($this->order->items as $it) {
                    if ((float) ($it->unit_price ?? 0) > 0) { $hasPositivePrice = true; break; }
                }
            }
            if (!$hasPositivePrice) {
                $computedShowPrices = false;
            }
        }

        return $this->subject($subject)
            ->view('emails.order-confirmation')
            ->with([
                'order' => $payload,
                'isQuote' => $this->isQuote,
                'adminNote' => $this->adminNote,
                'showPrices' => $computedShowPrices,
            ]);
    }
}
