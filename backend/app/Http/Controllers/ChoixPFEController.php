<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ChoixPFE;
use App\Models\Enseignant;
use App\Models\Entreprise;
use App\Models\Etudiant;
use App\Models\Group;
use App\Models\Pfe;
use App\Models\PropositionEnseignant;
use App\Models\PropositionEntreprise;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ChoixPFEController extends Controller
{
    /**
     * Get student's PFE choice data
     * GET /api/choix-pfe
     */
    public function index(): JsonResponse
    {
        try {
            // Get student with eager loading
            $student = Etudiant::with('user')->where('id', auth()->id())->first();
            
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found'
                ], 404);
            }

            $group = Group::where('id_etd1', $student->id)
                ->orWhere('id_etd2', $student->id)
                ->first();

            if (!$group) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'hasGroup' => false,
                        'availableThemes' => [],
                        'currentChoices' => null,
                        'message' => 'No group found for this student'
                    ]
                ]);
            }

            // Get available themes
            $themes = $this->getAvailableThemes($group);
            
            // Get current choices
            $currentChoices = $this->getCurrentChoices($group);

            return response()->json([
                'success' => true,
                'data' => [
                    'hasGroup' => true,
                    'groupInfo' => [
                        'id' => $group->id,
                        'option' => $group->option,
                        'individual_options' => $this->parseGroupOptions($group->option)
                    ],
                    'availableThemes' => $themes,
                    'currentChoices' => $currentChoices,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching PFE choices: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching data'
            ], 500);
        }
    }

    /**
     * Submit student's PFE choices
     * POST /api/choix-pfe
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validate request
            $validated = $request->validate([
                'ranked_themes' => 'required|array|min:1|max:10',
                'ranked_themes.*.theme_id' => 'required|integer',
                'ranked_themes.*.type_sujet' => 'required|string|in:classique,innovant,stage',
                'ranked_themes.*.rank' => 'required|integer|between:1,10',
            ]);

            // Get student's group
            $student = Etudiant::where('id', auth()->id())->first();
            
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found'
                ], 404);
            }

            $group = Group::where('id_etd1', $student->id)
                ->orWhere('id_etd2', $student->id)
                ->first();

            if (!$group) {
                return response()->json([
                    'success' => false,
                    'message' => 'No group found for this student'
                ], 404);
            }

            // Validate themes exist and belong to group's option(s)
            $validationResult = $this->validateThemes($validated['ranked_themes'], $group);
            
            if (!$validationResult['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => $validationResult['message']
                ], 400);
            }

            // Validate rank uniqueness
            $ranks = collect($validated['ranked_themes'])->pluck('rank')->toArray();
            if (count($ranks) !== count(array_unique($ranks))) {
                return response()->json([
                    'success' => false,
                    'message' => 'Each theme must have a unique rank'
                ], 400);
            }

            // Save choices
            DB::beginTransaction();
            
            ChoixPFE::updateOrCreate(
                ['id_group' => $group->id],
                ['ranked_themes' => json_encode($validated['ranked_themes'])]
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Your choices have been saved successfully',
                'data' => [
                    'choices_count' => count($validated['ranked_themes'])
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error saving PFE choices: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while saving your choices'
            ], 500);
        }
    }

    /**
     * Update student's PFE choices
     * PUT /api/choix-pfe
     */
    public function update(Request $request): JsonResponse
    {
        // Same logic as store method since we're using updateOrCreate
        return $this->store($request);
    }

    /**
     * Delete student's PFE choices
     * DELETE /api/choix-pfe
     */
    public function destroy(): JsonResponse
    {
        try {
            $student = Etudiant::where('id', auth()->id())->first();
            
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found'
                ], 404);
            }

            $group = Group::where('id_etd1', $student->id)
                ->orWhere('id_etd2', $student->id)
                ->first();

            if (!$group) {
                return response()->json([
                    'success' => false,
                    'message' => 'No group found for this student'
                ], 404);
            }

            $deleted = ChoixPFE::where('id_group', $group->id)->delete();

            if ($deleted) {
                return response()->json([
                    'success' => true,
                    'message' => 'Your choices have been deleted successfully'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'No choices found to delete'
                ], 404);
            }

        } catch (\Exception $e) {
            Log::error('Error deleting PFE choices: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting your choices'
            ], 500);
        }
    }

    /**
     * Parse group options from combined format (e.g., 'GL-SIC' -> ['GL', 'SIC'])
     */
    private function parseGroupOptions(string $groupOption): array
    {
        return explode('-', $groupOption);
    }

    /**
     * Get available themes for a group (UPDATED - Now supports multi-option groups with option matching)
     */
    private function getAvailableThemes(Group $group)
    {
        // Parse the group options
        $groupOptions = $this->parseGroupOptions($group->option);

        // Get teacher themes with eager loading of related users
        $teacherThemes = PropositionEnseignant::where('status', 'accepted')
            ->with(['encadrant', 'coEncadrant'])
            ->get()
            ->filter(function ($theme) use ($groupOptions) {
                // Check if theme's options overlap with group's options
                $themeOptions = $this->parseGroupOptions($theme->option);
                return !empty(array_intersect($groupOptions, $themeOptions));
            })
            ->map(function ($theme) {
                $themeData = $theme->toArray();

                // Fetch encadrant and co-encadrant names from users table
                $themeData['encadrant_name'] = $theme->encadrant ? $theme->encadrant->name : null;
                $themeData['co_encadrant_name'] = $theme->coEncadrant ? $theme->coEncadrant->name : null;

                // Clean up unnecessary fields
                unset($themeData['created_at'], $themeData['updated_at'],
                    $themeData['status'], $themeData['encadrant'], $themeData['coEncadrant']);

                return $themeData;
            });
            
        // Get company themes with eager loading of related users
        $entrepriseThemes = PropositionEntreprise::where('status', 'accepted')
            ->with('entreprise')
            ->get()
            ->filter(function ($theme) use ($groupOptions) {
                // Check if theme's options overlap with group's options
                $themeOptions = $this->parseGroupOptions($theme->option);
                return !empty(array_intersect($groupOptions, $themeOptions));
            })
            ->map(function ($theme) {
                $themeData = $theme->toArray();
                
                // Use the eager loaded relationship
                $themeData['entreprise_name'] = $theme->entreprise ? $theme->entreprise->name : null;

                // Clean up unnecessary fields
                unset($themeData['created_at'], $themeData['updated_at'],
                    $themeData['status'], $themeData['entreprise']);

                $themeData['type_sujet'] = 'stage';
                return $themeData;
            });

        return $teacherThemes->concat($entrepriseThemes)->values();
    }

    /**
     * Get current choices for a group
     */
    private function getCurrentChoices(Group $group)
    {
        $choixPFE = ChoixPFE::where('id_group', $group->id)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$choixPFE) {
            return null;
        }

        $currentChoices = json_decode($choixPFE->ranked_themes, true);
        
        return collect($currentChoices)
            ->sortBy('rank')
            ->values()
            ->toArray();
    }

    /**
     * Validate that themes exist and match group's option(s) (UPDATED - Now supports multi-option validation with option matching)
     */
    private function validateThemes(array $rankedThemes, Group $group): array
    {
        // Parse the group options
        $groupOptions = $this->parseGroupOptions($group->option);

        // Separate themes by type for batch validation
        $teacherThemeIds = [];
        $entrepriseThemeIds = [];
        
        foreach ($rankedThemes as $rankedTheme) {
            if (in_array($rankedTheme['type_sujet'], ['classique', 'innovant'])) {
                $teacherThemeIds[] = $rankedTheme['theme_id'];
            } else {
                $entrepriseThemeIds[] = $rankedTheme['theme_id'];
            }
        }

        // Batch validate teacher themes
        if (!empty($teacherThemeIds)) {
            $validTeacherThemes = PropositionEnseignant::whereIn('id', $teacherThemeIds)
                ->where('status', 'accepted')
                ->get()
                ->filter(function ($theme) use ($groupOptions) {
                    // Check if theme's options overlap with group's options
                    $themeOptions = $this->parseGroupOptions($theme->option);
                    return !empty(array_intersect($groupOptions, $themeOptions));
                })
                ->pluck('id')
                ->toArray();
                
            $invalidTeacherThemes = array_diff($teacherThemeIds, $validTeacherThemes);
            if (!empty($invalidTeacherThemes)) {
                return [
                    'valid' => false,
                    'message' => 'One or more teacher themes do not exist or do not match your group\'s options (' . implode(', ', $groupOptions) . ')'
                ];
            }
        }

        // Batch validate company themes
        if (!empty($entrepriseThemeIds)) {
            $validEntrepriseThemes = PropositionEntreprise::whereIn('id', $entrepriseThemeIds)
                ->where('status', 'accepted')
                ->get()
                ->filter(function ($theme) use ($groupOptions) {
                    // Check if theme's options overlap with group's options
                    $themeOptions = $this->parseGroupOptions($theme->option);
                    return !empty(array_intersect($groupOptions, $themeOptions));
                })
                ->pluck('id')
                ->toArray();
                
            $invalidEntrepriseThemes = array_diff($entrepriseThemeIds, $validEntrepriseThemes);
            if (!empty($invalidEntrepriseThemes)) {
                return [
                    'valid' => false,
                    'message' => 'One or more company themes do not exist or do not match your group\'s options (' . implode(', ', $groupOptions) . ')'
                ];
            }
        }

        return ['valid' => true];
    }
}