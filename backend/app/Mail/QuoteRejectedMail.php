<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class QuoteRejectedMail extends Mailable
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

        return $this->subject('Árajánlat elutasítva')
            ->view('emails.quote-rejected')
            ->with([
                'order' => $payload,
                'adminNote' => $this->adminNote,
                'showPrices' => false,
            ]);
    }
}
