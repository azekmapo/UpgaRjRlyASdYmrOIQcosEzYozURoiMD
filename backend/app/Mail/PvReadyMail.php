<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PvReadyMail extends Mailable
{
    use Queueable, SerializesModels;

    public $downloadUrl;

    public function __construct($downloadUrl)
    {
        $this->downloadUrl = $downloadUrl;
    }

    public function build()
    {
        return $this->subject('PVs de notation prêts pour téléchargement')
                    ->view('emails.pv-ready')
                    ->with([
                        'downloadUrl' => $this->downloadUrl,
                    ]);
    }
}
