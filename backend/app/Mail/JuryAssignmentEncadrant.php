<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;

class JuryAssignmentEncadrant extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Collection $pfes,
        public $encadrant
    ) {}

    public function envelope(): Envelope
    {
        $pfeCount = $this->pfes->count();
        $subject = $pfeCount === 1 
            ? 'Attribution du jury PFE - ' . $this->pfes->first()->intitule
            : "Attribution des jurys PFE - {$pfeCount} projets";

        Log::info('Building encadrant jury assignment email envelope', [
            'pfe_count' => $pfeCount,
            'encadrant_id' => $this->encadrant->id,
            'pfe_ids' => $this->pfes->pluck('id')->toArray()
        ]);

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        Log::info('Building encadrant jury assignment email content', [
            'pfe_count' => $this->pfes->count(),
            'encadrant_id' => $this->encadrant->id,
            'pfe_ids' => $this->pfes->pluck('id')->toArray()
        ]);

        return new Content(
            view: 'emails.jury.jury-assignment-encadrant',
        );
    }

    public function build()
    {
        Log::info('Building complete encadrant jury assignment email', [
            'pfe_count' => $this->pfes->count(),
            'encadrant_id' => $this->encadrant->id
        ]);
        
        return $this;
    }

    public function failed(\Exception $exception)
    {
        Log::error('Encadrant jury assignment email sending failed', [
            'error' => $exception->getMessage(),
            'pfe_count' => $this->pfes->count(),
            'encadrant_id' => $this->encadrant->id,
            'pfe_ids' => $this->pfes->pluck('id')->toArray()
        ]);
    }
}