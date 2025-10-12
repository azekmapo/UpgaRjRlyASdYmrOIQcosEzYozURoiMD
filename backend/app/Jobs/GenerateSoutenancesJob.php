<?php

namespace App\Jobs;

use App\Http\Controllers\SoutenanceController;
use App\Models\Notification;
use App\Models\Periode;
use App\Models\Pfe;
use App\Models\Salle;
use App\Models\Soutenance;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\SocketService;

class GenerateSoutenancesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public $tries = 3;

    protected $configData;
    protected $userId;

    public function __construct(array $configData, string $userId)
    {
        $this->configData = $configData;
        $this->userId = $userId;
        $this->onQueue('soutenances');
    }

    public function handle(): void
    {
        try {
            Log::info('Starting soutenance generation job', [
                'user_id' => $this->userId,
                'session' => $this->configData['working_hours']['session'] ?? 'unknown'
            ]);

            $result = $this->generateSoutenances();

            Log::info('Soutenance generation job completed successfully', [
                'user_id' => $this->userId,
                'created_count' => $result['created_count'],
                'unassigned_count' => $result['unassigned_count']
            ]);

            $this->sendCompletionNotification($result);
        } catch (\Exception $e) {
            Log::error('Soutenance generation job failed', [
                'user_id' => $this->userId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            $this->sendFailureNotification($e->getMessage());

            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('Soutenance generation job failed permanently', [
            'user_id' => $this->userId,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts()
        ]);

        // Send final failure notification
        $this->sendFailureNotification("Échec définitif après {$this->tries} tentatives: " . $exception->getMessage());
    }

    private function generateSoutenances(): array
    {
        $startTime = microtime(true);

        $this->validateConfiguration();

        $session = $this->configData['working_hours']['session'];
        $periodeTitle = 'Soutenances : Session ' . $session;
        $sessionLabel = 'session ' . $session;

        $periodeSoutenances = Periode::where('titre', $periodeTitle)->first();
        if (!$periodeSoutenances) {
            throw new \Exception('Période des soutenances introuvable.');
        }

        $startDate = Carbon::parse($periodeSoutenances->date_debut);
        $endDate = Carbon::parse($periodeSoutenances->date_fin);

        if ($startDate->greaterThanOrEqualTo($endDate)) {
            throw new \Exception('La date de début doit être avant la date de fin.');
        }

        $excludedDates = collect($this->configData['excluded_dates'] ?? []);

        Soutenance::where('session', $sessionLabel)->delete();

        foreach ($this->configData['rooms'] as $roomData) {
            Salle::firstOrCreate(['nom_salle' => $roomData['name']]);
        }

        $pfes = Pfe::where('session', $sessionLabel)
            ->whereNotNull('id_jury')
            ->get();

        if ($pfes->isEmpty()) {
            throw new \Exception('Aucun PFE trouvé pour cette session');
        }

        $result = $this->scheduleSoutenances($pfes, $startDate, $endDate, $excludedDates);

        $totalTime = microtime(true) - $startTime;

        Log::info('Soutenance generation completed', [
            'created_count' => $result['created_count'],
            'unassigned_count' => $result['unassigned_count'],
            'execution_time' => round($totalTime, 4) . 's',
            'session' => $sessionLabel
        ]);

        if ($result['unassigned_count'] > 0) {
            Log::warning('Some soutenances could not be scheduled', [
                'unassigned_count' => $result['unassigned_count'],
                'unassigned_pfe_ids' => $result['unassigned_pfe_ids']
            ]);
        }

        return $result;
    }

    private function validateConfiguration(): void
    {
        if (!isset($this->configData['working_hours'])) {
            throw new \Exception('Working hours configuration is required');
        }

        if (!isset($this->configData['rooms']) || empty($this->configData['rooms'])) {
            throw new \Exception('At least one room is required');
        }

        $workingHours = $this->configData['working_hours'];
        if ($workingHours['start_time'] >= $workingHours['end_time']) {
            throw new \Exception('Start time must be before end time');
        }
    }

    private function scheduleSoutenances($pfes, $startDate, $endDate, $excludedDates): array
    {
        $workingHours = $this->configData['working_hours'];
        $startTime = Carbon::createFromFormat('H:i', $workingHours['start_time']);
        $endTime = Carbon::createFromFormat('H:i', $workingHours['end_time']);

        $defenseDuration = SoutenanceController::DEFAULT_DEFENSE_DURATION;
        $breakDuration = SoutenanceController::DEFAULT_BREAK_DURATION;

        $currentDate = $startDate->copy();
        $createdSoutenances = [];
        $unassignedPfeIds = [];

        while ($currentDate->lessThanOrEqualTo($endDate) && $pfes->isNotEmpty()) {
            if (
                $currentDate->isFriday() ||
                $this->isHoliday($currentDate->toDateString()) ||
                $excludedDates->contains($currentDate->toDateString())
            ) {
                $currentDate->addDay();
                continue;
            }

            $timeSlot = $startTime->copy();
            while ($timeSlot->copy()->addMinutes($defenseDuration)->lessThanOrEqualTo($endTime)) {
                $defenseEnd = $timeSlot->copy()->addMinutes($defenseDuration);

                foreach ($pfes as $key => $pfe) {
                    if (!$this->hasTimeConflict($pfe, $currentDate->toDateString(), $timeSlot->toTimeString(), $defenseEnd->toTimeString())) {
                        $availableRoom = $this->findAvailableRoom(
                            $this->configData['rooms'],
                            $currentDate->toDateString(),
                            $timeSlot->toTimeString(),
                            $defenseEnd->toTimeString()
                        );

                        if ($availableRoom) {
                            $soutenance = Soutenance::create([
                                'id_pfe' => $pfe->id,
                                'id_salle' => $availableRoom->id,
                                'date' => $currentDate->toDateString(),
                                'heure_debut' => $timeSlot->toTimeString(),
                                'heure_fin' => $defenseEnd->toTimeString(),
                                'session' => 'session ' . $this->configData['working_hours']['session'],
                            ]);

                            $createdSoutenances[] = $soutenance->id;
                            $pfes->forget($key);
                            $this->dispatchEmailJob($soutenance->id);
                        }
                    }
                }
                $timeSlot->addMinutes($breakDuration);
            }
            $currentDate->addDay();
        }

        if ($pfes->isNotEmpty()) {
            $unassignedPfeIds = $pfes->pluck('id')->toArray();
        }

        return [
            'created_count' => count($createdSoutenances),
            'unassigned_count' => count($unassignedPfeIds),
            'unassigned_pfe_ids' => $unassignedPfeIds,
            'created_soutenance_ids' => $createdSoutenances
        ];
    }

    private function isHoliday($date): bool
    {
        $dateObj = Carbon::parse($date);
        $month = $dateObj->month;
        $day = $dateObj->day;

        $holidays = [
            ['month' => 1, 'day' => 1],   // 1er janvier
            ['month' => 1, 'day' => 12],  // 12 janvier
            ['month' => 5, 'day' => 1],   // 1er mai
            ['month' => 7, 'day' => 5],   // 5 juillet
            ['month' => 11, 'day' => 1],  // 1er novembre
        ];

        foreach ($holidays as $holiday) {
            if ($month === $holiday['month'] && $day === $holiday['day']) {
                return true;
            }
        }
        return false;
    }

    private function hasTimeConflict($pfe, $date, $startTime, $endTime): bool
    {
        $existingSoutenances = Soutenance::whereDate('date', $date)
            ->where(function ($query) use ($startTime, $endTime) {
                $query->whereBetween('heure_debut', [$startTime, $endTime])
                    ->orWhereBetween('heure_fin', [$startTime, $endTime])
                    ->orWhere(function ($q) use ($startTime, $endTime) {
                        $q->where('heure_debut', '<=', $startTime)
                            ->where('heure_fin', '>=', $endTime);
                    });
            })
            ->with(['pfe.jury', 'pfe.encadrant', 'pfe.coEncadrant'])
            ->get();

        foreach ($existingSoutenances as $existingSoutenance) {
            if ($this->hasPersonConflict($pfe, $existingSoutenance->pfe)) {
                return true;
            }
        }

        return false;
    }
    private function hasPersonConflict($pfe1, $pfe2): bool
    {
        $pfe1Supervisors = array_filter([$pfe1->id_encadrant, $pfe1->id_co_encadrant]);
        $pfe1JuryMembers = [];
        if ($pfe1->jury) {
            $pfe1JuryMembers = array_filter([$pfe1->jury->id_president, $pfe1->jury->id_examinateur]);
        }

        $pfe2Supervisors = array_filter([$pfe2->id_encadrant, $pfe2->id_co_encadrant]);
        $pfe2JuryMembers = [];
        if ($pfe2->jury) {
            $pfe2JuryMembers = array_filter([$pfe2->jury->id_president, $pfe2->jury->id_examinateur]);
        }

        return (
            array_intersect($pfe1Supervisors, $pfe2Supervisors) ||
            array_intersect($pfe1JuryMembers, $pfe2JuryMembers) ||
            array_intersect($pfe1Supervisors, $pfe2JuryMembers) ||
            array_intersect($pfe2Supervisors, $pfe1JuryMembers)
        );
    }


    private function findAvailableRoom($rooms, $date, $startTime, $endTime)
    {
        static $roomsCache = [];

        $roomNames = collect($rooms)->pluck('name')->unique();

        if (empty($roomsCache)) {
            $roomsCache = Salle::whereIn('nom_salle', $roomNames)->get()->keyBy('nom_salle');
        }

        foreach ($rooms as $roomData) {
            $room = $roomsCache->get($roomData['name']);
            if (!$room) {
                continue;
            }

            $roomConflicts = Soutenance::where('id_salle', $room->id)
                ->whereDate('date', $date)
                ->where(function ($query) use ($startTime, $endTime) {
                    $query->where(function ($q) use ($startTime, $endTime) {
                        $q->where('heure_debut', '<=', $startTime)
                            ->where('heure_fin', '>', $startTime);
                    })->orWhere(function ($q) use ($startTime, $endTime) {
                        $q->where('heure_debut', '<', $endTime)
                            ->where('heure_fin', '>=', $endTime);
                    })->orWhere(function ($q) use ($startTime, $endTime) {
                        $q->where('heure_debut', '>=', $startTime)
                            ->where('heure_fin', '<=', $endTime);
                    })->orWhere(function ($q) use ($startTime, $endTime) {
                        $q->where('heure_debut', '<=', $startTime)
                            ->where('heure_fin', '>=', $endTime);
                    });
                });

            if ($roomConflicts->count() == 0) {
                return $room;
            }
        }

        return null;
    }

    private function dispatchEmailJob($soutenanceId): void
    {
        try {
            $soutenance = Soutenance::with([
                'pfe',
                'pfe.group.student1User',
                'pfe.group.student2User',
                'pfe.jury.presidentUser',
                'pfe.jury.examinateurUser',
                'pfe.encadrantUser',
                'pfe.coEncadrantUser',
                'salle'
            ])->find($soutenanceId);

            if ($soutenance) {
                // Dispatch email job to default queue (emails)
                \App\Jobs\SendSoutenanceEmailJob::dispatch($soutenance, 'creation');
            }
        } catch (\Exception $e) {
            Log::error("Failed to dispatch email job for soutenance {$soutenanceId}: " . $e->getMessage());
            // Don't throw here - we don't want email failures to stop soutenance generation
        }
    }

    private function sendCompletionNotification(array $result): void
    {
        try {
            $session = $this->configData['working_hours']['session'];
            $createdCount = $result['created_count'];
            $unassignedCount = $result['unassigned_count'];

            $title = 'Génération des soutenances terminée';

            if ($unassignedCount > 0) {
                $message = "Génération terminée avec succès ! {$createdCount} soutenances créées pour la session {$session}. Attention: {$unassignedCount} PFEs n'ont pas pu être programmés.";
            } else {
                $message = "Génération terminée avec succès ! {$createdCount} soutenances créées pour la session {$session}. Tous les PFEs ont été programmés.";
            }

            $notification = Notification::create([
                'sender_id' => $this->userId, // Use the user ID instead of 'system'
                'receiver_id' => $this->userId,
                'title' => $title,
                'message' => $message,
                'type' => 'SOUTENANCE_GENERATION',
                'status' => 'send',
            ]);

            $notificationForSocket = (object) [
                'id' => $notification->id,
                'sender_id' => $this->userId,
                'receiver_id' => $this->userId,
                'title' => $title,
                'message' => $message,
                'type' => 'SOUTENANCE_GENERATION',
                'status' => 'send',
                'created_at' => $notification->created_at,
            ];

            $formattedNotification = $this->formatNotificationForSocket($notificationForSocket);
            // Emit via SocketService so the URL comes from env and works in Docker and local
            /** @var SocketService $socketService */
            $socketService = app(SocketService::class);
            $socketService->emitNotification($this->userId, $formattedNotification);

            Log::info('Completion notification sent', [
                'user_id' => $this->userId,
                'notification_id' => $notification->id,
                'created_count' => $createdCount,
                'unassigned_count' => $unassignedCount
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send completion notification', [
                'user_id' => $this->userId,
                'error' => $e->getMessage()
            ]);
            // Don't throw - notification failure shouldn't fail the job
        }
    }


    private function sendFailureNotification(string $errorMessage): void
    {
        try {
            $session = $this->configData['working_hours']['session'] ?? 'inconnue';
            $title = 'Erreur lors de la génération des soutenances';
            $message = "La génération des soutenances pour la session {$session} a échoué. Erreur: {$errorMessage}";

            $notification = Notification::create([
                'sender_id' => $this->userId, // Use the user ID instead of 'system'
                'receiver_id' => $this->userId,
                'title' => $title,
                'message' => $message,
                'type' => 'SOUTENANCE_GENERATION',
                'status' => 'unread',
            ]);

            // Format notification for socket like in GroupController
            $notificationForSocket = (object) [
                'id' => $notification->id,
                'sender_id' => $this->userId,
                'receiver_id' => $this->userId,
                'title' => $title,
                'message' => $message,
                'type' => 'SOUTENANCE_GENERATION',
                'status' => 'unread',
                'created_at' => $notification->created_at,
            ];

            $formattedNotification = $this->formatNotificationForSocket($notificationForSocket);
            /** @var SocketService $socketService */
            $socketService = app(SocketService::class);
            $socketService->emitNotification($this->userId, $formattedNotification);

            Log::info('Failure notification sent', [
                'user_id' => $this->userId,
                'notification_id' => $notification->id,
                'error' => $errorMessage
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send failure notification', [
                'user_id' => $this->userId,
                'error' => $e->getMessage()
            ]);
            // Don't throw - notification failure shouldn't fail the job
        }
    }

    // Emission handled by SocketService now

    private function formatNotificationForSocket($notification)
    {
        $user = User::select('id', 'name')->where('id', $notification->sender_id)->first();

        return [
            'id' => $notification->id,
            'sender_id' => $notification->sender_id,
            'receiver_id' => $notification->receiver_id,
            'sender_name' => $user ? $user->name : 'System',
            'receiver_name' => $user ? $user->name : 'System',
            'title' => $notification->title,
            'status' => $notification->status,
            'created_at' => $notification->created_at,
            'formatted_message' => $notification->message,
            'type' => $notification->type,
        ];
    }
}
