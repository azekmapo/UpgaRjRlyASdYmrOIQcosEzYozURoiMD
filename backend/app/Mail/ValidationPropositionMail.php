<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\EmailValidationProposition;

class ValidationPropositionMail extends Mailable
{
    use Queueable, SerializesModels;

    public $emailValidation;

    public function __construct(EmailValidationProposition $emailValidation)
    {
        $this->emailValidation = $emailValidation;
    }

    public function envelope(): Envelope
    {
        $subject = 'Validation de votre proposition PFE';
        
        if ($this->emailValidation->status === 'accepted') {
            $subject = 'Proposition PFE acceptée';
        } elseif ($this->emailValidation->status === 'declined') {
            $subject = 'Proposition PFE refusée';
        }

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.validation-proposition',
            with: [
                'emailValidation' => $this->emailValidation,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}