<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Models\EmailValidationProposition;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\ValidationPropositionMail;
use App\Services\SocketService;
use App\Models\Notification;
use App\Models\User;
use App\Enums\NotificationType;

class SendValidationsProposalsEmails implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    protected $socketService;

    public function __construct(SocketService $socketService)
    {
        $this->socketService = $socketService;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $emails = EmailValidationProposition::all();

            foreach ($emails as $email) {
                $users = [];

                if ($email->email) {
                    $user = User::where('email', $email->email)->first();
                    if ($user) {
                        $users[] = $user;
                    }
                }

                if ($email->email2) {
                    $user2 = User::where('email', $email->email2)->first();
                    if ($user2) {
                        $users[] = $user2;
                    }
                }

                foreach ($users as $user) {
                    $title = $email->status === 'accepted' ? 'Proposition PFE Acceptée' : 'Proposition PFE Refusée';
                    $message = $email->status === 'accepted'
                        ? "Votre proposition de projet intitulée \"{$email->intitule}\" a été acceptée."
                        : "Votre proposition de projet intitulée \"{$email->intitule}\" a été refusée.";

                    $notification = Notification::create([
                        'sender_id' => User::first()->id,
                        'receiver_id' => $user->id,
                        'title' => $title,
                        'message' => $message,
                        'type' => NotificationType::PFE_VALIDATION,
                        'status' => $email->status,
                        'email_validation_id' => $email->id,
                    ]);

                    $notificationWithRelations = $notification->fresh(['sender', 'receiver']);

                    try {
                        $this->socketService->emitNotification($user->id, $notificationWithRelations);
                    } catch (\Exception $e) {
                    }
                }

                try {
                    Mail::to($email->email)->send(
                        new ValidationPropositionMail($email)
                    );
                    Log::info('Email envoyé: ' . $email->email);
                } catch (\Exception $e) {
                    Log::error('Email non envoyé: ' . $email->email);
                }

                if ($email->email2) {
                    try {
                        Mail::to($email->email2)->send(
                            new ValidationPropositionMail($email)
                        );
                        Log::info('Email envoyé: ' . $email->email2);
                    } catch (\Exception $e) {
                        Log::error('Email non envoyé: ' . $email->email2);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Erreur dans SendValidationsProposalsEmails');
        }
    }
}
