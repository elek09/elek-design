<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ContactMessageUserMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public array $payload) {}

    public function build()
    {
        return $this->subject('Üzenet fogadva – Elek Design')
            ->view('emails.contact-user-confirmation')
            ->with([
                'name' => $this->payload['name'] ?? null,
            ]);
    }
}
