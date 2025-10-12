<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Enseignant;
use App\Models\Pfe;
use App\Models\User;
use App\Models\VoeuxJury;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class JuryController extends Controller
{
    /**
     * Get available themes and current choices for jury selection
     * 
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        try {
            $userId = auth()->id();
            
            // Get current authenticated user as enseignant (same ID)
            $enseignant = Enseignant::find($userId);
            
            if (!$enseignant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Enseignant non trouvé'
                ], 404);
            }

            // Get current choices first to avoid loading unnecessary data
            $currentChoices = VoeuxJury::where('id_enseignant', $enseignant->id)
                ->orderBy('created_at', 'desc')
                ->first();

            // Extract chosen PFE IDs for exclusion
            $chosenPfeIds = [];
            if ($currentChoices && $currentChoices->ranked_themes) {
                $rankedThemes = json_decode($currentChoices->ranked_themes, true);
                
                if ($rankedThemes && is_array($rankedThemes)) {
                    $chosenPfeIds = collect($rankedThemes)
                        ->pluck('id')
                        ->toArray();
                }
            }

            // Optimized query with eager loading to prevent N+1 queries
            $pfesQuery = Pfe::whereNull('id_jury') // Only PFEs without jury
                ->where(function ($query) use ($enseignant) {
                    $query->where('id_encadrant', '!=', $enseignant->id)
                          ->orWhereNull('id_encadrant');
                })
                ->where(function ($query) use ($enseignant) {
                    $query->where('id_co_encadrant', '!=', $enseignant->id)
                          ->orWhereNull('id_co_encadrant');
                })
                ->with([
                    'encadrant.user:id,name',
                    'coEncadrant.user:id,name', 
                    'entreprise:id,name',
                    'group:id,id_etd1,id_etd2,moyenne',
                    'group.student1.user:id,name',
                    'group.student2.user:id,name'
                ])
                ->select([
                    'id', 'option', 'intitule', 'type_sujet', 'resume', 
                    'technologies_utilisees', 'besoins_materiels',
                    'id_encadrant', 'id_co_encadrant', 'id_entreprise', 'id_group'
                ]);

            $allPfes = $pfesQuery->get();

            // Transform data once
            $transformedPfes = $allPfes->map(function ($pfe) {
                return [
                    'id' => $pfe->id,
                    'option' => $pfe->option,
                    'intitule' => $pfe->intitule,
                    'type_sujet' => $pfe->type_sujet,
                    'resume' => $pfe->resume,
                    'technologies_utilisees' => $pfe->technologies_utilisees,
                    'besoins_materiels' => $pfe->besoins_materiels,
                    'encadrant' => $pfe->encadrant?->user?->name,
                    'co_encadrant' => $pfe->coEncadrant?->user?->name,
                    'entreprise' => $pfe->entreprise?->name,
                    'groupe' => $pfe->group ? [
                        'etudiant1' => $pfe->group->student1?->user?->name,
                        'etudiant2' => $pfe->group->student2?->user?->name,
                        'moyenne' => $pfe->group->moyenne
                    ] : null
                ];
            });

            // Split into available and chosen themes
            $availableThemes = $transformedPfes->whereNotIn('id', $chosenPfeIds)->values();
            
            $currentChoicesArray = null;
            if ($currentChoices && $currentChoices->ranked_themes) {
                $rankedThemes = json_decode($currentChoices->ranked_themes, true);
                
                if ($rankedThemes && is_array($rankedThemes)) {
                    // Create a lookup array for better performance
                    $pfeMap = $transformedPfes->keyBy('id');
                    
                    $currentChoicesArray = collect($rankedThemes)
                        ->map(function ($rankedTheme) use ($pfeMap) {
                            // Ensure $rankedTheme is an array and has required keys
                            if (!is_array($rankedTheme) || !isset($rankedTheme['id'])) {
                                return null;
                            }
                            
                            $pfe = $pfeMap->get($rankedTheme['id']);
                            return $pfe ? array_merge($pfe, ['rank' => $rankedTheme['rank'] ?? 0]) : null;
                        })
                        ->filter() // Remove null values
                        ->sortBy('rank')
                        ->values();
                }
            }
            return response()->json([
                'success' => true,
                'data' => [
                    'available_themes' => $availableThemes,
                    'current_choices' => $currentChoicesArray,
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('JuryController@index error: ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la récupération des données'
            ], 500);
        }
    }

    /**
     * Submit jury choices
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function submitChoices(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'ranked_themes' => 'array',
                'ranked_themes.*.id' => 'required|string',
                'ranked_themes.*.intitule' => 'required|string',
                'ranked_themes.*.type_sujet' => 'required|string',
                'ranked_themes.*.rank' => 'required|integer|min:1',
            ]);

            $enseignant = Enseignant::find(auth()->id());

            if (!$enseignant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Enseignant non trouvé'
                ], 404);
            }

            // If there are ranked themes, verify them in a single query
            if (!empty($request->ranked_themes)) {
                $themeIds = collect($request->ranked_themes)->pluck('id')->toArray();
                
                $validPfeCount = Pfe::whereIn('id', $themeIds)
                    ->where(function ($query) use ($enseignant) {
                        $query->where('id_encadrant', '!=', $enseignant->id)
                              ->orWhereNull('id_encadrant');
                    })
                    ->where(function ($query) use ($enseignant) {
                        $query->where('id_co_encadrant', '!=', $enseignant->id)
                              ->orWhereNull('id_co_encadrant');
                    })
                    ->whereNull('id_jury')
                    ->count();

                if ($validPfeCount !== count($themeIds)) {
                    return response()->json([
                        'success' => false,
                        'message' => "Un ou plusieurs thèmes sélectionnés ne sont pas valides ou ont déjà un jury assigné"
                    ], 400);
                }
            }

            // Update or create voeux_jury entry
            VoeuxJury::updateOrCreate(
                ['id_enseignant' => $enseignant->id],
                ['ranked_themes' => json_encode($request->ranked_themes ?? [])]
            );

            return response()->json([
                'success' => true,
                'message' => 'Vos choix ont été enregistrés avec succès'
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Données de validation invalides',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('JuryController@submitChoices error: ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de l\'enregistrement'
            ], 500);
        }
    }
}