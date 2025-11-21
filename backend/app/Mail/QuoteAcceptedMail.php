<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class QuoteAcceptedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Order|array $order,
        public ?string $adminNote = null
    ) {}

    public function build()
    {
        $payload = $this->order;
        if ($payload instanceof Order) {
            $payload = $payload->load('items.product');
        }

        return $this->subject('Árajánlat elfogadva')
            ->view('emails.quote-accepted')
            ->with([
                'order' => $payload,
                'adminNote' => $this->adminNote,
                'showPrices' => true,
            ]);
    }
}
