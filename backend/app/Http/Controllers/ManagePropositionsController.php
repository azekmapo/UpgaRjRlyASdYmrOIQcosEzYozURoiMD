<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Entreprise;
use Illuminate\Support\Facades\DB;
use App\Models\Group;
use App\Models\PropositionEnseignant;
use App\Models\PropositionEtudiant;
use App\Models\PropositionEntreprise;
use App\Models\EmailValidationProposition;
use App\Models\Option;
use Illuminate\Support\Facades\Auth;

class ManagePropositionsController extends Controller
{
    private $user;
    private $option_responsable;

    public function __construct()
    {
        $this->user = Auth::user();
        $this->option_responsable = Option::where('id_responsable', $this->user->id)->value('nom');
    }

    public function getPropositionsEtudiants(Request $request)
    {
        try {
            $perPage = 10;
            $query = PropositionEtudiant::where(function ($q) {
                $q->where('option', $this->option_responsable)
                    ->orWhereRaw("split_part(option, '-', 1) = ?", [$this->option_responsable]);
            })->with(['group.student1.user', 'group.student2.user']);

            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('intitule', 'ILIKE', '%' . $searchTerm . '%')
                        ->orWhereHas('group.student1.user', function ($subQ) use ($searchTerm) {
                            $subQ->where('name', 'ILIKE', '%' . $searchTerm . '%');
                        })
                        ->orWhereHas('group.student2.user', function ($subQ) use ($searchTerm) {
                            $subQ->where('name', 'ILIKE', '%' . $searchTerm . '%');
                        });
                });
            }

            $result = $query->paginate($perPage);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Erreur lors de la récupération des propositions'], 500);
        }
    }

    public function getPropositionsEnseignants(Request $request)
    {
        try {
            $perPage = 10;
            $query = PropositionEnseignant::where(function ($q) {
                $q->where('option', $this->option_responsable)
                    ->orWhereRaw("split_part(option, '-', 1) = ?", [$this->option_responsable]);
            })->with(['encadrant', 'coEncadrant']);

            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('intitule', 'ILIKE', '%' . $searchTerm . '%')
                        ->orWhereHas('encadrant', function ($subQ) use ($searchTerm) {
                            $subQ->where('name', 'ILIKE', '%' . $searchTerm . '%');
                        })
                        ->orWhereHas('coEncadrant', function ($subQ) use ($searchTerm) {
                            $subQ->where('name', 'ILIKE', '%' . $searchTerm . '%');
                        });
                });
            }

            $result = $query->paginate($perPage);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Erreur lors de la récupération des propositions'], 500);
        }
    }

    public function getPropositionsEntreprises()
    {
        try {
            $result = PropositionEntreprise::where(function ($q) {
                $q->where('option', $this->option_responsable)
                    ->orWhereRaw("split_part(option, '-', 1) = ?", [$this->option_responsable]);
            })->with(['entreprise.entreprise'])->get();

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Erreur lors de la récupération des propositions'], 500);
        }
    }

    public function acceptPropositionEtudiant(Request $request)
    {
        try {
            $request->validate([
                'id' => 'required|integer',
                'id_group' => 'required|uuid',
                'remarks' => 'nullable|string'
            ]);

            $proposition = PropositionEtudiant::findOrFail($request->id);
            $group = Group::findOrFail($request->id_group);

            DB::beginTransaction();

            $proposition->update([
                'status' => 'accepted'
            ]);

            $student1 = $group->student1->user;
            $student2 = $group->student2?->user;

            EmailValidationProposition::create([
                'role' => 'etudiant',
                'name' => $student1->name,
                'email' => $student1->email,
                'name2' => $student2 ? $student2->name : null,
                'email2' => $student2 ? $student2->email : null,
                'intitule' => $proposition->intitule,
                'status' => 'accepted',
                'remarques' => $request->remarks ? $request->remarks : null,
                'option' => $proposition->option,
                'type' => $proposition->type_sujet,
                'resumer' => $proposition->resume,
                'technologies' => $proposition->technologies_utilisees,
                'besoins_materiels' => $proposition->besoins_materiels
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Proposition acceptée avec succès'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['error' => 'Erreur lors de l\'acceptation de la proposition'], 500);
        }
    }

    public function declinePropositionEtudiant(Request $request)
    {
        try {
            $request->validate([
                'id' => 'required|integer',
                'id_group' => 'required|uuid'
            ]);

            $proposition = PropositionEtudiant::findOrFail($request->id);
            $group = Group::findOrFail($proposition->id_group);

            DB::beginTransaction();

            $proposition->update(['status' => 'declined']);

            $student1 = $group->student1->user;
            $student2 = $group->student2?->user;

            EmailValidationProposition::create([
                'role' => 'etudiant',
                'name' => $student1->name,
                'email' => $student1->email,
                'name2' => $student2 ? $student2->name : null,
                'email2' => $student2 ? $student2->email : null,
                'intitule' => $proposition->intitule,
                'status' => 'declined',
                'remarques' => null,
                'option' => $proposition->option,
                'type' => $proposition->type_sujet,
                'resumer' => $proposition->resume,
                'technologies' => $proposition->technologies_utilisees,
                'besoins_materiels' => $proposition->besoins_materiels
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Proposition refusée avec succès'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['error' => 'Erreur lors du refus de la proposition'], 500);
        }
    }

    public function acceptPropositionEnseignant(Request $request)
    {
        try {
            $request->validate([
                'id' => 'required|integer',
                'encadrant_id' => 'required|uuid',
                'co_encadrant_id' => 'nullable|uuid',
                'remarks' => 'nullable|string'
            ]);

            $proposition = PropositionEnseignant::findOrFail($request->id);

            DB::beginTransaction();

            $proposition->update([
                'status' => 'accepted'
            ]);

            $encadrant = User::find($request->encadrant_id);
            $coEncadrant = $request->co_encadrant_id ? User::find($request->co_encadrant_id) : null;

            EmailValidationProposition::create([
                 'role' => 'enseignant',
                 'name' => $encadrant->name,
                 'email' => $encadrant->email,
                 'name2' => $coEncadrant ? $coEncadrant->name : null,
                 'email2' => $coEncadrant ? $coEncadrant->email : null,
                 'intitule' => $proposition->intitule,
                 'option' => $proposition->option,
                 'type' => $proposition->type_sujet,
                 'status' => 'accepted',
                 'remarques' => $request->remarks ? $request->remarks : null,
                 'resumer' => $proposition->resume,
                 'technologies' => $proposition->technologies_utilisees,
                 'besoins_materiels' => $proposition->besoins_materiels,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Proposition acceptée avec succès'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['error' => 'Erreur lors de l\'acceptation de la proposition'], 500);
        }
    }

    public function declinePropositionEnseignant(Request $request)
    {
        try {
            $request->validate([
                'id' => 'required|integer',
                'encadrant_id' => 'required|uuid',
                'co_encadrant_id' => 'nullable|uuid'
            ]);

            $proposition = PropositionEnseignant::findOrFail($request->id);

            DB::beginTransaction();

            $proposition->update(['status' => 'declined']);

            $encadrant = User::find($request->encadrant_id);
            $coEncadrant = $request->co_encadrant_id ? User::find($request->co_encadrant_id) : null;

            EmailValidationProposition::create([
                'role' => 'enseignant',
                'name' => $encadrant->name,
                'email' => $encadrant->email,
                'name2' => $coEncadrant ? $coEncadrant->name : null,
                'email2' => $coEncadrant ? $coEncadrant->email : null,
                'intitule' => $proposition->intitule,
                'option' => $proposition->option,
                'type' => $proposition->type_sujet,
                'status' => 'declined',
                'remarques' => null,
                'resumer' => $proposition->resume,
                'technologies' => $proposition->technologies_utilisees,
                'besoins_materiels' => $proposition->besoins_materiels,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Proposition refusée avec succès'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['error' => 'Erreur lors du refus de la proposition'], 500);
        }
    }

    public function acceptPropositionEntreprise(Request $request)
    {
        try {
            $request->validate([
                'id' => 'required|integer',
                'entreprise_id' => 'required|uuid',
                'remarks' => 'nullable|string'
            ]);

            $proposition = PropositionEntreprise::findOrFail($request->id);
            $user = User::findOrFail($request->entreprise_id);
            $entreprise = Entreprise::where('id', $request->entreprise_id)->first();

            DB::beginTransaction();

            $proposition->update([
                'status' => 'accepted',
            ]);

            $nomEntreprise = $user->name;

            EmailValidationProposition::create([
                'role' => 'entreprise',
                'name' => $nomEntreprise,
                'email' => $user->email,
                'denomination' => $entreprise->denomination,
                'intitule' => $proposition->intitule,
                'option' => $proposition->option,
                'status' => 'accepted',
                'remarques' => $request->remarks ? $request->remarks : null,
                'resumer' => $proposition->resume,
                'technologies' => $proposition->technologies_utilisees,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Proposition acceptée avec succès'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['error' => 'Erreur lors de l\'acceptation de la proposition'], 500);
        }
    }

    public function declinePropositionEntreprise(Request $request)
    {
        try {
            $request->validate([
                'id' => 'required|integer',
                'entreprise_id' => 'required|uuid'
            ]);

            $proposition = PropositionEntreprise::findOrFail($request->id);
            $user = User::findOrFail($request->entreprise_id);
            $entreprise = Entreprise::where('id', $request->entreprise_id)->first();

            DB::beginTransaction();

            $proposition->update(['status' => 'declined']);

            $nomEntreprise = $user->name;

            EmailValidationProposition::create([
                'role' => 'entreprise',
                'name' => $nomEntreprise,
                'email' => $user->email,
                'denomination' => $entreprise->denomination,
                'intitule' => $proposition->intitule,
                'option' => $proposition->option,
                'status' => 'declined',
                'remarques' => null,
                'resumer' => $proposition->resume,
                'technologies' => $proposition->technologies_utilisees,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Proposition refusée avec succès'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['error' => 'Erreur lors du refus de la proposition'], 500);
        }
    }
}
