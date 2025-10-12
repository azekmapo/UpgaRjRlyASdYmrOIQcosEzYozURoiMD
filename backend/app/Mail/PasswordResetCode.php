<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PasswordResetCode extends Mailable
{
    use Queueable, SerializesModels;

    public $code;

    public function __construct($code)
    {
        $this->code = $code;
    }

    public function build()
    {
        return $this
        ->subject('Code de réinitialisation de votre mot de passe')
        ->view('emails.password_reset_code')
        ->with([
            'code' => $this->code,
        ]);
    }
}
