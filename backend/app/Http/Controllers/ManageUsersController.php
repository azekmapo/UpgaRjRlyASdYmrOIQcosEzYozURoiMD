<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Etudiant;
use App\Models\Enseignant;
use App\Models\Entreprise;
use App\Models\Option;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\NewAccountNotification;
use App\Constants\Constants;
use Illuminate\Support\Facades\DB;

class ManageUsersController extends Controller
{
    private $gradeValues = Constants::TEACHER_GRADES;

    private function getValidOptions()
    {
        return Option::pluck('nom')->toArray();
    }

    public function addEtudiant(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email|max:255',
            'option' => ['required', Rule::in($this->getValidOptions())],
            'moyenne' => 'required|numeric|min:0|max:20',
        ], [
            'nom.required' => 'Le nom est requis',
            'nom.string' => 'Le nom doit être une chaîne de caractères',
            'nom.max' => 'Le nom ne doit pas dépasser 255 caractères',
            'email.required' => 'L\'email est requis',
            'email.email' => 'Format d\'email invalide',
            'email.unique' => 'Cette adresse email est déjà utilisée',
            'email.max' => 'L\'email ne doit pas dépasser 255 caractères',
            'option.required' => 'L\'option est requise',
            'option.in' => 'Option invalide',
            'moyenne.required' => 'La moyenne est requise',
            'moyenne.numeric' => 'La moyenne doit être un nombre',
            'moyenne.min' => 'La moyenne doit être supérieure ou égale à 0',
            'moyenne.max' => 'La moyenne doit être inférieure ou égale à 20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = new User();
            $user->name = $request->nom;
            $user->email = $request->email;
            $password = Str::random(12);
            $user->password = bcrypt($password);
            $user->role = 'etudiant';

            DB::beginTransaction();

            $user->save();

            $etudiant = new Etudiant();
            $etudiant->id = $user->id;
            $etudiant->option = $request->option;
            $etudiant->moyenne = $request->moyenne;
            $etudiant->save();

            try {
                Mail::to($user->email)->send(
                    new NewAccountNotification($user->name, $user->email, $password, $user->role)
                );
            } catch (\Exception $e) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Échec de l\'envoi de l\'email. Aucun étudiant n\'a été enregistré.',
                    'error' => 'Erreur lors de l\'envoi de l\'email'
                ], 500);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Étudiant ajouté avec succès',
                'data' => [
                    'id' => $user->id,
                    'nom' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'option' => $etudiant->option,
                    'moyenne' => $etudiant->moyenne
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreurs lors de l\'ajout de l\'étudiant',
                'error' => 'Erreurs lors de l\'ajout de l\'étudiant'
            ], 500);
        }
    }

    public function addEnseignant(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'nom' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email|max:255',
                'grade' => ['required', Rule::in($this->gradeValues)],
                'date_recrutement' => 'required|date',
            ], [
                'nom.required' => 'Le nom est requis',
                'nom.string' => 'Le nom doit être une chaîne de caractères',
                'nom.max' => 'Le nom ne doit pas dépasser 255 caractères',
                'email.required' => 'L\'email est requis',
                'email.email' => 'Format d\'email invalide',
                'email.unique' => 'Cette adresse email est déjà utilisée',
                'email.max' => 'L\'email ne doit pas dépasser 255 caractères',
                'grade.required' => 'Le grade est requis',
                'grade.in' => 'Grade invalide',
                'date_recrutement.required' => 'La date de recrutement est requise',
                'date_recrutement.date' => 'Format de date invalide',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreurs de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = new User();
            $user->name = $request->nom;
            $user->email = $request->email;
            $password = Str::random(12);
            $user->password = bcrypt($password);
            $user->role = 'enseignant';

            DB::beginTransaction();

            $user->save();

            $enseignant = new Enseignant();
            $enseignant->id = $user->id;
            $enseignant->grade = $request->grade;
            $enseignant->date_recrutement = $request->date_recrutement;
            $enseignant->is_responsable = false;
            $enseignant->save();

            try {
                Mail::to($user->email)->send(
                    new NewAccountNotification($user->name, $user->email, $password, $user->role)
                );
            } catch (\Exception $e) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de l\'envoi de l\'email. Aucun enseignant n\'a été enregistré.',
                    'error' => 'Erreur lors de l\'envoi de l\'email'
                ], 500);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Enseignant ajouté avec succès',
                'data' => [
                    'id' => $user->id,
                    'nom' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'grade' => $enseignant->grade,
                    'date_recrutement' => $enseignant->date_recrutement,
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'ajout de l\'enseignant',
                'error' => 'Erreur lors de l\'ajout de l\'enseignant'
            ], 500);
        }
    }

    public function addEntreprise(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email|max:255',
            'denomination' => 'required|string|max:255',
        ], [
            'nom.required' => 'Le nom est requis',
            'nom.string' => 'Le nom doit être une chaîne de caractères',
            'nom.max' => 'Le nom ne doit pas dépasser 255 caractères',
            'email.required' => 'L\'email est requis',
            'email.email' => 'Format d\'email invalide',
            'email.unique' => 'Cette adresse email est déjà utilisée',
            'email.max' => 'L\'email ne doit pas dépasser 255 caractères',
            'denomination.required' => 'La dénomination est requise',
            'denomination.string' => 'La dénomination doit être une chaîne de caractères',
            'denomination.max' => 'La dénomination ne doit pas dépasser 255 caractères',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = new User();
            $user->name = $request->nom;
            $user->email = $request->email;
            $password = Str::random(12);
            $user->password = bcrypt($password);
            $user->role = 'entreprise';

            DB::beginTransaction();

            $user->save();

            $entreprise = new Entreprise();
            $entreprise->id = $user->id;
            $entreprise->denomination = $request->denomination;
            $entreprise->save();

            try {
                Mail::to($user->email)->send(
                    new NewAccountNotification($user->name, $user->email, $password, $user->role)
                );
            } catch (\Exception $e) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de l\'envoi de l\'email. Aucun entreprise n\'a été enregistré.',
                    'error' => 'Erreur lors de l\'envoi de l\'email'
                ], 500);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Entreprise ajoutée avec succès',
                'data' => [
                    'id' => $user->id,
                    'nom' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'denomination' => $entreprise->denomination
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'ajout de l\'entreprise',
                'error' => 'Erreur lors de l\'ajout de l\'entreprise'
            ], 500);
        }
    }

    public function updateEtudiant(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:users,id',
            'nom' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($request->id),
            ],
            'option' => ['required', Rule::in($this->getValidOptions())],
            'moyenne' => 'required|numeric|min:0|max:20',
        ], [
            'id.required' => 'L\'ID est requis',
            'id.exists' => 'Utilisateur introuvable',
            'nom.required' => 'Le nom est requis',
            'nom.string' => 'Le nom doit être une chaîne de caractères',
            'nom.max' => 'Le nom ne doit pas dépasser 255 caractères',
            'email.required' => 'L\'email est requis',
            'email.email' => 'Format d\'email invalide',
            'email.unique' => 'Cette adresse email est déjà utilisée',
            'email.max' => 'L\'email ne doit pas dépasser 255 caractères',
            'option.required' => 'L\'option est requise',
            'option.in' => 'Option invalide',
            'moyenne.required' => 'La moyenne est requise',
            'moyenne.numeric' => 'La moyenne doit être un nombre',
            'moyenne.min' => 'La moyenne doit être supérieure ou égale à 0',
            'moyenne.max' => 'La moyenne doit être inférieure ou égale à 20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::find($request->id);
            $etudiant = Etudiant::where('id', $request->id)->first();

            if (!$user || !$etudiant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Étudiant introuvable'
                ], 404);
            }

            $user->name = $request->nom;
            $user->email = $request->email;
            $etudiant->option = $request->option;
            $etudiant->moyenne = $request->moyenne;

            DB::beginTransaction();

            $user->save();
            $etudiant->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Étudiant modifié avec succès',
                'data' => [
                    'id' => $user->id,
                    'nom' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'option' => $etudiant->option,
                    'moyenne' => $etudiant->moyenne
                ]
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification de l\'étudiant',
                'error' => 'Erreur lors de la modification de l\'étudiant'
            ], 500);
        }
    }

    public function updateEnseignant(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:users,id',
            'nom' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($request->id),
            ],
            'grade' => ['required', Rule::in($this->gradeValues)],
            'date_recrutement' => 'required|date',
        ], [
            'id.required' => 'L\'ID est requis',
            'id.exists' => 'Utilisateur introuvable',
            'nom.required' => 'Le nom est requis',
            'nom.string' => 'Le nom doit être une chaîne de caractères',
            'nom.max' => 'Le nom ne doit pas dépasser 255 caractères',
            'email.required' => 'L\'email est requis',
            'email.email' => 'Format d\'email invalide',
            'email.unique' => 'Cette adresse email est déjà utilisée',
            'email.max' => 'L\'email ne doit pas dépasser 255 caractères',
            'grade.required' => 'Le grade est requis',
            'grade.in' => 'Grade invalide',
            'date_recrutement.required' => 'La date de recrutement est requise',
            'date_recrutement.date' => 'Format de date invalide',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::find($request->id);
            $enseignant = Enseignant::where('id', $request->id)->first();

            if (!$user || !$enseignant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Enseignant introuvable'
                ], 404);
            }

            $user->name = $request->nom;
            $user->email = $request->email;
            $enseignant->grade = $request->grade;
            $enseignant->date_recrutement = $request->date_recrutement;

            DB::beginTransaction();

            $user->save();
            $enseignant->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Enseignant modifié avec succès',
                'data' => [
                    'id' => $user->id,
                    'nom' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'grade' => $enseignant->grade,
                    'date_recrutement' => $enseignant->date_recrutement
                ]
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification de l\'enseignant',
                'error' => 'Erreur lors de la modification de l\'enseignant'
            ], 500);
        }
    }

    public function updateEntreprise(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|exists:users,id',
            'nom' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($request->id),
            ],
            'denomination' => 'required|string|max:255',
        ], [
            'id.required' => 'L\'ID est requis',
            'id.exists' => 'Utilisateur introuvable',
            'nom.required' => 'Le nom est requis',
            'nom.string' => 'Le nom doit être une chaîne de caractères',
            'nom.max' => 'Le nom ne doit pas dépasser 255 caractères',
            'email.required' => 'L\'email est requis',
            'email.email' => 'Format d\'email invalide',
            'email.unique' => 'Cette adresse email est déjà utilisée',
            'email.max' => 'L\'email ne doit pas dépasser 255 caractères',
            'denomination.required' => 'La dénomination est requise',
            'denomination.string' => 'La dénomination doit être une chaîne de caractères',
            'denomination.max' => 'La dénomination ne doit pas dépasser 255 caractères',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::find($request->id);
            $entreprise = Entreprise::where('id', $request->id)->first();

            if (!$user || !$entreprise) {
                return response()->json([
                    'success' => false,
                    'message' => 'Entreprise introuvable'
                ], 404);
            }

            $user->name = $request->nom;
            $user->email = $request->email;
            $entreprise->denomination = $request->denomination;

            DB::beginTransaction();

            $user->save();
            $entreprise->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Entreprise modifiée avec succès',
                'data' => [
                    'id' => $user->id,
                    'nom' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'denomination' => $entreprise->denomination
                ]
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification de l\'entreprise',
                'error' => 'Erreur lors de la modification de l\'entreprise'
            ], 500);
        }
    }
}
