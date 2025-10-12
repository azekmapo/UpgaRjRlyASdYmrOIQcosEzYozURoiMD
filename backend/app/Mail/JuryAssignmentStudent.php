<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class JuryAssignmentStudent extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public $pfe,
        public $president,
        public $examinateur,
        public $student  // The specific student receiving this email
    ) {}

    public function envelope(): Envelope
    {
        Log::info('Building student jury assignment email envelope', [
            'pfe_id' => $this->pfe->id,
            'student_id' => $this->student->id,
            'student_name' => $this->student->name
        ]);

        return new Envelope(
            subject: 'Attribution du jury PFE - ' . $this->pfe->intitule,
        );
    }

    public function content(): Content
    {
        Log::info('Building student jury assignment email content', [
            'pfe_id' => $this->pfe->id,
            'president_id' => $this->president->id,
            'examinateur_id' => $this->examinateur->id,
            'student_name' => $this->student->name
        ]);

        return new Content(
            view: 'emails.jury.jury-assignment-etudiant',
        );
    }

    public function build()
    {
        Log::info('Building complete student jury assignment email', [
            'pfe_id' => $this->pfe->id,
            'student_id' => $this->student->id
        ]);
        
        return $this;
    }

    public function failed(\Exception $exception)
    {
        Log::error('Student jury assignment email sending failed', [
            'error' => $exception->getMessage(),
            'pfe_id' => $this->pfe->id,
            'student_id' => $this->student->id ?? 'unknown'
        ]);
    }
}