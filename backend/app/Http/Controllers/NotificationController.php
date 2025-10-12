<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\SocketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use App\Models\PropositionEnseignant;
use App\Models\EmailValidationProposition;

class NotificationController extends Controller
{
    protected $socketService;

    public function __construct(SocketService $socketService)
    {
        $this->socketService = $socketService;
    }

    public function index($userId): JsonResponse
    {
        try {
            $user = User::find($userId);
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], Response::HTTP_NOT_FOUND);
            }

            $query = Notification::query();
            
            if ($user->role === 'entreprise') {
                $query->where('receiver_id', $user->id);
            } else {
                $query->where('receiver_id', $user->id);
            }
    
            $notifications = $query->with(['sender', 'receiver'])
                ->latest()
                ->get();
    
            return response()->json([
                'success' => true,
                'data' => $notifications,
                'message' => 'Notifications retrieved successfully'
            ], Response::HTTP_OK);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve notifications',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            Log::info('Store Notification Request', $request->all());
            $user = $request->user();
            
            if ($user->role === 'entreprise') {
                return response()->json([
                    'success' => false,
                    'message' => 'Companies are not authorized to create notifications',
                ], Response::HTTP_FORBIDDEN);
            }
            
            $validated = $request->validate([
                'sender_id' => ['required', 'string', 'exists:users,id'],
                'receiver_id' => ['required'],
                'title' => ['required', 'string', 'max:255'],
                'message' => ['required', 'string'],
                'type' => ['required', 'string'],
                'status' => ['required', 'string'],
            ]);

            DB::beginTransaction();

            $userQuery = User::query()->where('id', '!=', '');
            $notifications = [];
            $recipients = [];
            
            if (is_array($validated['receiver_id'])) {
                $specificUserIds = $validated['receiver_id'];
            } elseif (is_string($validated['receiver_id']) && strpos($validated['receiver_id'], ',') !== false) {
                $specificUserIds = explode(',', $validated['receiver_id']);
            } else {
                $specificUserIds = [];
            }
            
            if ($user->role === 'admin') {
                if ($validated['receiver_id'] === 'all') {
                    $recipients = User::select('id')->get()->pluck('id')->toArray(); 
                } elseif ($validated['receiver_id'] === 'etudiant') {
                    $recipients = User::where('role', 'etudiant')->select('id')->get()->pluck('id')->toArray();
                } elseif ($validated['receiver_id'] === 'enseignants') {
                    $recipients = User::where('role', 'enseignant')->select('id')->get()->pluck('id')->toArray(); 
                } elseif ($validated['receiver_id'] === 'entreprise') {
                    $recipients = User::where('role', 'entreprise')->select('id')->get()->pluck('id')->toArray(); 
                } elseif (!empty($specificUserIds)) {
                    $recipients = $specificUserIds;
                } else {
                    $recipients = [$validated['receiver_id']];
                }
            } elseif ($user->role === 'enseignant') {
                if ($validated['receiver_id'] === 'enseignant') {
                    $recipients = User::where('role', 'enseignant')->select('id')->get()->pluck('id')->toArray();
                } elseif (!empty($specificUserIds)) {
                    $teacherIds = User::whereIn('id', $specificUserIds)
                                          ->where('role', 'enseignant')
                                          ->select('id')
                                          ->get()
                                          ->pluck('id')
                                          ->toArray();
                    
                    if (count($teacherIds) !== count($specificUserIds)) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => 'enseignant can only send notifications to other enseignant',
                        ], Response::HTTP_FORBIDDEN);
                    }
                    
                    $recipients = $teacherIds;
                } else {
                    $recipient = User::find($validated['receiver_id']);
                    if (!$recipient || $recipient->role !== 'enseignant') {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => 'enseignant can only send notifications to other enseignant',
                        ], Response::HTTP_FORBIDDEN);
                    }
                    $recipients = [$validated['receiver_id']];
                }
            } elseif ($user->role === 'etudiant') {
                if ($validated['receiver_id'] === 'etudiant') {
                    $recipients = User::where('role', 'etudiant')->select('id')->get()->pluck('id')->toArray();
                } elseif (!empty($specificUserIds)) {
                    $studentIds = User::whereIn('id', $specificUserIds)
                                          ->where('role', 'etudiant')
                                          ->select('id')
                                          ->get()
                                          ->pluck('id')
                                          ->toArray();
                    
                    if (count($studentIds) !== count($specificUserIds)) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => 'etudiant can only send notifications to other etudiant',
                        ], Response::HTTP_FORBIDDEN);
                    }
                    
                    $recipients = $studentIds;
                } else {
                    $recipient = User::find($validated['receiver_id']);
                    if (!$recipient || $recipient->role !== 'etudiant') {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => 'etudiant can only send notifications to other etudiant',
                        ], Response::HTTP_FORBIDDEN);
                    }
                    $recipients = [$validated['receiver_id']];
                }
            }

            Log::info('Number of recipients: ' . count($recipients));

            foreach ($recipients as $recipientId) {
                $notification = Notification::create([
                    'sender_id' => $validated['sender_id'],
                    'receiver_id' => $recipientId,
                    'title' => $validated['title'],
                    'message' => $validated['message'],
                    'type' => $validated['type'],
                    'status' => $validated['status'],
                ]);
            
                $notifications[] = $notification;
                
                $notificationWithRelations = $notification->fresh(['sender', 'receiver']);
                
                try {
                    $this->socketService->emitNotification($recipientId, $notificationWithRelations);
                } catch (Exception $e) {
                    Log::error('Failed to emit notification via socket, but notification was saved', [
                        'error' => $e->getMessage(),
                        'notification_id' => $notification->id,
                        'recipient_id' => $recipientId
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Notifications created successfully',
                'data' => $notifications,
            ], Response::HTTP_CREATED);
        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create notifications',
                'error' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy($id, $userId): JsonResponse
    {
        try {
            $user = User::find($userId);
            
            if ($user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only administrators can delete notifications',
                ], Response::HTTP_FORBIDDEN);
            }
            
            DB::beginTransaction();
            
            Notification::find($id)->delete();
            
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Notification deleted successfully'
            ], Response::HTTP_OK);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete notification',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
    
    public function handlePropositionResponse(Request $request): JsonResponse
    {
        try {
            Log::info('Handling proposition response', $request->all());
            
            DB::beginTransaction();
            
            $validated = $request->validate([
                'notification_id' => ['required', 'string', 'exists:notifications,id'],
                'response' => ['required', 'string', 'in:accepted,declined'],
                'user_id' => ['required', 'string', 'exists:users,id'],
                'proposition_id' => ['required', 'string', 'exists:propositions_enseignant,id']
            ]);
            
            Log::info('Validated data:', $validated);
            
            $notification = Notification::where('id', $validated['notification_id'])
                ->where('receiver_id', $validated['user_id'])
                ->where('type', 'CO_SUPERVISION')
                ->first();
            
            if (!$notification) {
                Log::error('Notification not found or not authorized', [
                    'notification_id' => $validated['notification_id'],
                    'receiver_id' => $validated['user_id'],
                    'type' => 'CO_SUPERVISION'
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Notification not found or you are not authorized to respond',
                ], Response::HTTP_NOT_FOUND);
            }
            
            Log::info('Found notification', [
                'notification_id' => $notification->id,
                'sender_id' => $notification->sender_id,
                'receiver_id' => $notification->receiver_id
            ]);
            
            $notification->status = $validated['response'];
            $notification->save();
            
            $propositionEnseignant = PropositionEnseignant::find($validated['proposition_id']);
            
            if ($validated['response'] === 'accepted') {
                if ($propositionEnseignant) {
                    $propositionEnseignant->co_encadrant_id = $validated['user_id'];
                    $propositionEnseignant->save();
                    
                    Log::info('Updated proposition with co_encadrant_id', [
                        'proposition_id' => $propositionEnseignant->id,
                        'co_encadrant_id' => $validated['user_id']
                    ]);
                }
                
                $responseNotification = Notification::create([
                    'sender_id' => $validated['user_id'],
                    'receiver_id' => $notification->sender_id,
                    'title' => 'Co-supervision request accepted',
                    'message' => 'Your co-supervision request has been accepted',
                    'type' => 'SYSTEM',
                    'status' => 'accepted',
                    'proposition_id' => $validated['proposition_id']
                ]);
            } else {
                $responseNotification = Notification::create([
                    'sender_id' => $validated['user_id'],
                    'receiver_id' => $notification->sender_id,
                    'title' => 'Co-supervision request declined',
                    'message' => 'Your co-supervision request has been declined',
                    'type' => 'SYSTEM',
                    'status' => 'declined',
                    'proposition_id' => $validated['proposition_id']
                ]);
            }
            
            try {
                $notificationWithRelations = $notification->fresh(['sender', 'receiver']);
                $this->socketService->emitNotification($notification->receiver_id, $notificationWithRelations);
                
                $responseWithRelations = $responseNotification->fresh(['sender', 'receiver']);
                $this->socketService->emitNotification($notification->sender_id, $responseWithRelations);
                
                $updateData = [
                    'id' => $notification->id,
                    'proposition_id' => $validated['proposition_id'],
                    'status' => $validated['response'],
                    'type' => 'CO_SUPERVISION_UPDATE'
                ];
                $this->socketService->emitNotification($notification->sender_id, $updateData);
            } catch (Exception $e) {
                Log::error('Failed to emit notification update via socket', [
                    'error' => $e->getMessage(),
                    'notification_id' => $notification->id
                ]);
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => $validated['response'] === 'accepted' 
                    ? 'Proposition acceptée avec succès'
                    : 'Proposition refusée avec succès',
                'data' => $notification
            ]);
            
        } catch (ValidationException $e) {
            DB::rollBack();
            Log::error('Validation error in proposition response', [
                'errors' => $e->errors(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error handling proposition response', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to process proposition response',
                'error' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function getEmailValidation($id): JsonResponse
    {
    try {
        $emailValidation = EmailValidationProposition::find($id);
        
        if (!$emailValidation) {
            return response()->json([
                'success' => false,
                'message' => 'Validation email not found'
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'success' => true,
            'data' => $emailValidation,
            'message' => 'Email validation retrieved successfully'
        ], Response::HTTP_OK);
    } catch (Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Failed to retrieve email validation',
            'error' => 'error'
        ], Response::HTTP_INTERNAL_SERVER_ERROR);
    }
    }

    public function getEmailAutomation($id): JsonResponse
    {
    try {
        $emailAutomation = \App\Models\AutomationEmail::find($id);
        
        if (!$emailAutomation) {
            return response()->json([
                'success' => false,
                'message' => 'Email automation not found'
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'success' => true,
            'data' => $emailAutomation,
            'message' => 'Email automation retrieved successfully'
        ], Response::HTTP_OK);
    } catch (Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Failed to retrieve email automation',
            'error' => 'error'
        ], Response::HTTP_INTERNAL_SERVER_ERROR);
    }
    }
}