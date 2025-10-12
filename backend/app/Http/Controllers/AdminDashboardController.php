<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Etudiant;
use App\Models\Periode;
use App\Models\Pfe;
use App\Models\PropositionEnseignant;
use App\Models\PropositionEntreprise;
use App\Models\PropositionEtudiant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AdminDashboardController extends Controller
{
    /**
     * Get admin dashboard statistics
     */
    public function index(): JsonResponse
    {
        // Cache the dashboard stats for 5 minutes to improve performance
        $dashboardData = Cache::remember('admin_dashboard_stats', 60, function () {
            
            // User statistics
            $userStats = User::select('role', DB::raw('count(*) as count'))
                ->whereIn('role', ['etudiant', 'enseignant', 'entreprise'])
                ->groupBy('role')
                ->get()
                ->pluck('count', 'role')
                ->toArray();

            $statsData = [
                'etudiants' => $userStats['etudiant'] ?? 0,
                'enseignants' => $userStats['enseignant'] ?? 0,
                'entreprises' => $userStats['entreprise'] ?? 0,
            ];
            // User distribution
            $total = array_sum($statsData);
            $userDistData = [
                ['name' => 'Etudiants', 'value' => $total > 0 ? round(($statsData['etudiants'] / $total) * 100) : 0],
                ['name' => 'Enseignants', 'value' => $total > 0 ? round(($statsData['enseignants'] / $total) * 100) : 0],
                ['name' => 'Entreprises', 'value' => $total > 0 ? round(($statsData['entreprises'] / $total) * 100) : 0],
            ];

            // PFE types distribution
            $possibleTypes = ['classique', 'innovant', 'stage'];
            $pfeTypes = Pfe::select('type_sujet', DB::raw('count(*) as count'))
                ->whereNotNull('type_sujet')
                ->groupBy('type_sujet')
                ->get()
                ->pluck('count', 'type_sujet')
                ->toArray();
            
            $totalPfes = array_sum($pfeTypes);
            $pfeTypesData = collect($possibleTypes)->map(function ($type) use ($pfeTypes, $totalPfes) {
                return [
                    'name' => $type,
                    'value' => $totalPfes > 0 ? round((($pfeTypes[$type] ?? 0) / $totalPfes) * 100) : 0,
                ];
            })->values();

            // PFE status distribution
            $possibleStatuses = ['pending', 'accepted', 'declined'];
            $statusTranslations = [
                'pending' => 'En attente',
                'accepted' => 'Accepté',
                'declined' => 'Refusé',
            ];

            $studentPropositions = PropositionEtudiant::select('status', DB::raw('count(*) as count'))
                ->whereNotNull('status')
                ->groupBy('status')
                ->get()
                ->pluck('count', 'status')
                ->toArray();
            $totalStudentPropositions = array_sum($studentPropositions);
            $pfeStatusData = collect($possibleStatuses)->map(function ($status) use ($studentPropositions, $totalStudentPropositions, $statusTranslations) {
                $count = $studentPropositions[$status] ?? 0;
                return [
                    'name' => $statusTranslations[$status],
                    'value' => $totalStudentPropositions > 0 ? round(($count / $totalStudentPropositions) * 100) : 0,
                ];
            });
            // Options data (optimized to eliminate N+1 queries)
            $studentsByOption = Etudiant::select('option', DB::raw('count(*) as etudiants'))
                ->whereNotNull('option')
                ->groupBy('option')
                ->get()
                ->keyBy('option');

            $options = $studentsByOption->keys()->toArray();

            if (!empty($options)) {
                // Get PFE counts for all options in single queries (eliminating N+1)
                $enseignantPfes = PropositionEnseignant::select('option', DB::raw('count(*) as count'))
                    ->whereIn('option', $options)
                    ->groupBy('option')
                    ->get()
                    ->pluck('count', 'option')
                    ->toArray();

                $etudiantPfes = PropositionEtudiant::select('option', DB::raw('count(*) as count'))
                    ->whereIn('option', $options)
                    ->groupBy('option')
                    ->get()
                    ->pluck('count', 'option')
                    ->toArray();

                $entreprisePfes = PropositionEntreprise::select('option', DB::raw('count(*) as count'))
                    ->whereIn('option', $options)
                    ->groupBy('option')
                    ->get()
                    ->pluck('count', 'option')
                    ->toArray();

                // Combine all data
                $optionsData = collect($options)->map(function ($option) use ($studentsByOption, $enseignantPfes, $etudiantPfes, $entreprisePfes) {
                    $totalPfes = ($enseignantPfes[$option] ?? 0) + 
                                ($etudiantPfes[$option] ?? 0) + 
                                ($entreprisePfes[$option] ?? 0);

                    return [
                        'name' => $option,
                        'etudiants' => $studentsByOption[$option]->etudiants,
                        'pfe' => $totalPfes,
                    ];
                });
            } else {
                $optionsData = collect();
            }

            // Periods
            $periodes = Periode::select('id', 'titre', 'description', 'date_debut', 'date_fin')
                ->orderBy('id')
                ->get();

            return compact(
                'statsData',
                'userDistData',
                'pfeTypesData',
                'pfeStatusData',
                'optionsData',
                'periodes'
            );
        });
        return response()->json([
            'success' => true,
            'data' => $dashboardData
        ]);
    }
}