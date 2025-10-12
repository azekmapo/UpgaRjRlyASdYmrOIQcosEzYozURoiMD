<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Models\PlanificationEmail;
use App\Mail\EnvoiEmailAdmin;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\SocketService;
use App\Enums\NotificationType;


class SendScheduledEmails implements ShouldQueue
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
        Log::info("Début de la vérification des emails à envoyer");

        $emailsAEnvoyer = PlanificationEmail::where('status', 'en_attente')
            ->where('date_envoi_planifie', '<=', Carbon::now())
            ->with('automation')
            ->get();

        foreach ($emailsAEnvoyer as $planification) {
            try {
                if (!in_array($planification->automation->status, ['en_attente', 'en_cours'])) {
                    continue;
                }

                if ($planification->automation->status === 'en_attente') {
                    $planification->automation->update(['status' => 'en_cours']);
                    $this->emitAutomationStatusUpdate($planification->automation);
                }

                $adminUser = User::where('role', 'admin')->first();
                if (!$adminUser) {
                    Log::error("Aucun administrateur trouvé pour l'envoi de notifications");
                    continue;
                }

                $emailSubject = $planification->automation->email_objet;
                $emailContent = $planification->automation->email_contenu;
                $firstSentence = $this->extractFirstSentence($emailContent);

                Log::info("template :" . $planification->automation->template);
                Log::info("periode :" . $planification->automation->periode);

                if ($planification->automation->template == '1' && $planification->automation->periode == '1') {
                    $studentsWithoutGroup = User::where('role', 'etudiant')
                        ->whereHas('etudiant', function ($query) {
                            $query->whereNotExists(function ($subquery) {
                                $subquery->select(DB::raw(1))
                                    ->from('groups')
                                    ->where(function ($q) {
                                        $q->whereColumn('groups.id_etd1', 'etudiants.id')
                                            ->orWhereColumn('groups.id_etd2', 'etudiants.id');
                                    });
                            });
                        })
                        ->with('etudiant')
                        ->get();

                    foreach ($studentsWithoutGroup as $student) {
                        Log::info("Envoi de l'email à " . $student->email);
                        try {
                            $this->createEmailNotification($adminUser->id, $student->id, $emailSubject, $firstSentence, $planification->automation->id);
                            Mail::to($student->email)->send(
                                new EnvoiEmailAdmin($emailSubject, $emailContent)
                            );
                        } catch (\Exception $e) {
                            Log::info("Email non envoyé à " . $student->email);
                        }
                    }
                } else if ($planification->automation->template == '1' && $planification->automation->periode == '2') {
                    $studentsWithoutProposition = DB::table('users')
                        ->join('etudiants', 'users.id', '=', 'etudiants.id')
                        ->leftJoin('groups', function ($join) {
                            $join->on('etudiants.id', '=', 'groups.id_etd1')
                                ->orOn('etudiants.id', '=', 'groups.id_etd2');
                        })
                        ->leftJoin('propositions_etudiant', 'groups.id', '=', 'propositions_etudiant.id_group')
                        ->where('users.role', 'etudiant')
                        ->whereNull('propositions_etudiant.id')
                        ->select('users.id', 'users.email')
                        ->get();

                    $teachersWithoutProposition = DB::table('users')
                        ->join('enseignants', 'users.id', '=', 'enseignants.id')
                        ->leftJoin('propositions_enseignant', 'enseignants.id', '=', 'propositions_enseignant.encadrant_id')
                        ->where('users.role', 'enseignant')
                        ->whereNull('propositions_enseignant.id')
                        ->select('users.id', 'users.email')
                        ->get();

                    $companiesWithoutProposition = DB::table('users')
                        ->leftJoin('propositions_entreprise', function ($join) {
                            $join->on('users.id', '=', 'propositions_entreprise.entreprise_id');
                        })
                        ->where('users.role', 'entreprise')
                        ->whereNull('propositions_entreprise.id')
                        ->select('users.id', 'users.email')
                        ->distinct()
                        ->get();

                    foreach ($studentsWithoutProposition as $student) {
                        Log::info("Envoi de l'email à l'étudiant: " . $student->email);
                        try {
                            $this->createEmailNotification($adminUser->id, $student->id, $emailSubject, $firstSentence, $planification->automation->id);
                            Mail::to($student->email)->send(
                                new EnvoiEmailAdmin($emailSubject, $emailContent)
                            );
                        } catch (\Exception $e) {
                            Log::info("Email non envoyé à " . $student->email);
                        }
                    }

                    foreach ($teachersWithoutProposition as $teacher) {
                        Log::info("Envoi de l'email à l'enseignant: " . $teacher->email);
                        try {
                            $this->createEmailNotification($adminUser->id, $teacher->id, $emailSubject, $firstSentence, $planification->automation->id);
                            Mail::to($teacher->email)->send(
                                new EnvoiEmailAdmin($emailSubject, $emailContent)
                            );
                        } catch (\Exception $e) {
                            Log::info("Email non envoyé à " . $teacher->email);
                        }
                    }

                    foreach ($companiesWithoutProposition as $company) {
                        Log::info("Envoi de l'email à l'entreprise: " . $company->email);
                        try {
                            $this->createEmailNotification($adminUser->id, $company->id, $emailSubject, $firstSentence, $planification->automation->id);
                            Mail::to($company->email)->send(
                                new EnvoiEmailAdmin($emailSubject, $emailContent)
                            );
                        } catch (\Exception $e) {
                            Log::info("Email non envoyé à " . $company->email);
                        }
                    }
                } else if ($planification->automation->template == '1' && $planification->automation->periode == '3') {
                    $studentsWithProposition = DB::table('users')
                        ->join('etudiants', 'users.id', '=', 'etudiants.id')
                        ->join('groups', function ($join) {
                            $join->on('etudiants.id', '=', 'groups.id_etd1')
                                ->orOn('etudiants.id', '=', 'groups.id_etd2');
                        })
                        ->join('propositions_etudiant', 'groups.id', '=', 'propositions_etudiant.id_group')
                        ->where('users.role', 'etudiant')
                        ->select('users.id', 'users.email')
                        ->distinct()
                        ->get();

                    $teachersWithProposition = DB::table('users')
                        ->join('enseignants', 'users.id', '=', 'enseignants.id')
                        ->join('propositions_enseignant', 'enseignants.id', '=', 'propositions_enseignant.encadrant_id')
                        ->where('users.role', 'enseignant')
                        ->select('users.id', 'users.email')
                        ->distinct()
                        ->get();

                    $companiesWithProposition = DB::table('users')
                        ->join('propositions_entreprise', 'users.id', '=', 'propositions_entreprise.entreprise_id')
                        ->where('users.role', 'entreprise')
                        ->select('users.id', 'users.email')
                        ->distinct()
                        ->get();

                    foreach ($studentsWithProposition as $student) {
                        Log::info("Envoi de l'email à l'étudiant: " . $student->email);
                        try {
                            $this->createEmailNotification($adminUser->id, $student->id, $emailSubject, $firstSentence, $planification->automation->id);
                            Mail::to($student->email)->send(
                                new EnvoiEmailAdmin($emailSubject, $emailContent)
                            );
                        } catch (\Exception $e) {
                            Log::info("Email non envoyé à " . $student->email);
                        }
                    }

                    foreach ($teachersWithProposition as $teacher) {
                        Log::info("Envoi de l'email à l'enseignant: " . $teacher->email);
                        try {
                            $this->createEmailNotification($adminUser->id, $teacher->id, $emailSubject, $firstSentence, $planification->automation->id);
                            Mail::to($teacher->email)->send(
                                new EnvoiEmailAdmin($emailSubject, $emailContent)
                            );
                        } catch (\Exception $e) {
                            Log::info("Email non envoyé à " . $teacher->email);
                        }
                    }

                    foreach ($companiesWithProposition as $company) {
                        Log::info("Envoi de l'email à l'entreprise: " . $company->email);
                        try {
                            $this->createEmailNotification($adminUser->id, $company->id, $emailSubject, $firstSentence, $planification->automation->id);
                            Mail::to($company->email)->send(
                                new EnvoiEmailAdmin($emailSubject, $emailContent)
                            );
                        } catch (\Exception $e) {
                            Log::info("Email non envoyé à " . $company->email);
                        }
                    }
                } else if ($planification->automation->template == '1' && $planification->automation->periode == '4') {
                    $studentsToNotify = DB::table('users')
                        ->join('etudiants', 'users.id', '=', 'etudiants.id')
                        ->leftJoin('groups', function ($join) {
                            $join->on('etudiants.id', '=', 'groups.id_etd1')
                                ->orOn('etudiants.id', '=', 'groups.id_etd2');
                        })
                        ->leftJoin('propositions_etudiant', function ($join) {
                            $join->on('groups.id', '=', 'propositions_etudiant.id_group')
                                ->where('propositions_etudiant.status', '=', 'accepted');
                        })
                        ->where('users.role', 'etudiant')
                        ->whereNull('propositions_etudiant.id')
                        ->select('users.id', 'users.email')
                        ->distinct()
                        ->get();

                    foreach ($studentsToNotify as $student) {
                        Log::info("Envoi de l'email à l'étudiant: " . $student->email);
                        try {
                            $this->createEmailNotification($adminUser->id, $student->id, $emailSubject, $firstSentence, $planification->automation->id);
                            Mail::to($student->email)->send(
                                new EnvoiEmailAdmin($emailSubject, $emailContent)
                            );
                        } catch (\Exception $e) {
                            Log::info("Email non envoyé à " . $student->email);
                        }
                    }
                } else if ($planification->automation->template == '1' && $planification->automation->periode == '5') {
                    $allTeachers = DB::table('users')
                        ->join('enseignants', 'users.id', '=', 'enseignants.id')
                        ->where('users.role', 'enseignant')
                        ->select('users.id', 'users.email')
                        ->distinct()
                        ->get();

                    foreach ($allTeachers as $teacher) {
                        Log::info("Envoi de l'email à l'enseignant: " . $teacher->email);
                        try {
                            $this->createEmailNotification($adminUser->id, $teacher->id, $emailSubject, $firstSentence, $planification->automation->id);
                            Mail::to($teacher->email)->send(
                                new EnvoiEmailAdmin($emailSubject, $emailContent)
                            );
                        } catch (\Exception $e) {
                            Log::info("Email non envoyé à " . $teacher->email);
                        }
                    }
                } else if ($planification->automation->template == '1' && $planification->automation->periode == '7') {
                    $supervisors = DB::table('users')
                        ->join('enseignants', 'users.id', '=', 'enseignants.id')
                        ->join('pfes', function ($join) {
                            $join->on('enseignants.id', '=', 'pfes.id_encadrant')
                                ->orOn('enseignants.id', '=', 'pfes.id_co_encadrant');
                        })
                        ->where('users.role', 'enseignant')
                        ->select('users.id', 'users.email')
                        ->distinct()
                        ->get();

                    foreach ($supervisors as $supervisor) {
                        Log::info("Envoi de l'email à l'encadrant: " . $supervisor->email);
                        try {
                            $this->createEmailNotification($adminUser->id, $supervisor->id, $emailSubject, $firstSentence, $planification->automation->id);
                            Mail::to($supervisor->email)->send(
                                new EnvoiEmailAdmin($emailSubject, $emailContent)
                            );
                        } catch (\Exception $e) {
                            Log::info("Email non envoyé à " . $supervisor->email);
                        }
                    }
                } else if ($planification->automation->template == '1' && $planification->automation->periode == '8') {
                    $teachersWithoutWishes = DB::table('users')
                        ->join('enseignants', 'users.id', '=', 'enseignants.id')
                        ->leftJoin('voeux_jury', 'enseignants.id', '=', 'voeux_jury.id_enseignant')
                        ->where('users.role', 'enseignant')
                        ->whereNull('voeux_jury.id')
                        ->select('users.id', 'users.email')
                        ->distinct()
                        ->get();

                    foreach ($teachersWithoutWishes as $teacher) {
                        Log::info("Envoi de l'email à l'enseignant: " . $teacher->email);
                        try {
                            $this->createEmailNotification($adminUser->id, $teacher->id, $emailSubject, $firstSentence, $planification->automation->id);
                            Mail::to($teacher->email)->send(
                                new EnvoiEmailAdmin($emailSubject, $emailContent)
                            );
                        } catch (\Exception $e) {
                            Log::info("Email non envoyé à " . $teacher->email);
                        }
                    }
                } else if ($planification->automation->template == 'email_personnalisé') {
                    $users = collect();

                    if (str_contains($planification->automation->description, 'etudiants')) {
                        $users = User::where('role', 'etudiant')
                            ->select('id', 'email')
                            ->get();
                    } else if (str_contains($planification->automation->description, 'enseignants')) {
                        $users = User::where('role', 'enseignant')
                            ->select('id', 'email')
                            ->get();
                    } else if (str_contains($planification->automation->description, 'entreprises')) {
                        $users = User::where('role', 'entreprise')
                            ->select('id', 'email')
                            ->get();
                    } else {
                        $users = User::select('id', 'email')->get();
                    }

                    foreach ($users as $user) {
                        Log::info("Envoi de l'email personnalisé à: " . $user->email);
                        try {
                            $this->createEmailNotification($adminUser->id, $user->id, $emailSubject, $firstSentence, $planification->automation->id);
                            Mail::to($user->email)->send(
                                new EnvoiEmailAdmin($emailSubject, $emailContent)
                            );
                        } catch (\Exception $e) {
                            Log::info("Email non envoyé à " . $user->email);
                        }
                    }
                }

                $planification->update(['status' => 'envoye']);
                $this->emitAutomationUpdate($planification);
            } catch (\Exception $e) {
                $planification->update(['status' => 'echoue']);
                $this->emitAutomationUpdate($planification);
            }

            $emailsRestants = PlanificationEmail::where('automation_id', $planification->automation_id)
                ->where('status', 'en_attente')
                ->count();

            if ($emailsRestants === 0) {
                $planification->automation->update(['status' => 'termine']);
                $this->emitAutomationStatusUpdate($planification->automation);
            }
        }

        Log::info("Fin de la vérification des emails à envoyer");
    }

    private function emitAutomationUpdate($planification)
    {
        try {
            $socketService = app(SocketService::class);

            $updateData = [
                'type' => NotificationType::EMAIL_AUTOMATION_UPDATE,
                'planification_id' => $planification->id,
                'automation_id' => $planification->automation_id,
                'planification_status' => $planification->status
            ];

            $admins = User::where('role', 'admin')->get();
            foreach ($admins as $admin) {
                $socketService->emitNotification($admin->id, $updateData);
            }
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'émission de la notification d\'automatisation', [
                'error' => 'error',
                'planification_id' => $planification->id
            ]);
        }
    }

    private function emitAutomationStatusUpdate($automation)
    {
        try {
            $socketService = app(SocketService::class);

            $updateData = [
                'type' => NotificationType::EMAIL_AUTOMATION_STATUS_UPDATE,
                'automation_id' => $automation->id,
                'automation_status' => $automation->status,
            ];

            $admins = User::where('role', 'admin')->get();
            foreach ($admins as $admin) {
                $socketService->emitNotification($admin->id, $updateData);
            }
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'émission de la notification de statut d\'automation', [
                'error' => 'error',
                'automation_id' => $automation->id
            ]);
        }
    }

    private function extractFirstSentence($content)
    {
        $content = trim($content);
        if (empty($content)) {
            return 'Nouveau message...';
        }

        $sentences = preg_split('/[.!?]+/', $content, 2, PREG_SPLIT_NO_EMPTY);
        $firstSentence = trim($sentences[0] ?? '');

        if (empty($firstSentence)) {
            $firstSentence = substr($content, 0, 100);
        }

        return $firstSentence . '...';
    }

    private function createEmailNotification($senderId, $receiverId, $title, $message, $automationId)
    {
        try {
            $socketService = app(SocketService::class);

            $notification = \App\Models\Notification::create([
                'sender_id' => $senderId,
                'receiver_id' => $receiverId,
                'title' => $title,
                'message' => $message,
                'type' => \App\Enums\NotificationType::EMAIL_NOTIFICATION,
                'status' => 'new',
                'email_automation_id' => $automationId,
            ]);

            $notificationWithRelations = $notification->fresh(['sender', 'receiver']);
            $socketService->emitNotification($receiverId, $notificationWithRelations);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de la notification email', [
                'error' => 'error',
                'sender_id' => $senderId,
                'receiver_id' => $receiverId,
            ]);
        }
    }
}
