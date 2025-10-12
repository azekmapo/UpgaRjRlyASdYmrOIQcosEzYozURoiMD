<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateSoutenancesJob;
use App\Jobs\SendSoutenanceEmailJob;
use App\Mail\SoutenanceEmail; // Use the JOB class, not the MAIL class
use App\Models\Enseignant;
use App\Models\Etudiant;
use App\Models\Jury;
use App\Models\Periode;
use App\Models\Pfe;
use App\Models\Salle;
use App\Models\Soutenance;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SoutenanceController extends Controller
{
    // Constantes pour les durées fixes
    const DEFAULT_DEFENSE_DURATION = 60; // 60 minutes
    const DEFAULT_BREAK_DURATION = 60; // 60 minutes

    public function index()
    {
        try {
            $soutenances = Soutenance::with([
                'pfe',
                'pfe.group.student1User:id,name',
                'pfe.group.student2User:id,name',
                'pfe.jury.presidentUser:id,name',
                'pfe.jury.examinateurUser:id,name',
                'pfe.encadrantUser:id,name',
                'pfe.coEncadrantUser:id,name',
                'salle:id,nom_salle'
            ])->get();

            $salles = Salle::all();

            $soutenances = $soutenances->map(function ($soutenance) {
                if ($soutenance->pfe) {
                    $soutenance->pfe_title = $soutenance->pfe->intitule;
                    $soutenance->room_name = $soutenance->salle ? $soutenance->salle->nom_salle : null;
                    $group = $soutenance->pfe->group;
                    if ($group) {
                        $students = [];
                        if ($group->student1User) {
                            $students[] = $group->student1User->name;
                        }
                        if ($group->student2User) {
                            $students[] = $group->student2User->name;
                        }
                        $soutenance->students = $students;
                    }
                    if ($soutenance->pfe->jury) {
                        $jury = $soutenance->pfe->jury;
                        $soutenance->jury_members = [
                            'president' => $jury->presidentUser ? $jury->presidentUser->name : null,
                            'examinateur' => $jury->examinateurUser ? $jury->examinateurUser->name : null,
                        ];
                    }
                    // Ajouter les informations d'encadrement
                    $soutenance->encadrement = [
                        'encadrant' => $soutenance->pfe->encadrantUser ? $soutenance->pfe->encadrantUser->name : null,
                        'co_encadrant' => $soutenance->pfe->coEncadrantUser ? $soutenance->pfe->coEncadrantUser->name : null,
                    ];
                }
                return $soutenance;
            });

            $periodeSoutenances = Periode::where('titre', 'Soutenances : Session 1')->first();
            $startDate = $periodeSoutenances ? $periodeSoutenances->date_debut : null;

            return response()->json([
                'success' => true,
                'data' => [
                    'soutenances' => $soutenances,
                    'salles' => $salles,
                    'startDate' => $startDate,
                    // Ajouter les durées fixes dans la réponse pour information
                    'workingHours' => [
                        'start_time' => '08:00', // Valeurs par défaut
                        'end_time' => '16:00',
                        'defense_duration' => self::DEFAULT_DEFENSE_DURATION,
                        'break_duration' => self::DEFAULT_BREAK_DURATION,
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching soutenances',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function isHoliday($date)
    {
        $dateObj = Carbon::parse($date);
        $month = $dateObj->month;
        $day = $dateObj->day;

        // Jours fériés fixes
        $holidays = [
            ['month' => 1, 'day' => 1], // 1er janvier
            ['month' => 1, 'day' => 12], // 12 janvier
            ['month' => 5, 'day' => 1], // 1er mai
            ['month' => 7, 'day' => 5], // 5 juillet
            ['month' => 11, 'day' => 1], // 1er novembre
        ];

        foreach ($holidays as $holiday) {
            if ($month === $holiday['month'] && $day === $holiday['day']) {
                return true;
            }
        }
        return false;
    }

    private function hasTimeConflict($pfe, $date, $startTime, $endTime, $excludeSoutenanceId = null)
    {
        // Use pre-loaded data instead of database queries
        // This assumes $this->existingSoutenances and $this->plannedSoutenances are set
        if (!isset($this->existingSoutenances)) {
            // Fallback to database query if not pre-loaded (for backward compatibility)
            $existingSoutenances = Soutenance::whereDate('date', $date)
                ->where(function ($query) use ($startTime, $endTime) {
                    $query
                        ->whereBetween('heure_debut', [$startTime, $endTime])
                        ->orWhereBetween('heure_fin', [$startTime, $endTime])
                        ->orWhere(function ($q) use ($startTime, $endTime) {
                            $q
                                ->where('heure_debut', '<=', $startTime)
                                ->where('heure_fin', '>=', $endTime);
                        });
                })
                ->with(['pfe.jury', 'pfe.encadrant', 'pfe.coEncadrant', 'pfe.group'])
                ->get();
        } else {
            // Use pre-loaded data
            $dateSoutenances = $this->existingSoutenances->get($date, collect());
            $existingSoutenances = $dateSoutenances->flatten();

            // Add planned soutenances for this date
            if (isset($this->plannedSoutenances)) {
                $plannedForDate = collect($this->plannedSoutenances)->where('date', $date);
                // Convert planned soutenances to objects for consistency
                foreach ($plannedForDate as $planned) {
                    if ($this->hasTimeOverlap($startTime, $endTime, $planned['heure_debut'], $planned['heure_fin'])) {
                        // Find the PFE for conflict checking
                        $plannedPfe = $this->pfes->where('id', $planned['id_pfe'])->first();
                        if ($plannedPfe && $this->hasPersonConflict($pfe, $plannedPfe)) {
                            return true;
                        }
                    }
                }
            }
        }

        // Apply exclusion filter if needed
        if ($excludeSoutenanceId) {
            $existingSoutenances = $existingSoutenances->where('id', '!=', $excludeSoutenanceId);
        }

        // Get current PFE's involved people
        $currentSupervisors = array_filter([$pfe->id_encadrant, $pfe->id_co_encadrant]);
        $currentJuryMembers = [];
        if ($pfe->jury) {
            $currentJuryMembers = array_filter([$pfe->jury->id_president, $pfe->jury->id_examinateur]);
        }

        foreach ($existingSoutenances as $existingSoutenance) {
            // Check time overlap first
            if (!$this->hasTimeOverlap($startTime, $endTime, $existingSoutenance->heure_debut, $existingSoutenance->heure_fin)) {
                continue;
            }

            $existingPfe = $existingSoutenance->pfe;

            // Get existing PFE's involved people
            $existingSupervisors = array_filter([$existingPfe->id_encadrant, $existingPfe->id_co_encadrant]);
            $existingJuryMembers = [];
            if ($existingPfe->jury) {
                $existingJuryMembers = array_filter([$existingPfe->jury->id_president, $existingPfe->jury->id_examinateur]);
            }

            // Check all possible conflicts
            if ($this->hasPersonConflict($pfe, $existingPfe)) {
                return true;
            }
        }
        return false;
    }

    private function hasTimeOverlap($start1, $end1, $start2, $end2)
    {
        return ($start1 < $end2) && ($end1 > $start2);
    }

    private function hasPersonConflict($pfe1, $pfe2)
    {
        // Get PFE1's involved people
        $pfe1Supervisors = array_filter([$pfe1->id_encadrant, $pfe1->id_co_encadrant]);
        $pfe1JuryMembers = [];
        if ($pfe1->jury) {
            $pfe1JuryMembers = array_filter([$pfe1->jury->id_president, $pfe1->jury->id_examinateur]);
        }

        // Get PFE2's involved people
        $pfe2Supervisors = array_filter([$pfe2->id_encadrant, $pfe2->id_co_encadrant]);
        $pfe2JuryMembers = [];
        if ($pfe2->jury) {
            $pfe2JuryMembers = array_filter([$pfe2->jury->id_president, $pfe2->jury->id_examinateur]);
        }

        // Check all possible conflicts
        return (
            // Direct supervisor conflicts
            array_intersect($pfe1Supervisors, $pfe2Supervisors) ||
            // Direct jury conflicts
            array_intersect($pfe1JuryMembers, $pfe2JuryMembers) ||
            // Cross conflicts: supervisor vs jury
            array_intersect($pfe1Supervisors, $pfe2JuryMembers) ||
            array_intersect($pfe2Supervisors, $pfe1JuryMembers)
        );
    }

    private function findAvailableRoom($rooms, $date, $startTime, $endTime, $excludeSoutenanceId = null)
    {
        // Use pre-loaded data if available
        if (isset($this->allRooms) && isset($this->existingSoutenances)) {
            // Use pre-loaded optimized approach
            foreach ($rooms as $roomData) {
                $room = $this->allRooms->get($roomData['name']);
                if (!$room) {
                    continue;
                }
                $isAvailable = true;
                // Check against existing soutenances
                $dateSoutenances = $this->existingSoutenances->get($date, collect());
                $roomSoutenances = $dateSoutenances->get($room->id, collect());
                foreach ($roomSoutenances as $soutenance) {
                    if ($excludeSoutenanceId && $soutenance->id == $excludeSoutenanceId) {
                        continue;
                    }
                    if ($this->hasTimeOverlap($startTime, $endTime, $soutenance->heure_debut, $soutenance->heure_fin)) {
                        $isAvailable = false;
                        break;
                    }
                }
                // Check against planned soutenances for this session
                if ($isAvailable && isset($this->plannedSoutenances)) {
                    foreach ($this->plannedSoutenances as $plannedSoutenance) {
                        if (
                            $plannedSoutenance['date'] == $date &&
                            $plannedSoutenance['id_salle'] == $room->id &&
                            $this->hasTimeOverlap($startTime, $endTime, $plannedSoutenance['heure_debut'], $plannedSoutenance['heure_fin'])
                        ) {
                            $isAvailable = false;
                            break;
                        }
                    }
                }
                if ($isAvailable) {
                    return $room;
                }
            }
        } else {
            // Fallback to original caching approach for backward compatibility
            static $roomsCache = [];

            // Get all room names
            $roomNames = collect($rooms)->pluck('name')->unique();

            // Cache rooms if not already cached
            if (empty($roomsCache)) {
                $roomsCache = Salle::whereIn('nom_salle', $roomNames)->get()->keyBy('nom_salle');
            }

            // Check each room for availability
            foreach ($rooms as $roomData) {
                $room = $roomsCache->get($roomData['name']);
                if (!$room) {
                    continue;
                }

                // CORRECTION : Vérifier directement les conflits de salle pour cette date et heure
                $roomConflicts = Soutenance::where('id_salle', $room->id)
                    ->whereDate('date', $date)
                    ->where(function ($query) use ($startTime, $endTime) {
                        $query->where(function ($q) use ($startTime, $endTime) {
                            // Cas 1 : La nouvelle soutenance commence pendant une soutenance existante
                            $q->where('heure_debut', '<=', $startTime)
                                ->where('heure_fin', '>', $startTime);
                        })->orWhere(function ($q) use ($startTime, $endTime) {
                            // Cas 2 : La nouvelle soutenance finit pendant une soutenance existante
                            $q->where('heure_debut', '<', $endTime)
                                ->where('heure_fin', '>=', $endTime);
                        })->orWhere(function ($q) use ($startTime, $endTime) {
                            // Cas 3 : La nouvelle soutenance englobe complètement une soutenance existante
                            $q->where('heure_debut', '>=', $startTime)
                                ->where('heure_fin', '<=', $endTime);
                        })->orWhere(function ($q) use ($startTime, $endTime) {
                            // Cas 4 : Une soutenance existante englobe complètement la nouvelle
                            $q->where('heure_debut', '<=', $startTime)
                                ->where('heure_fin', '>=', $endTime);
                        });
                    });

                // Exclure la soutenance actuelle si on fait une modification
                if ($excludeSoutenanceId) {
                    $roomConflicts->where('id', '!=', $excludeSoutenanceId);
                }

                // Si aucun conflit, cette salle est disponible
                if ($roomConflicts->count() == 0) {
                    return $room;
                }
            }
        }
        return null;
    }

    private function findBestTimeSlot($pfe, $date, $workingHours, $rooms, $excludeSoutenanceId = null)
    {
        $startTime = Carbon::createFromFormat('H:i', $workingHours['start_time']);
        $endTime = Carbon::createFromFormat('H:i', $workingHours['end_time']);
        $defenseDuration = self::DEFAULT_DEFENSE_DURATION;
        $breakDuration = self::DEFAULT_BREAK_DURATION;

        $timeSlot = $startTime->copy();

        while ($timeSlot->copy()->addMinutes($defenseDuration)->lessThanOrEqualTo($endTime)) {
            $defenseEnd = $timeSlot->copy()->addMinutes($defenseDuration);

            // Vérifier les conflits de temps
            if (!$this->hasTimeConflict($pfe, $date, $timeSlot->toTimeString(), $defenseEnd->toTimeString(), $excludeSoutenanceId)) {
                // Chercher une salle disponible
                $availableRoom = $this->findAvailableRoom(
                    $rooms,
                    $date,
                    $timeSlot->toTimeString(),
                    $defenseEnd->toTimeString(),
                    $excludeSoutenanceId
                );

                if ($availableRoom) {
                    return [
                        'start_time' => $timeSlot->toTimeString(),
                        'end_time' => $defenseEnd->toTimeString(),
                        'room' => $availableRoom
                    ];
                }
            }
            $timeSlot->addMinutes($breakDuration);
        }
        return null;
    }

    public function store(Request $request)
    {
        try {
            // Validate the request
            $validated = $request->validate([
                'working_hours' => 'required|array',
                'working_hours.session' => 'required|in:1,2',
                'working_hours.start_time' => 'required|date_format:H:i|before:working_hours.end_time',
                'working_hours.end_time' => 'required|date_format:H:i',
                'rooms' => 'required|array',
                'rooms.*.name' => 'required|string|max:255',
                'excluded_dates' => 'nullable|array',
                'excluded_dates.*' => 'date_format:Y-m-d',
            ]);

            // Quick validation checks before dispatching job
            $session = $validated['working_hours']['session'];
            $periodeTitle = 'Soutenances : Session ' . $session;
            $sessionLabel = 'session ' . $session;

            $periodeSoutenances = Periode::where('titre', $periodeTitle)->first();
            if (!$periodeSoutenances) {
                return response()->json([
                    'success' => false,
                    'message' => 'Période des soutenances introuvable.'
                ], 404);
            }

            $startDate = Carbon::parse($periodeSoutenances->date_debut);
            $endDate = Carbon::parse($periodeSoutenances->date_fin);

            if ($startDate->greaterThanOrEqualTo($endDate)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La date de début doit être avant la date de fin.'
                ], 400);
            }

            // Check if there are PFEs to schedule
            $pfes = Pfe::where('session', $sessionLabel)
                ->whereNotNull('id_jury')
                ->get();

            if ($pfes->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun PFE trouvé pour cette session',
                    'no_pfe' => true
                ], 404);
            }

            \App\Jobs\GenerateSoutenancesJob::dispatch($validated, auth()->id());

            Log::info('Soutenance generation job dispatched', [
                'user_id' => auth()->id(),
                'session' => $session,
                'pfe_count' => $pfes->count(),
                'room_count' => count($validated['rooms']),
                'excluded_dates_count' => count($validated['excluded_dates'] ?? [])
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Génération des soutenances démarrée. Vous recevrez une notification une fois terminé.',
                'job_dispatched' => true,
                'pfe_count' => $pfes->count(),
                'estimated_duration' => 'quelques minutes'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating soutenances',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Modifier une soutenance (changement de jour avec drag and drop)
     */
    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'new_date' => 'required|date',
                'working_hours' => 'required|array',
                'working_hours.start_time' => 'required|date_format:H:i',
                'working_hours.end_time' => 'required|date_format:H:i',
                'rooms' => 'required|array',
                'rooms.*.name' => 'required|string',
                // 'excluded_dates' => 'nullable|array', // Removed validation for excluded_dates
                // 'excluded_dates.*' => 'date_format:Y-m-d', // Removed validation for excluded_dates
            ]);

            $soutenance = Soutenance::with([
                'pfe',
                'pfe.jury',
                'pfe.group.student1User',
                'pfe.group.student2User',
                'pfe.jury.presidentUser',
                'pfe.jury.examinateurUser',
                'pfe.encadrantUser',
                'pfe.coEncadrantUser',
                'salle'
            ])->findOrFail($id);

            $newDate = $validated['new_date'];
            $dateObj = Carbon::parse($newDate);
            // $excludedDates = collect($validated['excluded_dates'] ?? []); // Removed fetching excluded dates

            // Vérifier que ce n'est pas un vendredi
            if ($dateObj->isFriday()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Les soutenances ne peuvent pas avoir lieu le vendredi.'
                ], 400);
            }

            // Vérifier que ce n'est pas un jour férié
            if ($this->isHoliday($newDate)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Les soutenances ne peuvent pas avoir lieu durant les jours fériés (1er janvier, 12 janvier, 1er mai, 5 juillet, 1er novembre).'
                ], 400);
            }

            // Removed: Vérifier que ce n'est pas un jour exclu par l'administrateur
            // if ($excludedDates->contains($dateObj->toDateString())) {
            //     return response()->json([
            //         'success' => false,
            //         'message' => 'La date sélectionnée est un jour exclu de la planification par l\'administrateur.'
            //     ], 400);
            // }

            // Vérifier que la date est dans la période autorisée
            $session = explode(' ', $soutenance->session)[1] ?? '1';
            $periodeTitle = 'Soutenances : Session ' . $session;
            $periodeSoutenances = Periode::where('titre', $periodeTitle)->first();

            if ($periodeSoutenances) {
                $startDate = Carbon::parse($periodeSoutenances->date_debut);
                $endDate = Carbon::parse($periodeSoutenances->date_fin);

                if ($dateObj->lt($startDate) || $dateObj->gt($endDate)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'La date doit être dans la période des soutenances.'
                    ], 400);
                }
            }

            // Chercher le meilleur créneau pour cette nouvelle date
            $bestSlot = $this->findBestTimeSlot(
                $soutenance->pfe,
                $newDate,
                $validated['working_hours'],
                $validated['rooms'],
                $soutenance->id
            );

            if (!$bestSlot) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun créneau disponible trouvé pour cette date.'
                ], 400);
            }

            // Mettre à jour la soutenance
            $soutenance->update([
                'date' => $newDate,
                'heure_debut' => $bestSlot['start_time'],
                'heure_fin' => $bestSlot['end_time'],
                'id_salle' => $bestSlot['room']->id,
            ]);

            // Recharger avec les relations
            $soutenance->load(['salle']);

            // Envoyer les emails de modification
            try {
                $this->sendSoutenanceEmails($soutenance, 'modification');
            } catch (\Exception $e) {
                Log::error("Erreur lors de l'envoi des emails de modification pour la soutenance {$id}: " . $e->getMessage());
            }

            Log::info("Soutenance {$id} déplacée vers {$newDate} à {$bestSlot['start_time']}");

            return response()->json([
                'success' => true,
                'message' => 'Soutenance modifiée avec succès.',
                'data' => [
                    'id' => $soutenance->id,
                    'date' => $soutenance->date,
                    'heure_debut' => $soutenance->heure_debut,
                    'heure_fin' => $soutenance->heure_fin,
                    'salle' => $soutenance->salle,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error("Erreur lors de la modification de la soutenance {$id}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification de la soutenance.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Modifier l'heure d'une soutenance dans le même jour
     */
    public function updateTime(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'time' => 'required|date_format:H:i',
                'working_hours' => 'required|array',
                'working_hours.start_time' => 'required|date_format:H:i',
                'working_hours.end_time' => 'required|date_format:H:i',
                'rooms' => 'required|array',
                'rooms.*.name' => 'required|string',
                // 'excluded_dates' => 'nullable|array', // Removed validation for excluded_dates
                // 'excluded_dates.*' => 'date_format:Y-m-d', // Removed validation for excluded_dates
            ]);

            $soutenance = Soutenance::with([
                'pfe',
                'pfe.jury',
                'pfe.group.student1User',
                'pfe.group.student2User',
                'pfe.jury.presidentUser',
                'pfe.jury.examinateurUser',
                'pfe.encadrantUser',
                'pfe.coEncadrantUser',
                'salle'
            ])->findOrFail($id);

            $newStartTime = $validated['time'];
            $currentDate = Carbon::parse($soutenance->date); // Get the current soutenance date
            // $excludedDates = collect($validated['excluded_dates'] ?? []); // Removed fetching excluded dates

            // Removed: Check if the current soutenance date is an excluded date
            // if ($excludedDates->contains($currentDate->toDateString())) {
            //     return response()->json([
            //         'success' => false,
            //         'message' => 'Impossible de modifier l\'heure: la date de cette soutenance est un jour exclu de la planification.'
            //     ], 400);
            // }

            // Calculer l'heure de fin
            $startTime = Carbon::createFromFormat('H:i', $newStartTime);
            $endTime = $startTime->copy()->addMinutes(self::DEFAULT_DEFENSE_DURATION);

            // Vérifier que l'heure est dans les heures de travail
            $workStart = Carbon::createFromFormat('H:i', $validated['working_hours']['start_time']);
            $workEnd = Carbon::createFromFormat('H:i', $validated['working_hours']['end_time']);

            if ($startTime->lt($workStart) || $endTime->gt($workEnd)) {
                return response()->json([
                    'success' => false,
                    'message' => "L'heure doit être dans les heures de travail."
                ], 400);
            }

            // Vérifier les conflits
            if ($this->hasTimeConflict(
                $soutenance->pfe,
                $soutenance->date,
                $newStartTime,
                $endTime->toTimeString(),
                $soutenance->id
            )) {
                return response()->json([
                    'success' => false,
                    'message' => 'Conflit détecté avec une autre soutenance ou un membre du jury/encadrant.'
                ], 400);
            }

            // Chercher une salle disponible
            $availableRoom = $this->findAvailableRoom(
                $validated['rooms'],
                $soutenance->date,
                $newStartTime,
                $endTime->toTimeString(),
                $soutenance->id
            );

            if (!$availableRoom) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune salle disponible pour ce créneau.'
                ], 400);
            }

            // Mettre à jour la soutenance
            $soutenance->update([
                'heure_debut' => $newStartTime,
                'heure_fin' => $endTime->toTimeString(),
                'id_salle' => $availableRoom->id,
            ]);

            // Recharger avec les relations
            $soutenance->load(['salle']);

            // Envoyer les emails de modification
            try {
                $this->sendSoutenanceEmails($soutenance, 'modification');
            } catch (\Exception $e) {
                Log::error("Erreur lors de l'envoi des emails de modification pour la soutenance {$id}: " . $e->getMessage());
            }

            Log::info("Heure de la soutenance {$id} modifiée vers {$newStartTime}");

            return response()->json([
                'success' => true,
                'message' => 'Heure de la soutenance modifiée avec succès.',
                'data' => [
                    'id' => $soutenance->id,
                    'heure_debut' => $soutenance->heure_debut,
                    'heure_fin' => $soutenance->heure_fin,
                    'salle' => $soutenance->salle,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error("Erreur lors de la modification de l'heure de la soutenance {$id}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => "Erreur lors de la modification de l'heure.",
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer une soutenance
     */
    public function destroy($id)
    {
        try {
            $soutenance = Soutenance::findOrFail($id);
            Log::info("Suppression de la soutenance {$id}");
            $soutenance->delete();

            return response()->json([
                'success' => true,
                'message' => 'Soutenance supprimée avec succès.'
            ]);
        } catch (\Exception $e) {
            Log::error("Erreur lors de la suppression de la soutenance {$id}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la soutenance.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Ajouter une méthode pour obtenir les durées par défaut
    public function getDefaultDurations()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'defense_duration' => self::DEFAULT_DEFENSE_DURATION,
                'break_duration' => self::DEFAULT_BREAK_DURATION
            ]
        ]);
    }

    public function getGenerationStatus()
    {
        try {
            $recentSoutenances = Soutenance::where('created_at', '>=', now()->subMinutes(10))->count();

            return response()->json([
                'success' => true,
                'recent_soutenances' => $recentSoutenances,
                'message' => $recentSoutenances > 0 ? 'Génération récente détectée' : 'Aucune génération récente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification du statut',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function sendSoutenanceEmails($soutenance, $type = 'creation')
    {
        // Use the JOB class, not the MAIL class
        SendSoutenanceEmailJob::dispatch($soutenance, $type);
        return ['success' => true];
    }
}
