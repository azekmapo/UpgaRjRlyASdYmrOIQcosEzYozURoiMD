<?php

namespace App\Mail;

use App\Models\Soutenance;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Carbon\Carbon;

class SoutenanceEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $soutenance;
    public $type; // 'creation' ou 'modification'

    /**
     * Create a new message instance.
     */
    public function __construct(Soutenance $soutenance, $type = 'creation')
    {
        $this->soutenance = $soutenance;
        $this->type = $type;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $subject = $this->type === 'creation' 
            ? 'Nouvelle soutenance programmée' 
            : 'Modification de soutenance';

        return $this->subject($subject)
                    ->view('emails.soutenance')
                    ->with([
                        'soutenance' => $this->soutenance,
                        'type' => $this->type,
                        'dateFormatted' => Carbon::parse($this->soutenance->date)->format('d/m/Y'),
                        'heureDebut' => Carbon::parse($this->soutenance->heure_debut)->format('H:i'),
                        'heureFin' => Carbon::parse($this->soutenance->heure_fin)->format('H:i'),
                    ]);
    }
}
