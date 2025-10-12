<?php

namespace App\Http\Controllers;

use App\Models\Enseignant;
use App\Models\User;
use App\Models\Option;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ResponsableController extends Controller
{
    public function getEnseignantsForResponsable()
    {
        try {
            $enseignants = Enseignant::with('user')
                ->whereHas('user')
                ->get()
                ->map(function ($enseignant) {
                    return [
                        'id' => $enseignant->id,
                        'nom' => $enseignant->user->name,
                        'is_responsable' => $enseignant->is_responsable,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'enseignants' => $enseignants
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des enseignants',
                'error' => 'error'
            ], 500);
        }
    }

    public function updateResponsable(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'option_nom' => 'required|string|exists:options,nom',
                'enseignant_id' => 'required|string|exists:enseignants,id',
            ], [
                'option_nom.required' => 'Le nom de l\'option est requis',
                'option_nom.exists' => 'Option non trouvée',
                'enseignant_id.required' => 'L\'ID de l\'enseignant est requis',
                'enseignant_id.exists' => 'Enseignant non trouvé',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreurs de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            $optionNom = $request->option_nom;
            $enseignantId = $request->enseignant_id;

            DB::beginTransaction();

            $option = Option::where('nom', $optionNom)->first();
            
            $ancienResponsableId = $option->id_responsable;
            $ancienResponsable = null;
            
            if ($ancienResponsableId) {
                $ancienEnseignant = Enseignant::find($ancienResponsableId);
                if ($ancienEnseignant) {
                    $ancienEnseignant->is_responsable = false;
                    $ancienEnseignant->save();
                    $ancienResponsable = $ancienEnseignant->user->name;
                }
            }

            $nouvelEnseignant = Enseignant::with('user')->find($enseignantId);
            $nouvelEnseignant->is_responsable = true;
            $nouvelEnseignant->save();

            $option->id_responsable = $enseignantId;
            $option->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Responsable mis à jour avec succès',
                'data' => [
                    'option_nom' => $optionNom,
                    'enseignant_id' => $enseignantId,
                    'enseignant_nom' => $nouvelEnseignant->user->name,
                    'ancien_responsable' => $ancienResponsable,
                ]
            ], 200);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du responsable',
                'error' => 'error'
            ], 500);
        }
    }
}