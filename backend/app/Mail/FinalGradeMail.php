<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FinalGradeMail extends Mailable
{
    use Queueable, SerializesModels;

    public $studentName;
    public $pfeTitle;
    public $finalGrade;

    /**
     * Create a new message instance.
     */
    public function __construct($studentName, $pfeTitle, $finalGrade)
    {
        $this->studentName = $studentName;
        $this->pfeTitle = $pfeTitle;
        $this->finalGrade = $finalGrade;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Résultats de votre Projet de Fin d\'Études',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.final-grade',
            with: [
                'studentName' => $this->studentName,
                'pfeTitle' => $this->pfeTitle,
                'finalGrade' => $this->finalGrade,
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
