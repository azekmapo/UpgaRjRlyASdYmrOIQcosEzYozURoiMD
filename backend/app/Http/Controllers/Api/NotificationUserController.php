<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Exception;
use Illuminate\Support\Facades\Log;

class NotificationUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $startTime = microtime(true);
            
            if (!Auth::check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], Response::HTTP_UNAUTHORIZED);
            }

            $user = $request->user();
            $allowedRoles = ['admin', 'enseignant', 'etudiant'];
            
            if (!in_array($user->role, $allowedRoles)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not authorized to access this resource',
                ], Response::HTTP_FORBIDDEN);
            }

            $role = $request->input('role');
            
            $cacheKey = "users_all_{$user->role}_" . ($role ?? 'all');
            
            $cachedData = Cache::get($cacheKey);
            
            if ($cachedData && !$request->has('_t')) {
                Log::info("Serving users from cache: {$cacheKey}");
                return response()->json($cachedData, Response::HTTP_OK);
            }
            
            $query = User::query()->select(['id', 'name', 'email', 'role']);
            
            if ($role && $role !== 'all') {
                $query->where('role', $role);
            }
            
            if ($user->role === 'enseignant') {
                $query->where('role', 'enseignant');
            } elseif ($user->role === 'etudiant') {
                $query->where('role', 'etudiant');
            }
            
            $users = $query->orderBy('name')->get();
            
            $responseData = [
                'success' => true,
                'data' => $users,
                'message' => 'All users retrieved successfully'
            ];
            
            Cache::put($cacheKey, $responseData, now()->addMinutes(5));
            
            $endTime = microtime(true);
            $executionTime = ($endTime - $startTime) * 1000; 
            $userCount = count($users);
            Log::info("All {$userCount} users retrieved for {$user->role}, execution time: {$executionTime}ms");
            
            return response()->json($responseData, Response::HTTP_OK);
        } catch (Exception $e) {
            Log::error('Error fetching users:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve users',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
