<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ContactMessageMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public array $payload) {}

    public function build()
    {
        return $this->subject('Új üzenet érkezett: '.$this->payload['subject'])
            ->replyTo($this->payload['email'], $this->payload['name'])
            ->view('emails.contact-message')
            ->with([
                'name' => $this->payload['name'],
                'email' => $this->payload['email'],
                'subject' => $this->payload['subject'],
                'message_text' => $this->payload['message'],
                'ip' => $this->payload['ip'] ?? null,
                'sent_at' => now(),
            ]);
    }
}
