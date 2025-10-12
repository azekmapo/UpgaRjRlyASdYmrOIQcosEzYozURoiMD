<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class EnvoiEmailAdmin extends Mailable
{
    use Queueable, SerializesModels;

    public $sujet;
    public $contenu;

    public function __construct($sujet, $contenu)
    {
        $this->sujet = $sujet;
        $this->contenu = $contenu;
    }

    public function build()
    {
        return $this->subject($this->sujet)
                    ->view('emails.admin-message');
    }
}