<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NewAccountNotification extends Mailable
{
    use Queueable, SerializesModels;

    public $name;
    public $email;
    public $password;
    public $role;

    /**
     * Create a new message instance.
     */
    public function __construct($name, $email, $password,$role)
    {
        $this->name = $name;
        $this->email = $email;
        $this->password = $password;
        $this->role= $role;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('Bienvenue sur notre plateforme de gestion de projets de fin d\'etudes')
                    ->view('emails.new_account')
                    ->with([
                        'name' => $this->name,
                        'role' => $this->role,
                        'email' => $this->email,
                        'password' => $this->password,
                    ]);
    }
}