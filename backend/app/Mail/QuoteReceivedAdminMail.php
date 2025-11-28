<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class QuoteReceivedAdminMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function build()
    {
        return $this->subject('Új árajánlat érkezett')
            ->view('emails.quote-received-admin')
            ->with([
                'order' => $this->order->load('items.product'),
            ]);
    }
}
