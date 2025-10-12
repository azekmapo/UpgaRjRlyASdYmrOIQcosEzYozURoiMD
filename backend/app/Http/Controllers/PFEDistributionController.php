<?php
namespace App\Http\Controllers;

use App\Mail\ThemeAssignmentEmail;
use App\Models\ChoixPFE;
use App\Models\Group;
use App\Models\Pfe;
use App\Models\PropositionEnseignant;
use App\Models\PropositionEntreprise;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class PFEDistributionController extends Controller
{
    public function distributeThemes()
    {
        try {
            DB::beginTransaction();
            
            // Eager load all necessary relationships to avoid N+1 queries
            $groups = Group::with([
                'choixPFE',
                'student1User',  // Direct relationship to User
                'student2User'   // Direct relationship to User
            ])
            ->orderBy('moyenne', 'desc')
            ->get();
            
            // Pre-load all themes with their relationships to avoid repeated queries
            $enseignantThemes = PropositionEnseignant::where('status', 'accepted')
                ->with(['encadrant', 'coEncadrant'])
                ->get()
                ->keyBy('id');
                
            $entrepriseThemes = PropositionEntreprise::where('status', 'accepted')
                ->with(['entreprise'])
                ->get()
                ->keyBy('id');
            
            // Get already assigned theme IDs to avoid duplicates
            $assignedEnseignantIds = Pfe::whereNotNull('id_encadrant')
                ->pluck('id_encadrant')
                ->toArray();
                
            $assignedEntrepriseIds = Pfe::whereNotNull('id_entreprise')
                ->pluck('id_entreprise')
                ->toArray();
            
            $assignedThemes = [];
            $createdPFEs = [];
            
            foreach ($groups as $group) {
                if (!$group->choixPFE) {
                    continue;
                }
                
                $themeAssigned = false;
                $rankedThemes = json_decode($group->choixPFE->ranked_themes, true);
                
                // Sort themes by rank
                usort($rankedThemes, function($a, $b) {
                    return $a['rank'] <=> $b['rank'];
                });
                
                // Try to assign preferred themes
                foreach ($rankedThemes as $rankedTheme) {
                    $themeKey = $rankedTheme['type_sujet'] . '-' . $rankedTheme['theme_id'];
                    
                    if (!isset($assignedThemes[$themeKey])) {
                        $theme = $this->getTheme($rankedTheme, $enseignantThemes, $entrepriseThemes);
                        
                        if ($theme) {
                            $pfe = $this->createPFE($group, $rankedTheme, $theme);
                            $assignedThemes[$themeKey] = true;
                            $createdPFEs[] = $pfe;
                            $themeAssigned = true;
                            
                            // Update assigned lists for random assignment
                            if ($rankedTheme['type_sujet'] === 'stage') {
                                $assignedEntrepriseIds[] = $theme->id;
                            } else {
                                $assignedEnseignantIds[] = $theme->id;
                            }
                            
                            break;
                        }
                    }
                }
                
                // If no preferred theme assigned, assign random theme
                if (!$themeAssigned) {
                    $randomTheme = $this->getRandomTheme(
                        $group, 
                        $enseignantThemes, 
                        $entrepriseThemes, 
                        $assignedEnseignantIds, 
                        $assignedEntrepriseIds
                    );
                    
                    if ($randomTheme) {
                        $pfe = $this->createPFE($group, $randomTheme['data'], $randomTheme['theme']);
                        $createdPFEs[] = $pfe;
                        
                        // Update assigned lists
                        if ($randomTheme['data']['type_sujet'] === 'stage') {
                            $assignedEntrepriseIds[] = $randomTheme['theme']->id;
                        } else {
                            $assignedEnseignantIds[] = $randomTheme['theme']->id;
                        }
                    }
                }
            }
            
            DB::commit();
            
            // Send emails after successful commit (outside transaction)
            $this->sendBulkThemeAssignmentEmails($createdPFEs);
            
            Log::info('PFE themes distribution completed successfully', [
                'total_assignments' => count($createdPFEs)
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error during PFE distribution: ' . $e->getMessage());
            throw $e;
        }
    }
    
    private function getTheme($rankedTheme, $enseignantThemes, $entrepriseThemes)
    {
        if ($rankedTheme['type_sujet'] === 'stage') {
            return $entrepriseThemes->get($rankedTheme['theme_id']);
        } else {
            return $enseignantThemes->get($rankedTheme['theme_id']);
        }
    }
    
    private function createPFE($group, $rankedTheme, $theme)
    {
        $themeData = [
            'option' => $theme->option,
            'intitule' => $theme->intitule,
            'resume' => $theme->resume,
            'technologies_utilisees' => $theme->technologies_utilisees,
            'id_group' => $group->id,
            'session' => 'session 1',
        ];
        
        if ($rankedTheme['type_sujet'] === 'stage') {
            $themeData = array_merge($themeData, [
                'besoins_materiels' => null,
                'type_sujet' => 'stage',
                'id_entreprise' => $theme->entreprise_id,
                'origine_proposition' => 'stage',
            ]);
        } else {
            $themeData = array_merge($themeData, [
                'besoins_materiels' => $theme->besoins_materiels,
                'type_sujet' => $theme->type_sujet,
                'id_encadrant' => $theme->encadrant_id,
                'id_co_encadrant' => $theme->co_encadrant_id,
                'origine_proposition' => 'enseignant',
            ]);
        }
        
        return Pfe::create($themeData);
    }
    
    private function getRandomTheme($group, $enseignantThemes, $entrepriseThemes, $assignedEnseignantIds, $assignedEntrepriseIds)
    {
        // Try enseignant themes first
        $availableEnseignantThemes = $enseignantThemes->filter(function($theme) use ($group, $assignedEnseignantIds) {
            return $theme->option === $group->option && !in_array($theme->id, $assignedEnseignantIds);
        });
        
        if ($availableEnseignantThemes->isNotEmpty()) {
            $randomTheme = $availableEnseignantThemes->random();
            return [
                'theme' => $randomTheme,
                'data' => [
                    'theme_id' => $randomTheme->id,
                    'type_sujet' => $randomTheme->type_sujet
                ]
            ];
        }
        
        // Try entreprise themes
        $availableEntrepriseThemes = $entrepriseThemes->filter(function($theme) use ($group, $assignedEntrepriseIds) {
            return $theme->option === $group->option && !in_array($theme->id, $assignedEntrepriseIds);
        });
        
        if ($availableEntrepriseThemes->isNotEmpty()) {
            $randomTheme = $availableEntrepriseThemes->random();
            return [
                'theme' => $randomTheme,
                'data' => [
                    'theme_id' => $randomTheme->id,
                    'type_sujet' => 'stage'
                ]
            ];
        }
        
        return null;
    }
    
    private function sendBulkThemeAssignmentEmails($pfes)
    {
        foreach ($pfes as $pfe) {
            try {
                // Data is already loaded via eager loading
                $student1 = $pfe->group->student1User;
                
                if ($student1) {
                    Log::info('Sending theme assignment email to student 1', [
                        'student_email' => $student1->email,
                        'student_name' => $student1->name
                    ]);
                    
                    Mail::to($student1->email)->send(new ThemeAssignmentEmail($student1, $pfe, $pfe->group));
                }
                
                $student2 = $pfe->group->student2User;
                if ($student2) {
                    Log::info('Sending theme assignment email to student 2', [
                        'student_email' => $student2->email,
                        'student_name' => $student2->name
                    ]);
                    
                    Mail::to($student2->email)->send(new ThemeAssignmentEmail($student2, $pfe, $pfe->group));
                }
                
            } catch (\Exception $e) {
                Log::error('Error sending theme assignment emails', [
                    'error' => $e->getMessage(),
                    'pfe_id' => $pfe->id
                ]);
            }
        }
    }
}