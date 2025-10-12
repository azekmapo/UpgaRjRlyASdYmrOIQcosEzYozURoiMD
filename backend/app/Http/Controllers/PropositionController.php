<?php

namespace App\Http\Controllers;

use App\Models\Enseignant;
use App\Models\Notification;
use App\Models\PropositionEnseignant;
use App\Models\PropositionEtudiant;
use App\Models\PropositionEntreprise;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Exception;

class PropositionController extends Controller
{
    public function index()
    {
        $user = Auth::user(); 
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], Response::HTTP_UNAUTHORIZED);
        }

        switch ($user->role) {
            case 'etudiant':
                $group = $user->etudiant->group;

                if (!$group) {
                    return response()->json([
                        'success' => false,
                        'message' => "Vous devez être membre d'un groupe pour proposer un PFE."
                    ], Response::HTTP_BAD_REQUEST);
                }

                $existingProposition = PropositionEtudiant::where('id_group', $group->id)
                    ->latest()
                    ->first();
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'existingProposition' => $existingProposition
                    ]
                ], Response::HTTP_OK);

            case 'entreprise':
                $propositions = PropositionEntreprise::where('entreprise_id', $user->id)
                    ->latest()
                    ->get();
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'propositions' => $propositions
                    ]
                ], Response::HTTP_OK);

            case 'enseignant':
                $propositions = PropositionEnseignant::where('encadrant_id', $user->id)
                    ->latest()
                    ->get();
                    
                $enseignants = Enseignant::select('enseignants.*')
                    ->join('users', 'users.id', '=', 'enseignants.id')
                    ->addSelect('users.name')
                    ->get();
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'propositions' => $propositions,
                        'enseignants' => $enseignants
                    ]
                ], Response::HTTP_OK);

            default:
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to Proposition'
                ], Response::HTTP_FORBIDDEN);
        }
    }

    private function emitToSocketServer($userId, $notification)
    {
        try {
            $socketUrl = config('services.socket.server_url', 'http://notifications-server:3001');
            $response = Http::post($socketUrl . '/emit-notification', [
                'userId' => $userId,
                'notification' => $notification
            ]);

            if (!$response->successful()) {
                Log::error('Failed to emit proposition notification: ' . $response->body());
            }
        } catch (\Exception $e) {
            Log::error('Socket server error in proposition: ' . $e->getMessage());
        }
    }

    private function formatNotificationForSocket($notification, $proposition)
    {
        $sender = User::find($notification->sender_id);
        $receiver = User::find($notification->receiver_id);

        return [
            'id' => $notification->id,
            'sender_id' => $notification->sender_id,
            'receiver_id' => $notification->receiver_id,
            'sender_name' => $sender->name,
            'receiver_name' => $receiver->name,
            'status' => $notification->status,
            'created_at' => $notification->created_at,
            'formatted_message' => $sender->name . ' vous invite à devenir co-encadrant du projet: ' . $proposition->intitule,
            'type' => 'CO_SUPERVISION',
            'proposition_id' => $proposition->id
        ];
    }

    public function storeEnseignantProposition(Request $request)
    {
        try {
            Log::info('Proposition submission request data:', $request->all());
            
            $user = Auth::user();
            Log::info('Authenticated user:', ['id' => $user?->id, 'role' => $user?->role]);
            
            if (!$user || $user->role !== 'enseignant') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], Response::HTTP_UNAUTHORIZED);
            }
            
            $validated = $request->validate([
                'intitule' => 'required|string|max:255',
                'type_sujet' => 'required|string|max:50',
                'option' => 'required|string|max:50',
                'resume' => 'required|string',
                'technologies_utilisees' => 'nullable|string',
                'besoins_materiels' => 'nullable|string',
                'co_encadrant_id' => 'nullable|string', 
                'status' => 'nullable|string',
            ]);
            
            Log::info('Validated data:', $validated);
            
            DB::beginTransaction();
            
            $proposition = new PropositionEnseignant();
            $proposition->fill($validated);
            $proposition->encadrant_id = $user->id;
            $proposition->status = 'pending';
            $proposition->co_encadrant_id = null;
            $proposition->save();
            
            Log::info('Proposition created:', ['id' => $proposition->id]);
            
            if (!empty($validated['co_encadrant_id'])) {
                $coEncadrantUser = User::find($validated['co_encadrant_id']);
                Log::info('Co-encadrant user:', ['id' => $coEncadrantUser?->id, 'role' => $coEncadrantUser?->role]);

                if ($coEncadrantUser && $coEncadrantUser->role === 'enseignant') {
                    $notification = Notification::create([
                        'sender_id' => $user->id,
                        'receiver_id' => $coEncadrantUser->id,
                        'title' => 'Proposition de co-encadrant',
                        'message' => 'Vous avez été invité à devenir co-encadrant du projet: ' . $proposition->intitule,
                        'type' => 'CO_SUPERVISION',
                        'status' => 'pending',
                        'proposition_id' => $proposition->id,
                        "created_at" => now(),
                        "updated_at" => now(),
                    ]);
                    Log::info('Notification created:', ['id' => $notification->id]);

                    $formattedNotification = $this->formatNotificationForSocket($notification, $proposition);
                    $this->emitToSocketServer($coEncadrantUser->id, $formattedNotification);
                }
            }
            DB::commit();
            Log::info('Transaction committed successfully');

            return response()->json([
                'success' => true,
                'message' => 'Proposition submitted successfully',
                'data' => $proposition
            ], Response::HTTP_CREATED);
        } catch (ValidationException $e) {
            DB::rollBack();
            Log::error('Validation error:', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (Exception $e) {
            DB::rollBack();
            // Log the detailed error
            Log::error('PropositionController@storeEnseignantProposition exception:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Server error occurred. Please try again later.',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function storeEtudiantProposition(Request $request)
{
    $user = Auth::user();
    if (!$user || $user->role !== 'etudiant') {
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized access'
        ], Response::HTTP_UNAUTHORIZED);
    }
    
    $group = $user->etudiant->group;

    if (!$group) {
        return response()->json([
            'success' => false,
            'message' => "Vous devez être membre d'un groupe pour proposer un PFE."
        ], Response::HTTP_BAD_REQUEST);
    }

    $existingProposition = PropositionEtudiant::where('id_group', $group->id)
        ->latest()
        ->first();

    $propositionData = [
        'id_group' => $group->id,
        'intitule' => $request->intitule,
        'type_sujet' => $request->type_sujet,
        'option' => $user->etudiant->option, // Fetched from etudiants table
        'resume' => $request->resume,
        'technologies_utilisees' => $request->technologies,
        'besoins_materiels' => $request->besoins,
    ];

    if ($existingProposition) {
        $existingProposition->update($propositionData);
        $message = 'Proposition de groupe mise à jour avec succès';
        $proposition = $existingProposition;
    } else {
        $propositionData['status'] = 'pending';
        $proposition = PropositionEtudiant::create($propositionData);
        $message = 'Proposition de groupe soumise avec succès';
    }

    return response()->json([
        'success' => true,
        'message' => $message,
        'data' => $proposition
    ], Response::HTTP_OK);
}

    public function storeEntrepriseProposition(Request $request)
    {
        $user = Auth::user();
        
        if (!$user || $user->role !== 'entreprise') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], Response::HTTP_UNAUTHORIZED);
        }

        $proposition = PropositionEntreprise::create([
            'entreprise_id' => $user->id,
            'intitule' => $request->intitule,
            'type_sujet' => $request->type_sujet,
            'option' => $request->option,
            'resume' => $request->resume,
            'status' => 'pending'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Proposition submitted successfully',
            'data' => $proposition
        ], Response::HTTP_CREATED);
    }
    
    public function getEnseignantPropositions(Request $request)
    {
        $user = Auth::user();

        $page = $request->query('page', 1);
        $limit = $request->query('limit', 10);
        
        if (!$user || $user->role !== 'enseignant') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], Response::HTTP_UNAUTHORIZED);
        }
        
        $propositions = PropositionEnseignant::where('encadrant_id', $request->user()->id)
            ->latest()
            ->paginate($limit, ['*'], 'page', $page);
            
        return response()->json([
            'success' => true,
            'data' => $propositions
        ], Response::HTTP_OK);
    }

    public function updateEntrepriseProposition(Request $request, $id)
    {
        try {
            $user = Auth::user();

            if (!$user || $user->role !== 'entreprise') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], Response::HTTP_UNAUTHORIZED);
            }

            // Find the proposition and ensure it belongs to the authenticated user
            $proposition = PropositionEntreprise::where('id', $id)
                ->where('entreprise_id', $user->id)
                ->first();

            if (!$proposition) {
                return response()->json([
                    'success' => false,
                    'message' => 'Proposition not found or access denied'
                ], Response::HTTP_NOT_FOUND);
            }

            // Validate the request data
            $validated = $request->validate([
                'intitule' => 'required|string|max:255',
                'option' => 'required|string|max:50',
                'resume' => 'required|string',
                'technologies_utilisees' => 'nullable|string',
                'besoins_materiels' => 'nullable|string',
            ]);

            // Update the proposition
            $proposition->update([
                'intitule' => $validated['intitule'],
                'option' => $validated['option'],
                'resume' => $validated['resume'],
                'technologies_utilisees' => $validated['technologies_utilisees'] ?? null,
                'besoins_materiels' => $validated['besoins_materiels'] ?? null,
            ]);

            Log::info('Entreprise proposition updated:', [
                'proposition_id' => $proposition->id,
                'entreprise_id' => $user->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Proposition updated successfully',
                'data' => $proposition
            ], Response::HTTP_OK);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (Exception $e) {
            Log::error('Error updating entreprise proposition:', [
                'error' => $e->getMessage(),
                'proposition_id' => $id,
                'entreprise_id' => $user->id ?? null
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Server error occurred. Please try again later.',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete an entreprise proposition
     */
    public function deleteEntrepriseProposition($id)
    {
        try {
            $user = Auth::user();

            if (!$user || $user->role !== 'entreprise') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], Response::HTTP_UNAUTHORIZED);
            }

            // Find the proposition and ensure it belongs to the authenticated user
            $proposition = PropositionEntreprise::where('id', $id)
                ->where('entreprise_id', $user->id)
                ->first();

            if (!$proposition) {
                return response()->json([
                    'success' => false,
                    'message' => 'Proposition not found or access denied'
                ], Response::HTTP_NOT_FOUND);
            }

            // Store proposition details for logging before deletion
            $propositionTitle = $proposition->intitule;

            // Delete the proposition
            $proposition->delete();

            Log::info('Entreprise proposition deleted:', [
                'proposition_id' => $id,
                'proposition_title' => $propositionTitle,
                'entreprise_id' => $user->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Proposition deleted successfully'
            ], Response::HTTP_OK);
        } catch (Exception $e) {
            Log::error('Error deleting entreprise proposition:', [
                'error' => $e->getMessage(),
                'proposition_id' => $id,
                'entreprise_id' => $user->id ?? null
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Server error occurred. Please try again later.',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
        
    public function getAllEnseignants()
    {
        $enseignants = Enseignant::join('users', 'users.id', '=', 'enseignants.id')
            ->select('enseignants.id', 'users.name', 'users.email', 'enseignants.grade')
            ->get();
        
        Log::info('Retrieved enseignants for dropdown:', ['count' => count($enseignants)]);
            

        return response()->json([
            'success' => true,
            'data' => $enseignants
        ], Response::HTTP_OK);
    }

    /**
     * Update an etudiant proposition
     */
    public function updateEtudiantProposition(Request $request, $id)
    {
        try {
            $user = Auth::user();

            if (!$user || $user->role !== 'etudiant') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], Response::HTTP_UNAUTHORIZED);
            }

            $group = $user->etudiant->group;

            if (!$group) {
                return response()->json([
                    'success' => false,
                    'message' => "Vous devez être membre d'un groupe pour modifier une proposition."
                ], Response::HTTP_BAD_REQUEST);
            }

            // Find the proposition and ensure it belongs to the user's group
            $proposition = PropositionEtudiant::where('id', $id)
                ->where('id_group', $group->id)
                ->first();

            if (!$proposition) {
                return response()->json([
                    'success' => false,
                    'message' => 'Proposition not found or access denied'
                ], Response::HTTP_NOT_FOUND);
            }

            // Validate the request data
            $validated = $request->validate([
                'intitule' => 'required|string|max:255',
                'type_sujet' => 'required|string|max:50',
                'option' => 'required|string|max:50',
                'resume' => 'required|string',
                'technologies_utilisees' => 'nullable|string',
                'besoins_materiels' => 'nullable|string',
            ]);

            // Update the proposition
            $proposition->update([
                'intitule' => $validated['intitule'],
                'type_sujet' => $validated['type_sujet'],
                'option' => $validated['option'],
                'resume' => $validated['resume'],
                'technologies_utilisees' => $validated['technologies_utilisees'] ?? null,
                'besoins_materiels' => $validated['besoins_materiels'] ?? null,
            ]);

            Log::info('Etudiant proposition updated:', [
                'proposition_id' => $proposition->id,
                'group_id' => $group->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Proposition updated successfully',
                'data' => $proposition
            ], Response::HTTP_OK);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (Exception $e) {
            Log::error('Error updating etudiant proposition:', [
                'error' => $e->getMessage(),
                'proposition_id' => $id,
                'user_id' => $user->id ?? null
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Server error occurred. Please try again later.',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete an etudiant proposition
     */
    public function deleteEtudiantProposition($id)
    {
        try {
            $user = Auth::user();

            if (!$user || $user->role !== 'etudiant') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], Response::HTTP_UNAUTHORIZED);
            }

            $group = $user->etudiant->group;

            if (!$group) {
                return response()->json([
                    'success' => false,
                    'message' => "Vous devez être membre d'un groupe pour supprimer une proposition."
                ], Response::HTTP_BAD_REQUEST);
            }

            // Find the proposition and ensure it belongs to the user's group
            $proposition = PropositionEtudiant::where('id', $id)
                ->where('id_group', $group->id)
                ->first();

            if (!$proposition) {
                return response()->json([
                    'success' => false,
                    'message' => 'Proposition not found or access denied'
                ], Response::HTTP_NOT_FOUND);
            }

            // Store proposition details for logging before deletion
            $propositionTitle = $proposition->intitule;

            // Delete the proposition
            $proposition->delete();

            Log::info('Etudiant proposition deleted:', [
                'proposition_id' => $id,
                'proposition_title' => $propositionTitle,
                'group_id' => $group->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Proposition deleted successfully'
            ], Response::HTTP_OK);
        } catch (Exception $e) {
            Log::error('Error deleting etudiant proposition:', [
                'error' => $e->getMessage(),
                'proposition_id' => $id,
                'user_id' => $user->id ?? null
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Server error occurred. Please try again later.',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update an enseignant proposition
     */
    public function updateEnseignantProposition(Request $request, $id)
    {
        try {
            $user = Auth::user();

            if (!$user || $user->role !== 'enseignant') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], Response::HTTP_UNAUTHORIZED);
            }

            // Find the proposition and ensure it belongs to the authenticated user
            $proposition = PropositionEnseignant::where('id', $id)
                ->where('encadrant_id', $user->id)
                ->first();

            if (!$proposition) {
                return response()->json([
                    'success' => false,
                    'message' => 'Proposition not found or access denied'
                ], Response::HTTP_NOT_FOUND);
            }

            // Validate the request data
            $validated = $request->validate([
                'intitule' => 'required|string|max:255',
                'type_sujet' => 'required|string|max:50',
                'option' => 'required|string|max:50',
                'resume' => 'required|string',
                'technologies_utilisees' => 'nullable|string',
                'besoins_materiels' => 'nullable|string',
                'co_encadrant_id' => 'nullable|string',
            ]);

            DB::beginTransaction();

            // Update the proposition
            $proposition->update([
                'intitule' => $validated['intitule'],
                'type_sujet' => $validated['type_sujet'],
                'option' => $validated['option'],
                'resume' => $validated['resume'],
                'technologies_utilisees' => $validated['technologies_utilisees'] ?? null,
                'besoins_materiels' => $validated['besoins_materiels'] ?? null,
            ]);

            // Handle co-encadrant update if changed
            if (isset($validated['co_encadrant_id']) && $validated['co_encadrant_id'] !== $proposition->co_encadrant_id) {
                if (!empty($validated['co_encadrant_id'])) {
                    $coEncadrantUser = User::find($validated['co_encadrant_id']);

                    if ($coEncadrantUser && $coEncadrantUser->role === 'enseignant') {
                        // Cancel previous notification if exists
                        if ($proposition->co_encadrant_id) {
                            Notification::where('proposition_id', $proposition->id)
                                ->where('type', 'CO_SUPERVISION')
                                ->where('status', 'pending')
                                ->update(['status' => 'cancelled']);
                        }

                        // Create new notification
                        $notification = Notification::create([
                            'sender_id' => $user->id,
                            'receiver_id' => $coEncadrantUser->id,
                            'title' => 'Proposition de co-encadrant',
                            'message' => 'Vous avez été invité à devenir co-encadrant du projet: ' . $proposition->intitule,
                            'type' => 'CO_SUPERVISION',
                            'status' => 'pending',
                            'proposition_id' => $proposition->id,
                            "created_at" => now(),
                            "updated_at" => now(),
                        ]);

                        $formattedNotification = $this->formatNotificationForSocket($notification, $proposition);
                        $this->emitToSocketServer($coEncadrantUser->id, $formattedNotification);
                    }
                }
            }

            DB::commit();

            Log::info('Enseignant proposition updated:', [
                'proposition_id' => $proposition->id,
                'encadrant_id' => $user->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Proposition updated successfully',
                'data' => $proposition
            ], Response::HTTP_OK);
        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error updating enseignant proposition:', [
                'error' => $e->getMessage(),
                'proposition_id' => $id,
                'encadrant_id' => $user->id ?? null
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Server error occurred. Please try again later.',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete an enseignant proposition
     */
    public function deleteEnseignantProposition($id)
    {
        try {
            $user = Auth::user();

            if (!$user || $user->role !== 'enseignant') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], Response::HTTP_UNAUTHORIZED);
            }

            // Find the proposition and ensure it belongs to the authenticated user
            $proposition = PropositionEnseignant::where('id', $id)
                ->where('encadrant_id', $user->id)
                ->first();

            if (!$proposition) {
                return response()->json([
                    'success' => false,
                    'message' => 'Proposition not found or access denied'
                ], Response::HTTP_NOT_FOUND);
            }

            DB::beginTransaction();

            // Store proposition details for logging before deletion
            $propositionTitle = $proposition->intitule;

            // Cancel any pending co-supervision notifications
            Notification::where('proposition_id', $proposition->id)
                ->where('type', 'CO_SUPERVISION')
                ->where('status', 'pending')
                ->update(['status' => 'cancelled']);

            // Delete the proposition
            $proposition->delete();

            DB::commit();

            Log::info('Enseignant proposition deleted:', [
                'proposition_id' => $id,
                'proposition_title' => $propositionTitle,
                'encadrant_id' => $user->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Proposition deleted successfully'
            ], Response::HTTP_OK);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error deleting enseignant proposition:', [
                'error' => $e->getMessage(),
                'proposition_id' => $id,
                'encadrant_id' => $user->id ?? null
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Server error occurred. Please try again later.',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}