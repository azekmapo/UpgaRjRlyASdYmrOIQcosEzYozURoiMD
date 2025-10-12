<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Models\EmailImporteCsv;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\NewAccountNotification;

class SendImportedCsvEmails implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            if (EmailImporteCsv::count() == 0) {
                Log::info('Aucun email à envoyer');
                return;
            }

            $emails = EmailImporteCsv::all();

            foreach ($emails as $email) {
                try {
                    Mail::to($email->email)->send(
                        new NewAccountNotification($email->name, $email->email, $email->password, $email->role)
                    );
                    Log::info('Email envoyé: ' . $email->email);
                } catch (\Exception $e) {
                    Log::error('Email non envoyé: ' . $email->email);
                }
            }

            EmailImporteCsv::truncate();
        } catch (\Exception $e) {
            Log::error('Erreur dans SendImportedCsvEmails');
        }
    }
}
