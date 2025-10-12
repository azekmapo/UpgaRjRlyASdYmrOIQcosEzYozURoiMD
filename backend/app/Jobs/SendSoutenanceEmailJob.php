<?php

namespace App\Jobs;

use App\Models\Soutenance;
use App\Mail\SoutenanceEmail as SoutenanceEmailMailable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendSoutenanceEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $soutenance;
    public $type;

    /**
     * Create a new job instance.
     */
    public function __construct($soutenance, $type = 'creation')
    {
        $this->soutenance = $soutenance;
        $this->type = $type;
    }

    /**
     * Execute the job.
     */
    public function handle()
    {
        Log::info("🚀 SendSoutenanceEmailJob STARTED for soutenance {$this->soutenance->id} (type: {$this->type})");
        
        try {
            Log::info("Début de l'envoi des emails pour la soutenance {$this->soutenance->id} (type: {$this->type})");

            // We already have the soutenance object, no need to reload it
            $soutenance = $this->soutenance;

            // Find all recipients
            $recipients = $this->findAllRecipients($soutenance);
            
            // Remove duplicates
            $uniqueRecipients = $this->removeDuplicates($recipients);
            
            // Send emails to each recipient
            $emailsSent = 0;
            $emailsErrors = 0;

            foreach ($uniqueRecipients as $recipient) {
                try {
                    Log::info("Tentative d'envoi d'email à {$recipient['name']} ({$recipient['email']}) - {$recipient['role']}");
                    Log::info("Soutenance object type: " . gettype($soutenance) . ", ID: " . ($soutenance ? $soutenance->id : 'null'));
                    
                    Mail::to($recipient['email'])
                        ->send(new SoutenanceEmailMailable($soutenance, $this->type));

                    $emailsSent++;
                    Log::info("Email envoyé avec succès à {$recipient['name']} ({$recipient['email']}) - {$recipient['role']}");
                } catch (\Exception $e) {
                    $emailsErrors++;
                    Log::error("Erreur lors de l'envoi de l'email à {$recipient['name']} ({$recipient['email']}): " . $e->getMessage());
                    Log::error("Exception details: " . $e->getTraceAsString());
                }
            }

            Log::info("Envoi des emails terminé pour la soutenance {$this->soutenance->id}. Envoyés: {$emailsSent}, Erreurs: {$emailsErrors}");
            Log::info("✅ SendSoutenanceEmailJob COMPLETED for soutenance {$this->soutenance->id}");

        } catch (\Exception $e) {
            Log::error("❌ SendSoutenanceEmailJob FAILED for soutenance {$this->soutenance->id}: " . $e->getMessage());
            Log::error("Erreur générale lors de l'envoi des emails pour la soutenance {$this->soutenance->id}: " . $e->getMessage());
            throw $e; // Re-throw to mark job as failed
        }
    }

    /**
     * Find all recipients for the soutenance
     */
    private function findAllRecipients($soutenance)
    {
        $recipients = [];

        // Ajouter les étudiants du groupe
        if ($soutenance->pfe && $soutenance->pfe->group) {
            if ($soutenance->pfe->group->student1User && $soutenance->pfe->group->student1User->email) {
                $recipients[] = [
                    'email' => $soutenance->pfe->group->student1User->email,
                    'name' => $soutenance->pfe->group->student1User->name,
                    'role' => 'Étudiant'
                ];
            }

            if ($soutenance->pfe->group->student2User && $soutenance->pfe->group->student2User->email) {
                $recipients[] = [
                    'email' => $soutenance->pfe->group->student2User->email,
                    'name' => $soutenance->pfe->group->student2User->name,
                    'role' => 'Étudiant'
                ];
            }
        }

        // Ajouter l'encadrant
        if ($soutenance->pfe && $soutenance->pfe->encadrantUser && $soutenance->pfe->encadrantUser->email) {
            $recipients[] = [
                'email' => $soutenance->pfe->encadrantUser->email,
                'name' => $soutenance->pfe->encadrantUser->name,
                'role' => 'Encadrant'
            ];
        }

        // Ajouter le co-encadrant s'il existe
        if ($soutenance->pfe && $soutenance->pfe->coEncadrantUser && $soutenance->pfe->coEncadrantUser->email) {
            $recipients[] = [
                'email' => $soutenance->pfe->coEncadrantUser->email,
                'name' => $soutenance->pfe->coEncadrantUser->name,
                'role' => 'Co-encadrant'
            ];
        }

        // Ajouter les membres du jury
        if ($soutenance->pfe && $soutenance->pfe->jury) {
            if ($soutenance->pfe->jury->presidentUser && $soutenance->pfe->jury->presidentUser->email) {
                $recipients[] = [
                    'email' => $soutenance->pfe->jury->presidentUser->email,
                    'name' => $soutenance->pfe->jury->presidentUser->name,
                    'role' => 'Président du jury'
                ];
            }

            if ($soutenance->pfe->jury->examinateurUser && $soutenance->pfe->jury->examinateurUser->email) {
                $recipients[] = [
                    'email' => $soutenance->pfe->jury->examinateurUser->email,
                    'name' => $soutenance->pfe->jury->examinateurUser->name,
                    'role' => 'Examinateur'
                ];
            }
        }

        return $recipients;
    }

    /**
     * Remove duplicate recipients based on email
     */
    private function removeDuplicates($recipients)
    {
        $uniqueRecipients = [];
        $seenEmails = [];

        foreach ($recipients as $recipient) {
            if (!in_array($recipient['email'], $seenEmails)) {
                $uniqueRecipients[] = $recipient;
                $seenEmails[] = $recipient['email'];
            }
        }

        return $uniqueRecipients;
    }
}