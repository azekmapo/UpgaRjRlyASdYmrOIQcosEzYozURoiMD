<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GetAllUsersController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $page = $request->get('page', 1);
        $perPage = 10;
        $searchTerm = $request->get('search', '');
        $option = $request->get('option', 'Tous');

        $etudiantsQuery = User::with(['etudiant'])->where('role', 'etudiant');

        if ($searchTerm) {
            $etudiantsQuery->where(function ($q) use ($searchTerm) {
                $q->whereRaw('LOWER(name) like ?', ["%{$searchTerm}%"])
                    ->orWhereRaw('LOWER(email) like ?', ["%{$searchTerm}%"]);
            });
        }

        if ($option !== 'Tous') {
            $etudiantsQuery->whereHas('etudiant', function ($q) use ($option) {
                $q->where('option', $option);
            });
        }

        $etudiants = $etudiantsQuery->orderBy('name', 'asc')->paginate($perPage, ['*'], 'page', $page);

        $transformedData = [
            'data' => collect($etudiants->items())->map(function ($etudiant) {
                return [
                    'id' => (string) $etudiant->id,
                    'nom' => $etudiant->name,
                    'email' => $etudiant->email,
                    'role' => $etudiant->role,
                    'option' => $etudiant->etudiant->option ?? null,
                    'moyenne' => $etudiant->etudiant->moyenne ?? null,
                ];
            }),
            'current_page' => $etudiants->currentPage(),
            'last_page' => $etudiants->lastPage(),
        ];

        return response()->json($transformedData);
    }

    public function getEnseignants(): JsonResponse
    {
        $enseignants = User::with(['enseignant'])->where('role', 'enseignant')->orderBy('name', 'asc')->get();

        $transformedData = $enseignants->map(function ($enseignant) {
            return [
                'id' => (string) $enseignant->id,
                'nom' => $enseignant->name,
                'email' => $enseignant->email,
                'role' => $enseignant->role,
                'grade' => $enseignant->enseignant->grade ?? null,
                'date_recrutement' => $enseignant->enseignant->date_recrutement ?? null
            ];
        });

        return response()->json($transformedData);
    }

    public function getEntreprises(): JsonResponse
    {
        $entreprises = User::with(['entreprise'])->where('role', 'entreprise')->orderBy('name', 'asc')->get();

        $transformedData = $entreprises->map(function ($entreprise) {
            return [
                'id' => (string) $entreprise->id,
                'nom' => $entreprise->name,
                'email' => $entreprise->email,
                'role' => $entreprise->role,
                'denomination' => $entreprise->entreprise->denomination ?? null,
            ];
        });

        return response()->json($transformedData);
    }

    public function destroy(string $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            $user->delete();

            return response()->json(['message' => 'Utilisateur supprimé avec succès']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Erreur lors de la suppression'], 500);
        }
    }
}
