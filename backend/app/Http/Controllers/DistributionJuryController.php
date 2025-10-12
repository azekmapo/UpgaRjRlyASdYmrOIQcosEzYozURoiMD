<?php

namespace App\Http\Controllers;

use App\Mail\JuryAssignmentEncadrant;
use App\Mail\JuryAssignmentJury;
use App\Mail\JuryAssignmentStudent;
use App\Models\Enseignant;
use App\Models\Jury;
use App\Models\Pfe;
use App\Models\VoeuxJury;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class DistributionJuryController extends Controller
{
    private $gradeHierarchy = [
        'MAB' => 1,
        'MAA' => 2,
        'MCB' => 3,
        'MCA' => 4,
        'Professeur' => 5
    ];

    private $existingJuries = [];
    private $voeuxData = [];
    private $enseignantsData = [];
    private $emailNotifications = [];

    public function distributeJury()
    {
        try {
            Log::info('Starting jury distribution process');
            DB::beginTransaction();

            // Pre-load all necessary data to avoid N+1 queries
            $this->preloadData();

            // Get all PFEs that need jury assignment with eager loading
            $pfes = Pfe::with([
                'group.student1.user',
                'group.student2.user',
                'encadrant.user',
                'coEncadrant.user'
            ])
                ->whereNull('id_jury')
                ->get();

            Log::info('Found PFEs requiring jury assignment', [
                'total_pfes' => $pfes->count()
            ]);

            $assignedEnseignants = [];
            $unassignedPFEs = collect();
            $successfulAssignments = 0;

            foreach ($pfes as $pfe) {
                Log::info('Processing PFE for jury assignment', [
                    'pfe_id' => $pfe->id,
                    'pfe_title' => $pfe->intitule
                ]);

                $voeuxForPFE = $this->getVoeuxForPFE($pfe);
                if (empty($voeuxForPFE)) {
                    Log::warning('No voeux found for PFE', [
                        'pfe_id' => $pfe->id
                    ]);
                    $unassignedPFEs->push($pfe);
                    continue;
                }

                Log::info('Found voeux for PFE', [
                    'pfe_id' => $pfe->id,
                    'voeux_count' => count($voeuxForPFE)
                ]);

                // Get enseignants who made choices for this PFE
                $enseignants = $this->getEnseignantsWithRanks($voeuxForPFE, $pfe);
                if (empty($enseignants)) {
                    Log::warning('No available enseignants found for PFE', [
                        'pfe_id' => $pfe->id
                    ]);
                    $unassignedPFEs->push($pfe);
                    continue;
                }

                Log::info('Found enseignants for PFE', [
                    'pfe_id' => $pfe->id,
                    'enseignants_count' => count($enseignants),
                    'enseignants' => collect($enseignants)->pluck('nom', 'id')->toArray()
                ]);

                // Sort enseignants by grade and then by timestamp
                $enseignants = $this->sortEnseignants($enseignants, $voeuxForPFE);

                // Try to assign jury members
                $juryMembers = $this->selectJuryMembers($enseignants, $assignedEnseignants);
                if (!$juryMembers) {
                    Log::warning('Could not select jury members for PFE', [
                        'pfe_id' => $pfe->id,
                        'reason' => 'Not enough available enseignants'
                    ]);
                    $unassignedPFEs->push($pfe);
                    continue;
                }

                Log::info('Selected jury members for PFE', [
                    'pfe_id' => $pfe->id,
                    'president' => $juryMembers['president']['nom'],
                    'president_grade' => $juryMembers['president']['grade'],
                    'examinateur' => $juryMembers['examinateur']['nom'],
                    'examinateur_grade' => $juryMembers['examinateur']['grade']
                ]);

                // Create and assign jury
                $this->createAndAssignJury($pfe, $juryMembers['president'], $juryMembers['examinateur']);

                // Update assigned enseignants tracking
                $assignedEnseignants[$juryMembers['president']['id']] = ($assignedEnseignants[$juryMembers['president']['id']] ?? 0) + 1;
                $assignedEnseignants[$juryMembers['examinateur']['id']] = ($assignedEnseignants[$juryMembers['examinateur']['id']] ?? 0) + 1;

                $successfulAssignments++;
                Log::info('Successfully assigned jury to PFE', [
                    'pfe_id' => $pfe->id,
                    'president_assignments' => $assignedEnseignants[$juryMembers['president']['id']],
                    'examinateur_assignments' => $assignedEnseignants[$juryMembers['examinateur']['id']]
                ]);
            }

            Log::info('Completed preference-based jury assignments', [
                'successful_assignments' => $successfulAssignments,
                'unassigned_pfes' => $unassignedPFEs->count()
            ]);

            // Handle unassigned PFEs with random jury assignment
            if ($unassignedPFEs->isNotEmpty()) {
                Log::info('Starting random jury assignment for unassigned PFEs', [
                    'unassigned_count' => $unassignedPFEs->count()
                ]);
                $this->assignRandomJuries($unassignedPFEs, $assignedEnseignants);
            }

            // Send batched email notifications
            $this->sendBatchedNotifications();

            DB::commit();
            Log::info('Jury distribution completed successfully', [
                'total_pfes_processed' => $pfes->count(),
                'preference_based_assignments' => $successfulAssignments,
                'random_assignments' => $pfes->count() - $successfulAssignments
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error during jury distribution: ' . $e->getMessage(), [
                'exception' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    private function preloadData()
    {
        // Initialize email notifications array
        $this->emailNotifications = [
            'jury_members' => [],
            'encadrants' => [],
            'students' => []
        ];

        // Cache existing juries
        $this->cacheExistingJuries();

        // Pre-load all voeux data with enseignant information
        $this->voeuxData = VoeuxJury::with('enseignant.user')
            ->get()
            ->map(function ($voeu) {
                return [
                    'id' => $voeu->id,
                    'id_enseignant' => $voeu->id_enseignant,
                    'ranked_themes' => is_array($voeu->ranked_themes)
                        ? $voeu->ranked_themes
                        : json_decode($voeu->ranked_themes, true),
                    'updated_at' => $voeu->updated_at,
                    'enseignant' => $voeu->enseignant ? [
                        'id' => $voeu->enseignant->id,
                        'nom' => $voeu->enseignant->user->name ?? null,
                        'grade' => $voeu->enseignant->grade,
                        'email' => $voeu->enseignant->user->email ?? null
                    ] : null
                ];
            })
            ->keyBy('id_enseignant')
            ->toArray();

        // Pre-load all enseignants data
        $this->enseignantsData = Enseignant::with('user')
            ->whereNotNull('grade')
            ->whereIn('grade', array_keys($this->gradeHierarchy))
            ->get()
            ->map(function ($enseignant) {
                return [
                    'id' => $enseignant->id,
                    'nom' => $enseignant->user->name ?? null,
                    'grade' => $enseignant->grade,
                    'email' => $enseignant->user->email ?? null
                ];
            })
            ->keyBy('id')
            ->toArray();

        Log::info('Pre-loaded data', [
            'voeux_count' => count($this->voeuxData),
            'enseignants_count' => count($this->enseignantsData)
        ]);
    }

    private function cacheExistingJuries()
    {
        $existingJuriesCount = Jury::count();
        Log::info('Caching existing juries', [
            'existing_juries_count' => $existingJuriesCount
        ]);

        $this->existingJuries = Jury::all()->groupBy(function ($jury) {
            return $this->getJuryKey($jury->id_president, $jury->id_examinateur);
        })->toArray();
    }

    private function getJuryKey($presidentId, $examinateurId)
    {
        $ids = [$presidentId, $examinateurId];
        sort($ids);
        return implode('-', $ids);
    }

    private function findOrCreateJury($president, $examinateur)
    {
        $juryKey = $this->getJuryKey($president['id'], $examinateur['id']);

        if (isset($this->existingJuries[$juryKey])) {
            $existingJury = $this->existingJuries[$juryKey][0];
            Log::info('Reusing existing jury', [
                'jury_id' => $existingJury->id,
                'president' => $president['nom'],
                'examinateur' => $examinateur['nom']
            ]);
            return $existingJury;
        }

        Log::info('Creating new jury', [
            'president' => $president['nom'],
            'president_grade' => $president['grade'],
            'examinateur' => $examinateur['nom'],
            'examinateur_grade' => $examinateur['grade']
        ]);

        $jury = Jury::create([
            'id_president' => $president['id'],
            'id_examinateur' => $examinateur['id']
        ]);

        // Add to cache
        $this->existingJuries[$juryKey] = [$jury];

        Log::info('Successfully created new jury', [
            'jury_id' => $jury->id
        ]);

        return $jury;
    }

    private function createAndAssignJury($pfe, $president, $examinateur)
    {
        $jury = $this->findOrCreateJury($president, $examinateur);

        $pfe->update(['id_jury' => $jury->id]);

        Log::info('Assigned jury to PFE', [
            'pfe_id' => $pfe->id,
            'jury_id' => $jury->id,
            'pfe_title' => $pfe->intitule
        ]);

        // CHANGED: Now collect notification data instead of sending immediately
        $this->collectNotificationData($pfe, $president, $examinateur);
    }

    private function getVoeuxForPFE($pfe)
    {
        $voeuxForPFE = [];

        foreach ($this->voeuxData as $enseignantId => $voeu) {
            if ($voeu['ranked_themes'] && is_array($voeu['ranked_themes'])) {
                foreach ($voeu['ranked_themes'] as $theme) {
                    if (isset($theme['id']) && $theme['id'] == $pfe->id) {
                        $voeuxForPFE[$enseignantId] = $voeu;
                        break;
                    }
                }
            }
        }

        return $voeuxForPFE;
    }

    private function getEnseignantsWithRanks($voeuxForPFE, $pfe)
    {
        $enseignants = [];

        foreach ($voeuxForPFE as $enseignantId => $voeu) {
            if (isset($this->enseignantsData[$enseignantId])) {
                $enseignants[] = $this->enseignantsData[$enseignantId];
            }
        }

        return $enseignants;
    }

    private function sortEnseignants($enseignants, $voeuxForPFE)
    {
        usort($enseignants, function ($a, $b) use ($voeuxForPFE) {
            // First by grade (highest first)
            $gradeA = $this->gradeHierarchy[$a['grade']] ?? 0;
            $gradeB = $this->gradeHierarchy[$b['grade']] ?? 0;

            if ($gradeA !== $gradeB) {
                return $gradeB - $gradeA;  // Higher grade first
            }

            // Then by voeux timestamp (earliest first)
            $timestampA = $voeuxForPFE[$a['id']]['updated_at'] ?? null;
            $timestampB = $voeuxForPFE[$b['id']]['updated_at'] ?? null;

            if ($timestampA && $timestampB) {
                return $timestampA <=> $timestampB;
            }

            return 0;
        });

        return $enseignants;
    }

    private function selectJuryMembers($enseignants, $assignedEnseignants)
    {
        $availableEnseignants = array_filter($enseignants, function ($enseignant) use ($assignedEnseignants) {
            return ($assignedEnseignants[$enseignant['id']] ?? 0) < 3;
        });

        Log::info('Filtering available enseignants', [
            'total_enseignants' => count($enseignants),
            'available_enseignants' => count($availableEnseignants),
            'enseignant_assignments' => array_map(function ($count, $id) use ($enseignants) {
                $enseignant = collect($enseignants)->firstWhere('id', $id);
                return [
                    'name' => $enseignant ? $enseignant['nom'] : 'Unknown',
                    'assignments' => $count
                ];
            }, $assignedEnseignants, array_keys($assignedEnseignants))
        ]);

        if (count($availableEnseignants) < 2) {
            Log::warning('Not enough available enseignants for jury selection', [
                'available_count' => count($availableEnseignants),
                'required_count' => 2
            ]);
            return null;
        }

        $availableEnseignants = array_values($availableEnseignants);  // Re-index array

        return [
            'president' => $availableEnseignants[0],
            'examinateur' => $availableEnseignants[1]
        ];
    }

    private function assignRandomJuries($unassignedPFEs, &$assignedEnseignants)
    {
        $randomAssignments = 0;

        foreach ($unassignedPFEs as $pfe) {
            Log::info('Attempting random jury assignment for PFE', [
                'pfe_id' => $pfe->id,
                'pfe_title' => $pfe->intitule
            ]);

            // First try: get enseignants with less than 3 assignments
            $availableEnseignants = $this->getAvailableEnseignants($assignedEnseignants, false, $pfe);

            // If not enough available, ignore the limit and assign to least-loaded enseignants
            if (count($availableEnseignants) < 2) {
                Log::warning('All enseignants have reached limit, assigning to least-loaded enseignants', [
                    'pfe_id' => $pfe->id,
                    'available_count' => count($availableEnseignants)
                ]);

                $availableEnseignants = $this->getAvailableEnseignants($assignedEnseignants, true, $pfe);

                // If still not enough enseignants (edge case: less than 2 enseignants total)
                if (count($availableEnseignants) < 2) {
                    Log::error('Critical: Not enough enseignants in system for jury assignment', [
                        'pfe_id' => $pfe->id,
                        'total_enseignants' => count($availableEnseignants),
                        'encadrant_id' => $pfe->id_encadrant,
                        'co_encadrant_id' => $pfe->id_coEncadrant
                    ]);
                    continue;
                }
            }

            // Sort by grade (already sorted by assignment count if ignoreLimit was true)
            if (count($availableEnseignants) >= 2) {
                // Re-sort by assignment count and grade for fairness
                usort($availableEnseignants, function ($a, $b) use ($assignedEnseignants) {
                    // First priority: fewer assignments
                    $countA = $assignedEnseignants[$a['id']] ?? 0;
                    $countB = $assignedEnseignants[$b['id']] ?? 0;

                    if ($countA !== $countB) {
                        return $countA - $countB;  // Fewer assignments first
                    }

                    // Second priority: higher grade
                    $gradeA = $this->gradeHierarchy[$a['grade']] ?? 0;
                    $gradeB = $this->gradeHierarchy[$b['grade']] ?? 0;
                    return $gradeB - $gradeA;  // Higher grade first
                });
            }

            $president = $availableEnseignants[0];
            $examinateur = $availableEnseignants[1];

            Log::info('Selected random jury members for PFE', [
                'pfe_id' => $pfe->id,
                'president' => $president['nom'],
                'president_grade' => $president['grade'],
                'president_current_assignments' => $assignedEnseignants[$president['id']] ?? 0,
                'examinateur' => $examinateur['nom'],
                'examinateur_grade' => $examinateur['grade'],
                'examinateur_current_assignments' => $assignedEnseignants[$examinateur['id']] ?? 0
            ]);

            // Create and assign jury
            $this->createAndAssignJury($pfe, $president, $examinateur);

            // Update assigned enseignants tracking
            $assignedEnseignants[$president['id']] = ($assignedEnseignants[$president['id']] ?? 0) + 1;
            $assignedEnseignants[$examinateur['id']] = ($assignedEnseignants[$examinateur['id']] ?? 0) + 1;

            $randomAssignments++;
        }

        Log::info('Completed random jury assignments', [
            'random_assignments' => $randomAssignments,
            'failed_assignments' => $unassignedPFEs->count() - $randomAssignments
        ]);
    }

    private function getAvailableEnseignants($assignedEnseignants, $ignoreLimit = false, $pfe = null)
    {
        // Build exclusion list
        $excludedIds = [];

        // Exclude enseignants who are encadrant or co-encadrant of this PFE
        if ($pfe) {
            if ($pfe->id_encadrant) {
                $excludedIds[] = $pfe->id_encadrant;
            }
            if ($pfe->id_coEncadrant) {
                $excludedIds[] = $pfe->id_coEncadrant;
            }
        }

        // If not ignoring limit, also exclude those with 3+ assignments
        if (!$ignoreLimit) {
            $overloadedIds = array_keys(array_filter($assignedEnseignants, function ($count) {
                return $count >= 3;
            }));
            $excludedIds = array_merge($excludedIds, $overloadedIds);
        }

        // Filter enseignants
        $availableEnseignants = array_filter($this->enseignantsData, function ($enseignant) use ($excludedIds) {
            return !in_array($enseignant['id'], $excludedIds);
        });

        // If ignoring limit, sort by assignment count then grade
        if ($ignoreLimit) {
            usort($availableEnseignants, function ($a, $b) use ($assignedEnseignants) {
                $countA = $assignedEnseignants[$a['id']] ?? 0;
                $countB = $assignedEnseignants[$b['id']] ?? 0;

                if ($countA !== $countB) {
                    return $countA - $countB;  // Fewer assignments first
                }

                // Tie-breaker: higher grade first
                $gradeA = $this->gradeHierarchy[$a['grade']] ?? 0;
                $gradeB = $this->gradeHierarchy[$b['grade']] ?? 0;
                return $gradeB - $gradeA;
            });
        }

        return $availableEnseignants;
    }

    // NEW: Collect notification data instead of sending immediately
    private function collectNotificationData($pfe, $president, $examinateur)
    {
        // Collect data for jury members
        if (!isset($this->emailNotifications['jury_members'][$president['id']])) {
            $this->emailNotifications['jury_members'][$president['id']] = [
                'member' => $president,
                'is_president' => true,
                'pfes' => collect()
            ];
        }
        $this->emailNotifications['jury_members'][$president['id']]['pfes']->push($pfe);

        if (!isset($this->emailNotifications['jury_members'][$examinateur['id']])) {
            $this->emailNotifications['jury_members'][$examinateur['id']] = [
                'member' => $examinateur,
                'is_president' => false,
                'pfes' => collect()
            ];
        }
        $this->emailNotifications['jury_members'][$examinateur['id']]['pfes']->push($pfe);

        // Collect data for encadrants
        if ($pfe->encadrant) {
            $encadrantId = $pfe->encadrant->id;
            if (!isset($this->emailNotifications['encadrants'][$encadrantId])) {
                $this->emailNotifications['encadrants'][$encadrantId] = [
                    'encadrant' => $pfe->encadrant,
                    'pfes' => collect()
                ];
            }
            $this->emailNotifications['encadrants'][$encadrantId]['pfes']->push($pfe);
        }

        if ($pfe->coEncadrant) {
            $coEncadrantId = $pfe->coEncadrant->id;
            if (!isset($this->emailNotifications['encadrants'][$coEncadrantId])) {
                $this->emailNotifications['encadrants'][$coEncadrantId] = [
                    'encadrant' => $pfe->coEncadrant,
                    'pfes' => collect()
                ];
            }
            $this->emailNotifications['encadrants'][$coEncadrantId]['pfes']->push($pfe);
        }

        // Collect data for students (students get individual emails per PFE)
        $this->emailNotifications['students'][] = [
            'pfe' => $pfe,
            'president' => $president,
            'examinateur' => $examinateur
        ];

        Log::info('Collected notification data for PFE', [
            'pfe_id' => $pfe->id,
            'president_id' => $president['id'],
            'examinateur_id' => $examinateur['id']
        ]);
    }

    // NEW: Send batched notifications
    private function sendBatchedNotifications()
    {
        try {
            Log::info('Starting batched notification process', [
                'jury_members_count' => count($this->emailNotifications['jury_members']),
                'encadrants_count' => count($this->emailNotifications['encadrants']),
                'students_count' => count($this->emailNotifications['students'])
            ]);

            $totalEmailsSent = 0;

            // Send batched emails to jury members
            foreach ($this->emailNotifications['jury_members'] as $memberId => $data) {
                if ($data['member']['email']) {
                    // Convert array data back to object for email compatibility
                    $memberObj = (object) $data['member'];

                    Log::info('Sending batched jury assignment notification', [
                        'member_id' => $memberId,
                        'member_name' => $data['member']['nom'],
                        'is_president' => $data['is_president'],
                        'pfe_count' => $data['pfes']->count(),
                        'pfe_ids' => $data['pfes']->pluck('id')->toArray()
                    ]);

                    Mail::to($data['member']['email'])
                        ->send(new JuryAssignmentJury($data['pfes'], $memberObj, $data['is_president']));
                    $totalEmailsSent++;
                }
            }

            // Send batched emails to encadrants
            foreach ($this->emailNotifications['encadrants'] as $encadrantId => $data) {
                if ($data['encadrant']->user?->email) {
                    Log::info('Sending batched encadrant assignment notification', [
                        'encadrant_id' => $encadrantId,
                        'encadrant_name' => $data['encadrant']->user->name,
                        'pfe_count' => $data['pfes']->count(),
                        'pfe_ids' => $data['pfes']->pluck('id')->toArray()
                    ]);

                    Mail::to($data['encadrant']->user->email)
                        ->send(new JuryAssignmentEncadrant($data['pfes'], $data['encadrant']));
                    $totalEmailsSent++;
                }
            }

            // Send individual emails to students
            foreach ($this->emailNotifications['students'] as $studentData) {
                $pfe = $studentData['pfe'];
                $president = (object) $studentData['president'];
                $examinateur = (object) $studentData['examinateur'];

                // Notify students (data already loaded via eager loading)
                if ($pfe->group) {
                    if ($pfe->group->student1?->user) {
                        Log::info('Sending jury assignment notification to student 1', [
                            'pfe_id' => $pfe->id,
                            'student_email' => $pfe->group->student1->user->email,
                            'student_name' => $pfe->group->student1->user->name
                        ]);
                        Mail::to($pfe->group->student1->user->email)
                            ->send(new JuryAssignmentStudent($pfe, $president, $examinateur, $pfe->group->student1->user));
                        $totalEmailsSent++;
                    }

                    if ($pfe->group->student2?->user) {
                        Log::info('Sending jury assignment notification to student 2', [
                            'pfe_id' => $pfe->id,
                            'student_email' => $pfe->group->student2->user->email,
                            'student_name' => $pfe->group->student2->user->name
                        ]);
                        Mail::to($pfe->group->student2->user->email)
                            ->send(new JuryAssignmentStudent($pfe, $president, $examinateur, $pfe->group->student2->user));
                        $totalEmailsSent++;
                    }
                }
            }

            Log::info('Successfully sent all batched notifications', [
                'total_emails_sent' => $totalEmailsSent,
                'jury_member_emails' => count($this->emailNotifications['jury_members']),
                'encadrant_emails' => count($this->emailNotifications['encadrants']),
                'student_emails' => count($this->emailNotifications['students']) * 2  // Assuming 2 students per group on average
            ]);
        } catch (\Exception $e) {
            Log::error('Error sending batched jury assignment notifications', [
                'error' => $e->getMessage(),
                'exception' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
}
