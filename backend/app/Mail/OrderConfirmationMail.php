<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrderConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Order $order,
        public bool $isQuote = false,
        public ?string $adminNote = null
    ) {}

    public function build()
    {
        $subject = $this->isQuote
            ? 'Árajánlat kérése – visszaigazolás'
            : 'Rendelés visszaigazolása';

        return $this->subject($subject)
            ->view('emails.order_confirmation')
            ->with([
                'order' => $this->order->load('items.product'),
                'isQuote' => $this->isQuote,
                'adminNote' => $this->adminNote,
            ]);
    }
}
