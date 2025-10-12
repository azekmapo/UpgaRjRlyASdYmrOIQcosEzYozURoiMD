<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ThemeAssignmentEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $student;
    public $theme;
    public $group;

    public function __construct($student, $theme, $group)
    {
        $this->student = $student;
        $this->theme = $theme;
        $this->group = $group;
    }

    public function envelope(): Envelope
    {
        Log::info('Building email envelope', [
            'student_email' => $this->student->email,
            'student_name' => $this->student->name
        ]);

        return new Envelope(
            subject: 'Attribution de votre Thème PFE',
        );
    }

    public function content(): Content
    {
        Log::info('Building email content', [
            'theme_id' => $this->theme->id,
            'type_sujet' => $this->theme->type_sujet
        ]);

        return new Content(
            view: 'emails.theme-assigned',
        );
    }

    public function build()
    {
        Log::info('Building complete email', [
            'student' => $this->student->email,
            'theme' => $this->theme->id,
            'group' => $this->group->id
        ]);
        
        return $this;
    }

    public function failed(\Exception $exception)
    {
        Log::error('Email sending failed', [
            'error' => $exception->getMessage(),
            'student_email' => $this->student->email,
            'theme_id' => $this->theme->id
        ]);
    }
}