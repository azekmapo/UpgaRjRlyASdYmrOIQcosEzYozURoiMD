<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\Notification;
use App\Models\User;
use App\Models\Etudiant;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Exception;

class GroupController extends Controller
{
    public function hasGroup($userId)
    {
        try {
            $hasGroup = Group::where(function($query) use ($userId) {
                $query->where('id_etd1', $userId)
                      ->orWhere('id_etd2', $userId);
            })
            ->whereNotNull('id_etd2')
            ->exists();

            return response()->json([
                'success' => true,
                'data' => $hasGroup
            ], Response::HTTP_OK);
        } catch (Exception $e) {
            Log::error('Error checking user group status:', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error checking group status',
                'data' => false
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function debugAvailableStudents()
    {
        try {
            $currentUser = Auth::user();
            
            if (!$currentUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'No authenticated user'
                ], Response::HTTP_UNAUTHORIZED);
            }
            
            $counts = DB::table('etudiants')
                ->selectRaw('
                    (SELECT COUNT(*) FROM etudiants) as students_count,
                    (SELECT COUNT(*) FROM groups) as groups_count,
                    (SELECT COUNT(*) FROM users) as users_count
                ')
                ->first();
            
            $currentUserDetails = [
                'id' => $currentUser->id,
                'role' => $currentUser->role,
                'name' => $currentUser->name ?? 'No name',
                'email' => $currentUser->email ?? 'No email'
            ];
            
            $students = Etudiant::select('id', 'option', 'moyenne', 'id as user_id')
                ->with('user:id,name')
                ->limit(5)
                ->get()
                ->map(function($student) {
                    return [
                        'id' => $student->id,
                        'option' => $student->option,
                        'moyenne' => $student->moyenne,
                        'has_user' => !is_null($student->user),
                        'user_name' => $student->user ? $student->user->name : 'No user'
                    ];
                });
            $groups = Group::select('id', 'id_etd1', 'id_etd2', 'moyenne', 'option')
                ->limit(5)
                ->get();
            
            $currentUserAsStudent = Etudiant::select('id', 'option', 'moyenne')
                ->where('id', $currentUser->id)
                ->first();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'current_user' => $currentUserDetails,
                    'current_user_is_student' => !is_null($currentUserAsStudent),
                    'current_student_details' => $currentUserAsStudent,
                    'counts' => [
                        'students' => $counts->students_count,
                        'groups' => $counts->groups_count,
                        'users' => $counts->users_count
                    ],
                    'sample_students' => $students,
                    'sample_groups' => $groups
                ]
            ], Response::HTTP_OK);
            
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Debug error: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function getAvailableStudents()
    {
        try {
            $currentUser = Auth::user();
            
            if (!$currentUser || $currentUser->role !== 'etudiant') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], Response::HTTP_UNAUTHORIZED);
            }

            $availableStudents = DB::select("
                SELECT 
                    e.id,
                    e.moyenne,
                    e.option,
                    u.name
                FROM etudiants e
                INNER JOIN users u ON e.id = u.id
                WHERE e.id != ? 
                AND e.id NOT IN (
                    SELECT DISTINCT COALESCE(g.id_etd1, g.id_etd2) 
                    FROM groups g 
                    WHERE g.id_etd2 IS NOT NULL 
                    AND (g.id_etd1 = e.id OR g.id_etd2 = e.id)
                )
            ", [$currentUser->id]);

            $studentsData = collect($availableStudents)->map(function ($student) {
                return [
                    'id_user' => $student->id,
                    'name' => $student->name,
                    'moyenne' => $student->moyenne,
                    'option' => $student->option,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $studentsData
            ], Response::HTTP_OK);

        } catch (Exception $e) {
            Log::error('Error fetching available students:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error fetching students: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function createGroupInvitation(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user || $user->role !== 'etudiant') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], Response::HTTP_UNAUTHORIZED);
            }

            $validated = $request->validate([
                'id_etd2' => 'required|string|exists:etudiants,id'
            ]);

            $existingGroupsCount = Group::where(function($query) use ($user, $validated) {
                $query->where('id_etd1', $user->id)
                      ->orWhere('id_etd2', $user->id)
                      ->orWhere('id_etd1', $validated['id_etd2'])
                      ->orWhere('id_etd2', $validated['id_etd2']);
            })
            ->whereNotNull('id_etd2')
            ->count();

            if ($existingGroupsCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Un des étudiants fait déjà partie d\'un groupe'
                ], Response::HTTP_BAD_REQUEST);
            }

