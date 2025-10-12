<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class ResultatFicheVoeux extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public Collection $pfes,
        public $recipient,
        public bool $isEnseignant
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Attribution PFE ' . date('Y'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        // Pass both pfes and recipient to the view
        return new Content(
            view: $this->isEnseignant ? 'emails.pfe.enseignant' : 'emails.pfe.etudiant',
            with: [
                'pfes' => $this->pfes,
                'recipient' => $this->recipient,
            ],
        );
    }
}