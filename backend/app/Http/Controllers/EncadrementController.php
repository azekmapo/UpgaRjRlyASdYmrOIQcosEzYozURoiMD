<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Enseignant;
use App\Models\Pfe;
use App\Models\PropositionEtudiant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EncadrementController extends Controller
{
    /**
     * Get all encadrement data for the authenticated teacher
     */
    public function index(): JsonResponse
{
    try {
        $enseignant = Enseignant::find(auth()->id());

        if (!$enseignant) {
            return response()->json([
                'message' => 'Enseignant not found'
            ], 404);
        }
        // Get accepted student propositions
        $studentPropositions = PropositionEtudiant::where('status', 'accepted')
            ->with('group')
            ->get()
            ->map(function ($theme) {
                return array_merge($theme->toArray(), [
                    'type' => 'proposition',
                    'isNeedingCoEncadrant' => false,
                    'moyenne_group' => $theme->group ? $theme->group->moyenne : null,
                    'type_sujet' => $theme->type_sujet ?? 'classique'
                ]);
            });

        // Get stages without encadrants (exclude teacher-originated ones)
        $stagesWithoutEncadrant = Pfe::where('type_sujet', 'stage')
            ->whereNull('id_encadrant')
            ->where(function ($query) {
                $query->whereNull('origine_proposition')
                      ->orWhere('origine_proposition', '!=', 'enseignant');
            })
            ->with([
                'group',
                'entreprise' => function ($query) {
                    $query->select('id', 'name');
                }
            ])
            ->get()
            ->map(function ($pfe) {
                return array_merge($pfe->toArray(), [
                    'type' => 'pfe',
                    'isNeedingCoEncadrant' => false,
                    'moyenne_group' => $pfe->group ? $pfe->group->moyenne : null,
                    'entreprise_name' => optional($pfe->entreprise)->name
                ]);
            });

        // Combine both collections of available themes
        $availableThemes = $studentPropositions->concat($stagesWithoutEncadrant);

        // Get PFEs needing co-encadrants (exclude teacher-originated ones)
        $pfesWithoutCoEncadrant = Pfe::whereNotNull('id_encadrant')
            ->whereNull('id_co_encadrant')
            ->where('id_encadrant', '!=', $enseignant->id)
            ->where(function ($query) {
                $query->whereNull('origine_proposition')
                      ->orWhere('origine_proposition', '!=', 'enseignant');
            })
            ->with([
                'encadrant.user',
                'group',
                'entreprise' => function ($query) {
                    $query->select('id', 'name');
                }
            ])
            ->get()
            ->map(function ($pfe) {
                return array_merge($pfe->toArray(), [
                    'type' => 'pfe',
                    'encadrant_name' => $pfe->encadrant ? $pfe->encadrant->user->name : null,
                    'entreprise_name' => $pfe->type_sujet === 'stage' ? optional($pfe->entreprise)->name : null,
                    'isNeedingCoEncadrant' => true,
                    'moyenne_group' => $pfe->group ? $pfe->group->moyenne : null
                ]);
            });

        // Get PFEs where current enseignant is the encadrant
        $encadrantPFEs = Pfe::where('id_encadrant', $enseignant->id)
            ->with([
                'encadrant.user',
                'coEncadrant.user',
                'group',
                'entreprise' => function ($query) {
                    $query->select('id', 'name');
                }
            ])
            ->get()
            ->map(function ($pfe) {
                $isRemovable = $pfe->origine_proposition !== 'enseignant';

                return array_merge($pfe->toArray(), [
                    'type' => 'pfe',
                    'encadrant_name' => $pfe->encadrant->user->name,
                    'co_encadrant_name' => $pfe->coEncadrant ? $pfe->coEncadrant->user->name : null,
                    'entreprise_name' => $pfe->type_sujet === 'stage' ? optional($pfe->entreprise)->name : null,
                    'moyenne_group' => $pfe->group ? $pfe->group->moyenne : null,
                    'isNeedingCoEncadrant' => $pfe->id_co_encadrant === null,
                    'isRemovable' => $isRemovable,
                    'role' => 'encadrant',
                    'originalList' => 'current'
                ]);
            });

        // Get PFEs where current enseignant is the co-encadrant
        $coEncadrantPFEs = Pfe::where('id_co_encadrant', $enseignant->id)
            ->with([
                'encadrant.user',
                'coEncadrant.user',
                'group',
                'entreprise' => function ($query) {
                    $query->select('id', 'name');
                }
            ])
            ->get()
            ->map(function ($pfe) {
                return array_merge($pfe->toArray(), [
                    'type' => 'pfe',
                    'encadrant_name' => $pfe->encadrant->user->name,
                    'co_encadrant_name' => $pfe->coEncadrant ? $pfe->coEncadrant->user->name : null,
                    'entreprise_name' => $pfe->type_sujet === 'stage' ? optional($pfe->entreprise)->name : null,
                    'moyenne_group' => $pfe->group ? $pfe->group->moyenne : null,
                    'role' => 'co_encadrant',
                    'originalList' => 'co'
                ]);
            });
        return response()->json([
            'availableThemes' => $availableThemes,
            'pfesForCoEncadrement' => $pfesWithoutCoEncadrant,
            'currentEncadrements' => $encadrantPFEs,
            'coEncadrements' => $coEncadrantPFEs,
            'enseignant' => $enseignant
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'An error occurred while fetching encadrement data',
            'error' => $e->getMessage()
        ], 500);
    }
}

    /**
     * Submit teacher's choices for encadrement
     */
    public function submitChoices(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'ranked_themes' => 'present|array',
                'ranked_themes.*.id' => 'required_with:ranked_themes.*', // Removed integer constraint
                'ranked_themes.*.type' => 'required_with:ranked_themes.*|string|in:proposition,pfe',
                'ranked_themes.*.rank' => 'required_with:ranked_themes.*|integer',
                'removed_co_encadrements' => 'array|nullable'
            ]);

            $enseignant = Enseignant::find(auth()->id());

            if (!$enseignant) {
                return response()->json([
                    'message' => 'Enseignant not found'
                ], 404);
            }

            // Convert removed_co_encadrements to a collection
            $removedCoEncadrements = collect($request->removed_co_encadrements ?? []);

            // Handle removed co-encadrements in batch
            if ($removedCoEncadrements->isNotEmpty()) {
                Pfe::whereIn('id', $removedCoEncadrements)
                    ->where('id_co_encadrant', $enseignant->id)
                    ->update(['id_co_encadrant' => null]);
            }

            // Get current encadrements with their roles
            $currentEncadrements = Pfe::where(function ($query) use ($enseignant) {
                $query
                    ->where('id_encadrant', $enseignant->id)
                    ->orWhere('id_co_encadrant', $enseignant->id);
            })
                ->get()
                ->mapWithKeys(function ($pfe) use ($enseignant) {
                    return [$pfe->id => [
                        'pfe' => $pfe,
                        'role' => $pfe->id_encadrant == $enseignant->id ? 'encadrant' : 'co_encadrant'
                    ]];
                });

            // Handle case where ranked_themes is empty
            if (empty($request->ranked_themes)) {
                foreach ($currentEncadrements as $pfeId => $pfeData) {
                    $pfe = $pfeData['pfe'];
                    $role = $pfeData['role'];

                    $this->handleRemoval($pfe, $role, $enseignant->id);
                }

                return response()->json([
                    'message' => 'Tous les choix ont été mis à jour avec succès'
                ]);
            }

            // Process removed themes - need to handle mixed ID types
            $newThemeIds = collect($request->ranked_themes)->map(function ($theme) {
                // Convert to string for consistent comparison since UUIDs are strings
                return (string)$theme['id'];
            });

            $removedPfeIds = $currentEncadrements
                ->keys()
                ->map(function ($id) {
                    return (string)$id; // Convert PFE IDs to string for comparison
                })
                ->diff($newThemeIds)
                ->diff($removedCoEncadrements->map(function ($id) {
                    return (string)$id;
                }))
                ->filter(function ($pfeId) use ($currentEncadrements) {
                    // Find the PFE by converting back to original type if needed
                    $pfeData = $currentEncadrements->first(function ($data, $key) use ($pfeId) {
                        return (string)$key === $pfeId;
                    });
                    
                    if (!$pfeData) return false;
                    
                    $pfe = $pfeData['pfe'];
                    $role = $pfeData['role'];

                    if ($role === 'co_encadrant') {
                        return true;
                    }

                    if ($role === 'encadrant') {
                        return $pfe->origine_proposition !== 'enseignant';
                    }

                    return false;
                });

            foreach ($removedPfeIds as $pfeId) {
                // Find the actual PFE data using string comparison
                $pfeData = $currentEncadrements->first(function ($data, $key) use ($pfeId) {
                    return (string)$key === $pfeId;
                });
                
                if ($pfeData) {
                    $this->handleRemoval($pfeData['pfe'], $pfeData['role'], $enseignant->id);
                }
            }

            // Process new choices
            foreach ($request->ranked_themes as $index => $theme) {
                $themeId = $theme['id'];

                // Check if this is an existing PFE assignment
                $existingPfe = $currentEncadrements->first(function ($data, $key) use ($themeId) {
                    return (string)$key === (string)$themeId;
                });

                if ($existingPfe) {
                    // Skip existing assignments - no need to update ordre since it doesn't exist
                    continue;
                }
                
                if ($theme['type'] === 'proposition') {
                    // Convert proposition to PFE
                    $proposition = PropositionEtudiant::find($themeId);
                    if ($proposition) {
                        Log::info('Proposition:', $proposition->toArray());
                        Pfe::create([
                            'option' => $proposition->option,
                            'intitule' => $proposition->intitule,
                            'resume' => $proposition->resume,
                            'technologies_utilisees' => $proposition->technologies_utilisees,
                            'besoins_materiels' => $proposition->besoins_materiels,
                            'type_sujet' => $proposition->type_sujet,
                            'id_encadrant' => $enseignant->id,
                            'id_group' => $proposition->id_group,
                            'origine_proposition' => 'etudiant' // Set appropriate origin
                        ]);
                        $proposition->delete();
                    }
                
                } else if ($theme['type'] === 'pfe') {
                    // Add as co-encadrant if not already the encadrant
                    $pfe = Pfe::find($themeId);
                    if ($pfe && $pfe->id_encadrant !== $enseignant->id && !$pfe->id_co_encadrant) {
                        $pfe->update([
                            'id_co_encadrant' => $enseignant->id
                        ]);
                    } else if ($pfe && $pfe->id_encadrant === null) {
                        // Handle case where PFE has no encadrant (stages without encadrant)
                        $pfe->update([
                            'id_encadrant' => $enseignant->id
                        ]);
                    }
                }
            }
            return response()->json([
                'message' => 'Vos choix ont été enregistrés avec succès'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred while submitting choices',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove a co-encadrant from a PFE
     */
    public function removeCoEncadrant(Request $request, string $pfeId): JsonResponse
    {
        try {
            $enseignant = Enseignant::find(auth()->id());

            if (!$enseignant) {
                return response()->json([
                    'message' => 'Enseignant not found'
                ], 404);
            }

            $pfe = Pfe::find($pfeId);

            if (!$pfe) {
                return response()->json([
                    'message' => 'PFE not found'
                ], 404);
            }

            if ($pfe->id_co_encadrant !== $enseignant->id) {
                return response()->json([
                    'message' => 'You are not the co-encadrant of this PFE'
                ], 403);
            }

            $pfe->update([
                'id_co_encadrant' => null
            ]);

            return response()->json([
                'message' => 'Co-encadrement retiré avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred while removing co-encadrant',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle the removal of an encadrant or co-encadrant from a PFE
     */
    private function handleRemoval(Pfe $pfe, string $role, string $enseignantId)
    {
        if ($role === 'encadrant') {
            // Check if this PFE is removable (not from teacher proposition)
            if ($pfe->origine_proposition === 'enseignant') {
                // Don't remove teacher-proposed themes
                return;
            }

            if ($pfe->id_co_encadrant) {
                // If there's a co-encadrant, promote them to encadrant
                $pfe->update([
                    'id_encadrant' => $pfe->id_co_encadrant,
                    'id_co_encadrant' => null
                ]);
            } else {
                // Only convert to proposition if there's no co-encadrant AND it's removable
                if ($pfe->origine_proposition === 'stage') {
                    // For stages, just remove the encadrant, don't convert to proposition
                    $pfe->update([
                        'id_encadrant' => null
                    ]);
                } else {
                    // For student propositions, convert back to proposition
                    PropositionEtudiant::create([
                        'id_group' => $pfe->id_group,
                        'option' => $pfe->option,
                        'intitule' => $pfe->intitule,
                        'resume' => $pfe->resume,
                        'technologies_utilisees' => $pfe->technologies_utilisees,
                        'besoins_materiels' => $pfe->besoins_materiels,
                        'status' => 'accepted',
                        'type_sujet' => $pfe->type_sujet
                    ]);
                    $pfe->delete();
                }
            }
        } elseif ($role === 'co_encadrant') {
            // Co-encadrant role is always removable
            if ($pfe->id_co_encadrant === $enseignantId) {
                $pfe->update([
                    'id_co_encadrant' => null
                ]);
            }
        }
    }
}