            DB::beginTransaction();

            $students = Etudiant::select('id', 'moyenne', 'option')
                ->whereIn('id', [$user->id, $validated['id_etd2']])
                ->get()
                ->keyBy('id');

            $senderEtudiant = $students->get($user->id);
            $receiverEtudiant = $students->get($validated['id_etd2']);

            if (!$senderEtudiant || !$receiverEtudiant) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Student data not found'
                ], Response::HTTP_NOT_FOUND);
            }

            $averageMoyenne = ($senderEtudiant->moyenne + $receiverEtudiant->moyenne) / 2;
            // @Mohammed-Yacine-Henaoui bedel kima rak dayer logic ta3ek
            $groupOption = $senderEtudiant->option;
            if ($senderEtudiant->option !== $receiverEtudiant->option) {
                $groupOption = $senderEtudiant->option . '-' . $receiverEtudiant->option;
            }

            $group = Group::create([
                'id_etd1' => $user->id,
                'id_etd2' => null,
                'moyenne' => $averageMoyenne,
                'option' => $groupOption,
            ]);

            $groupId = $group->id;

            $notification = Notification::create([
                'sender_id' => $user->id,
                'receiver_id' => $validated['id_etd2'],
                'title' => 'Invitation de binôme',
                'message' => $user->name . ' vous invite à former un binôme',
                'type' => 'GROUP_INVITATION',
                'status' => 'pending',
                'group_id' => $groupId,
            ]);

            $notificationId = $notification->id;

            $notificationForSocket = (object) [
                'id' => $notificationId,
                'sender_id' => $user->id,
                'receiver_id' => $validated['id_etd2'],
                'title' => 'Invitation de binôme',
                'message' => $user->name . ' vous invite à former un binôme',
                'type' => 'GROUP_INVITATION',
                'status' => 'pending',
                'group_id' => $groupId,
                'created_at' => $notification->created_at,
            ];

            $formattedNotification = $this->formatNotificationForSocket($notificationForSocket);
            $this->emitToSocketServer($validated['id_etd2'], $formattedNotification);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Invitation envoyée avec succès',
                'data' => [
                    'group_id' => $groupId,
                    'notification_id' => $notificationId
                ]
            ], Response::HTTP_CREATED);

        } catch (Exception $e) {
            DB::rollBack();
            
            Log::error('Error creating group invitation:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi de l\'invitation'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function handleInviteGroupResponse(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user || $user->role !== 'etudiant') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], Response::HTTP_UNAUTHORIZED);
            }

            $validated = $request->validate([
                'group_id' => 'required|string|exists:groups,id',
                'id_etd2' => 'required|string',
                'response' => 'required|in:accepted,declined'
            ]);

            if ($validated['id_etd2'] !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized: You are not the intended receiver'
                ], Response::HTTP_FORBIDDEN);
            }

            DB::beginTransaction();

            $group = Group::select('id', 'id_etd1', 'id_etd2', 'moyenne', 'option')
                ->where('id', $validated['group_id'])
                ->first();

            $notification = Notification::select('id', 'sender_id', 'receiver_id', 'group_id')
                ->where('receiver_id', $user->id)
                ->where('group_id', $validated['group_id'])
                ->where('type', 'GROUP_INVITATION')
                ->where('status', 'pending')
                ->first();

            if (!$group || !$notification) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Groupe ou invitation non trouvé'
                ], Response::HTTP_NOT_FOUND);
            }

            if ($validated['response'] === 'accepted') {
                $students = Etudiant::select('id', 'option')
                    ->whereIn('id', [$group->id_etd1, $user->id])
                    ->get()
                    ->keyBy('id');

                $senderStudent = $students->get($group->id_etd1);
                $receiverStudent = $students->get($user->id);
                
                // @Mohammed-Yacine-Henaoui bedel kima rak dayer logic ta3ek
                $finalGroupOption = $senderStudent->option;
                if ($senderStudent->option !== $receiverStudent->option) {
                    $finalGroupOption = $senderStudent->option . '-' . $receiverStudent->option;
                }
                
                DB::table('groups')
                    ->where('id', $validated['group_id'])
                    ->update([
                        'id_etd2' => $user->id,
                        'option' => $finalGroupOption,
                        'updated_at' => now()
                    ]);
                
                DB::table('notifications')
                    ->where('id', $notification->id)
                    ->update(['status' => 'accepted', 'updated_at' => now()]);

                $responseNotification = Notification::create([
                    'sender_id' => $user->id,
                    'receiver_id' => $notification->sender_id,
                    'title' => 'Invitation de binôme acceptée',
                    'message' => 'Votre demande de binôme a été acceptée.',
                    'type' => 'GROUP_INVITATION',
                    'status' => 'accepted',
                    'group_id' => $validated['group_id'],
                ]);

                $responseNotificationForSocket = (object) [
                    'id' => $responseNotification->id,
                    'sender_id' => $user->id,
                    'receiver_id' => $notification->sender_id,
                    'message' => 'Votre demande de binôme a été acceptée.',
                    'type' => 'GROUP_INVITATION',
                    'status' => 'accepted',
                    'group_id' => $validated['group_id'],
                    'created_at' => $responseNotification->created_at,
                ];

                $formattedResponseNotification = $this->formatNotificationForSocket($responseNotificationForSocket);
                $this->emitToSocketServer($notification->sender_id, $formattedResponseNotification);

                $message = 'Invitation acceptée avec succès';
                $responseData = $group;
            } else {
                $responseNotification = Notification::create([
                    'sender_id' => $user->id,
                    'receiver_id' => $notification->sender_id,
                    'title' => 'Invitation de binôme déclinée',
                    'message' => 'Votre demande de binôme a été déclinée.',
                    'type' => 'GROUP_INVITATION',
                    'status' => 'declined',
                    'group_id' => null, 
                ]);

                DB::table('notifications')
                    ->where('id', $notification->id)
                    ->update(['status' => 'declined', 'updated_at' => now()]);
                
                DB::table('groups')
                    ->where('id', $validated['group_id'])
                    ->delete();

                $responseNotificationForSocket = (object) [
                    'id' => $responseNotification->id,
                    'sender_id' => $user->id,
                    'receiver_id' => $notification->sender_id,
                    'message' => 'Votre demande de binôme a été déclinée.',
                    'type' => 'GROUP_INVITATION',
                    'status' => 'declined',
                    'group_id' => null,
                    'created_at' => $responseNotification->created_at,
                ];

                $formattedResponseNotification = $this->formatNotificationForSocket($responseNotificationForSocket);
                $this->emitToSocketServer($notification->sender_id, $formattedResponseNotification);

                $message = 'Invitation déclinée';
                $responseData = null;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $responseData
            ], Response::HTTP_OK);

        } catch (Exception $e) {
            DB::rollBack();
            
            Log::error('Error handling group response:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du traitement de la réponse'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function cancelGroupInvitation(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user || $user->role !== 'etudiant') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], Response::HTTP_UNAUTHORIZED);
            }

            $validated = $request->validate([
                'notification_id' => 'required|string|exists:notifications,id'
            ]);

            DB::beginTransaction();

            $notification = Notification::select('id', 'sender_id', 'group_id')
                ->where('id', $validated['notification_id'])
                ->where('sender_id', $user->id)
                ->where('type', 'GROUP_INVITATION')
                ->where('status', 'pending')
                ->first();

            if (!$notification) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Invitation non trouvée'
                ], Response::HTTP_NOT_FOUND);
            }

            if ($notification->group_id) {
                DB::table('groups')->where('id', $notification->group_id)->delete();
            }
            
            DB::table('notifications')->where('id', $notification->id)->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Invitation annulée avec succès'
            ], Response::HTTP_OK);

        } catch (Exception $e) {
            DB::rollBack();
            
            Log::error('Error canceling group invitation:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'annulation de l\'invitation'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function getUserGroupInfo(Request $request)
    {
        try {
            $validated = $request->validate([
                'user_id' => 'nullable|string|exists:etudiants,id'
            ]);

            $targetUserId = $validated['user_id'] ?? $request->user()->id;

            if ($targetUserId !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only access your own group information'
                ], Response::HTTP_FORBIDDEN);
            }

            $groupInfo = DB::table('groups as g')
                ->select([
                    'g.id',
                    'g.id_etd1',
                    'g.id_etd2',
                    'g.moyenne',
                    'g.option',
                    'u1.name as student1_name',
                    'u2.name as student2_name'
                ])
                ->join('users as u1', 'g.id_etd1', '=', 'u1.id')
                ->join('users as u2', 'g.id_etd2', '=', 'u2.id')
                ->where(function($query) use ($targetUserId) {
                    $query->where('g.id_etd1', $targetUserId)
                          ->orWhere('g.id_etd2', $targetUserId);
                })
                ->whereNotNull('g.id_etd2')
                ->first();

            if (!$groupInfo) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'hasGroup' => false,
                        'binomeName' => null,
                        'group' => null
                    ]
                ], Response::HTTP_OK);
            }

            $partnerId = ($groupInfo->id_etd1 === $targetUserId) ? $groupInfo->id_etd2 : $groupInfo->id_etd1;
            $partnerName = ($groupInfo->id_etd1 === $targetUserId) ? $groupInfo->student2_name : $groupInfo->student1_name;
            
            return response()->json([
                'success' => true,
                'data' => [
                    'hasGroup' => true,
                    'binomeName' => $partnerName,
                    'group' => [
                        'id' => $groupInfo->id,
                        'id_etd1' => $groupInfo->id_etd1,
                        'id_etd2' => $groupInfo->id_etd2,
                        'moyenne' => $groupInfo->moyenne,
                        'option' => $groupInfo->option,
                    ],
                    'partnerId' => $partnerId
                ]
            ], Response::HTTP_OK);

        } catch (Exception $e) {
            Log::error('Error getting user group info:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error fetching group information'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function getPendingInvitations(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user || $user->role !== 'etudiant') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], Response::HTTP_UNAUTHORIZED);
            }

            $pendingNotifications = Notification::select('sender_id', 'receiver_id')
                ->where('type', 'GROUP_INVITATION')
                ->where('status', 'pending')
                ->where(function($query) use ($user) {
                    $query->where('sender_id', $user->id)
                          ->orWhere('receiver_id', $user->id);
                })
                ->get();

            $pendingUserIds = [];
            
            foreach ($pendingNotifications as $notification) {
                if ($notification->sender_id === $user->id) {
                    $pendingUserIds[] = $notification->receiver_id;
                } else {
                    $pendingUserIds[] = $notification->sender_id;
                }
            }

            return response()->json([
                'success' => true,
                'data' => array_unique($pendingUserIds)
            ], Response::HTTP_OK);

        } catch (Exception $e) {
            Log::error('Error getting pending invitations:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error fetching pending invitations'
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
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
                Log::error('Failed to emit group notification: ' . $response->body());
            }
        } catch (\Exception $e) {
            Log::error('Socket server error in group: ' . $e->getMessage());
        }
    }

    private function formatNotificationForSocket($notification)
    {
        $userNames = User::select('id', 'name')
            ->whereIn('id', [$notification->sender_id, $notification->receiver_id])
            ->get()
            ->keyBy('id');

        $sender = $userNames->get($notification->sender_id);
        $receiver = $userNames->get($notification->receiver_id);

        return [
            'id' => $notification->id,
            'sender_id' => $notification->sender_id,
            'receiver_id' => $notification->receiver_id,
            'sender_name' => $sender ? $sender->name : 'Unknown',
            'receiver_name' => $receiver ? $receiver->name : 'Unknown',
            'status' => $notification->status,
            'created_at' => $notification->created_at,
            'formatted_message' => $notification->message,
            'type' => $notification->type,
            'group_id' => $notification->group_id
        ];
    }
}