<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;

class JuryAssignmentJury extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Collection $pfes,
        public $juryMember,
        public $isPresident
    ) {}

    public function envelope(): Envelope
    {
        $role = $this->isPresident ? 'Président' : 'Examinateur';
        $pfeCount = $this->pfes->count();
        
        $subject = $pfeCount === 1 
            ? "Attribution jury PFE - $role - " . $this->pfes->first()->intitule
            : "Attribution jurys PFE - $role - {$pfeCount} projets";

        Log::info('Building jury member assignment email envelope', [
            'pfe_count' => $pfeCount,
            'role' => $role,
            'member_id' => $this->juryMember->id,
            'pfe_ids' => $this->pfes->pluck('id')->toArray()
        ]);

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        Log::info('Building jury member assignment email content', [
            'pfe_count' => $this->pfes->count(),
            'is_president' => $this->isPresident,
            'member_id' => $this->juryMember->id,
            'pfe_ids' => $this->pfes->pluck('id')->toArray()
        ]);

        return new Content(
            view: 'emails.jury.jury-assignment-jury',
            with: [
                'member' => $this->juryMember, // Pass juryMember as 'member' to the view
                'pfes' => $this->pfes,
                'isPresident' => $this->isPresident
            ]
        );
    }

    public function build()
    {
        Log::info('Building complete jury member assignment email', [
            'pfe_count' => $this->pfes->count(),
            'is_president' => $this->isPresident,
            'member_id' => $this->juryMember->id
        ]);
        
        return $this;
    }

    public function failed(\Exception $exception)
    {
        Log::error('Jury member assignment email sending failed', [
            'error' => $exception->getMessage(),
            'pfe_count' => $this->pfes->count(),
            'is_president' => $this->isPresident,
            'member_id' => $this->juryMember->id,
            'pfe_ids' => $this->pfes->pluck('id')->toArray()
        ]);
    }
}
