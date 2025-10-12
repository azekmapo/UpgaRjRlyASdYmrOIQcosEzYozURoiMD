<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

class AuthController extends Controller
{
    private function getProfilePictureBase64(User $user): ?string
{
    $extensions = ['jpg', 'jpeg', 'png', 'webp'];

    foreach ($extensions as $ext) {
        $filename = "{$user->id}.$ext";

        if (Storage::disk('profile_pictures')->exists($filename)) {
            try {
                $fileContent = Storage::disk('profile_pictures')->get($filename);

                if (empty($fileContent)) {
                    Log::error("❌ File content is empty for: $filename");
                    continue;
                }

                // Fallback MIME manually if Laravel returns null
                $mime = Storage::disk('profile_pictures')->mimeType($filename);
                if (!$mime) {
                    $mime = match($ext) {
                        'jpg', 'jpeg' => 'image/jpeg',
                        'png' => 'image/png',
                        'webp' => 'image/webp',
                        default => 'application/octet-stream'
                    };
                    Log::warning("⚠️ MIME type not auto-detected, using fallback: $mime");
                }

                $base64 = base64_encode($fileContent);
                return "data:$mime;base64,$base64";
            } catch (\Exception $e) {
                Log::error("❌ Error reading profile picture $filename: " . $e->getMessage());
            }
        }
    }

    return null;
}


    public function login(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required|min:8',
            ], [
                'email.required' => 'Nous avons besoin de votre adresse email !',
                'email.email' => 'Veuillez fournir une adresse email valide.',
                'password.required' => 'Veuillez définir un mot de passe.',
                'password.min' => 'Saisir au moins 8 caractères',
            ]);

            $credentials = [
                'email' => $request->email,
                'password' => $request->password
            ];

            // Verify credentials
            $user = User::where('email', $credentials['email'])->first();
            
            if (!$user || !Hash::check($credentials['password'], $user->password)) {
                throw ValidationException::withMessages([
                    'email' => ['Les informations d\'identification fournies sont incorrectes.'],
                ]);
            }
            
            // Delete all previous tokens for this user
            $user->tokens()->delete();
            
            // Create Sanctum authentication token
            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Connexion réussie',
                'token' => $token,
                'user' => [
                    'id' => (string) $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'email_verified_at' => $user->email_verified_at?->toISOString(),
                    'profile_picture' => $user->profile_picture,
                    'is_responsable' => $user->is_responsable ?? false,
                    'created_at' => $user->created_at->toISOString(),
                    'updated_at' => $user->updated_at->toISOString(),
                ],
            ], 200)
            ->header('X-Content-Type-Options', 'nosniff')
            ->header('X-Frame-Options', 'DENY')
            ->header('X-XSS-Protection', '1; mode=block');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('Login exception: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Login error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        // Revoke the current user's token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie'
        ], 200);
    }

    public function me(Request $request)
    {
        try {
            // Get authenticated user from Sanctum
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated.'
                ], 401);
            }
            
            // Load relationships
            $user->load('enseignant');

            // Get is_responsable status if user is an enseignant
            $isResponsable = false;
            if ($user->role === 'enseignant' && $user->enseignant) {
                $isResponsable = $user->enseignant->is_responsable ?? false;
            }

            return response()->json([
                'success' => true,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'profile_picture' => $user->profile_picture, // Uses User model accessor with signed URL
                    'is_responsable' => $isResponsable,
                ]
            ], 200);
        } catch (\Exception $e) {
            Log::error('Me endpoint error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Server error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Keep user method for backward compatibility
    public function user(Request $request)
    {
        return $this->me($request);
    }

    public function refresh(Request $request)
    {
        $user = $request->user();

        // Delete the current token
        $request->user()->currentAccessToken()->delete();

        // Create a new token
        $token = $user->createToken('auth-token')->plainTextToken;

        $profilePicture = null; // Temporarily disabled
        // $profilePicture = $this->getProfilePictureBase64($user);

        // Get is_responsable status if user is an enseignant
        $isResponsable = false;
        if ($user->role === 'enseignant' && $user->enseignant) {
            $isResponsable = $user->enseignant->is_responsable ?? false;
        }

        return response()->json([
            'success' => true,
            'message' => 'Token rafraîchi avec succès',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'profile_picture' => $profilePicture,
                'is_responsable' => $isResponsable,
            ],
            'token' => $token,
        ], 200);
    }
}
