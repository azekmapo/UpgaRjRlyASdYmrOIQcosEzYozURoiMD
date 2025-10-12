<?php

namespace App\Http\Controllers;

use App\Models\Periode;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PeriodeController extends Controller
{
    public function update(Request $request, $id)
    {
        try {
            // Validate the request
            $request->validate([
                'date_debut' => 'required|date',
                'date_fin' => 'required|date|after:date_debut',
            ]);

            // Format the dates
            $date_debut = Carbon::parse($request->input('date_debut'))->timezone('Europe/Paris')->format('Y-m-d H:i:s');
            $date_fin = Carbon::parse($request->input('date_fin'))->timezone('Europe/Paris')->format('Y-m-d H:i:s');

            // Vérification supplémentaire que date_debut < date_fin
            if (Carbon::parse($date_debut)->gte(Carbon::parse($date_fin))) {
                return response()->json([
                    'success' => false,
                    'message' => 'La date de début doit être antérieure à la date de fin.'
                ], 400);
            }

            // Find and update the periode
            $periode = Periode::findOrFail($id);
            $periode->update([
                'date_debut' => $date_debut,
                'date_fin' => $date_fin,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Période mise à jour avec succès !',
                'periode' => $periode
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour : ' . $e->getMessage()
            ], 500);
        }
    }

    public function getPeriodeActive()
    {
        try {
            $currentDate = Carbon::now()->format('Y-m-d');
            
            $periode = Periode::where('date_debut', '<=', $currentDate)
                             ->where('date_fin', '>=', $currentDate)
                             ->first();

            if (!$periode) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune période active trouvée'
                ], 404);
            }

            $user = Auth::user();
            $isResponsable = false;
            
            if ($user && $user->role === 'enseignant') {
                $enseignant = $user->enseignant;
                if ($enseignant) {
                    $isResponsable = $enseignant->is_responsable;
                }
            }

            return response()->json([
                'success' => true,
                'data' => $periode,
                'is_responsable' => $isResponsable
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la période active : ' . $e->getMessage()
            ], 500);
        }
    }
}
