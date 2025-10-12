<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProfileController extends Controller
{
    private $profilePicturesPath;

    public function __construct()
    {
        $this->profilePicturesPath = storage_path('app/private/profile-pictures');

        // Create directory if it doesn't exist
        if (!is_dir($this->profilePicturesPath)) {
            mkdir($this->profilePicturesPath, 0755, true);
        }
    }

    public function getProfileEtudiant(): JsonResponse
    {
        try {
            $user = Auth::user();
            $etudiant = $user->etudiant;

            if (!$etudiant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Profil étudiant non trouvé'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'nom' => $user->name,
                    'role' => $user->role,
                    'option' => $etudiant->option,
                    'moyenne' => $etudiant->moyenne,
                    'email' => $user->email,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du profil'
            ], 500);
        }
    }

    public function getProfileEnseignant(): JsonResponse
    {
        try {
            $user = Auth::user();
            $enseignant = $user->enseignant;

            if (!$enseignant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Profil enseignant non trouvé'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'nom' => $user->name,
                    'role' => $user->role,
                    'grade' => $enseignant->grade,
                    'date_recrutement' => $enseignant->date_recrutement,
                    'is_responsable' => $enseignant->is_responsable,
                    'email' => $user->email,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du profil'
            ], 500);
        }
    }

    public function getProfileEntreprise(): JsonResponse
    {
        try {
            $user = Auth::user();
            $entreprise = $user->entreprise;

            if (!$entreprise) {
                return response()->json([
                    'success' => false,
                    'message' => 'Profil entreprise non trouvé'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'nom' => $user->name,
                    'denomination' => $entreprise->denomination,
                    'email' => $user->email,
                    'role' => $user->role,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du profil'
            ], 500);
        }
    }

    public function getProfileAdmin(): JsonResponse
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Profil admin non trouvé'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'nom' => $user->name,
                    'role' => $user->role,
                    'email' => $user->email,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du profil'
            ], 500);
        }
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'oldPassword' => 'required|min:8',
            'newPassword' => 'required|min:8',
            'confirmNewPassword' => 'required|same:newPassword|min:8',
        ], [
            'newPassword.required' => 'Le nouveau mot de passe est obligatoire.',
            'confirmNewPassword.required' => 'La confirmation du nouveau mot de passe est obligatoire.',
            'newPassword.min' => 'Saisir au moins 8 caractères',
            'confirmNewPassword.min' => 'Saisir au moins 8 caractères',
            'confirmNewPassword.same' => 'Les mots de passe ne sont pas identiques',
            'oldPassword.required' => 'Le mot de passe actuel est obligatoire.',
            'oldPassword.min' => 'Saisir au moins 8 caractères',
        ]);

        try {
            $user1 = Auth::user();

            if (!password_verify($request->oldPassword, $user1->password)) {
                return response()->json([
                    'success' => false,
                    'message' => "Tu n'as pas entré le bon mot de passe actuel."
                ], 422);
            }

            $user = User::where('email', $user1->email)->first();
            $user->update(['password' => bcrypt($request->newPassword)]);

            return response()->json([
                'success' => true,
                'message' => 'Votre mot de passe est changé avec succès.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du changement de mot de passe'
            ], 500);
        }
    }

    public function uploadProfilePicture(Request $request): JsonResponse
    {
        \Log::info('[Upload] Request received', [
            'user_id' => Auth::id(),
            'method' => $request->method(),
            'content_type' => $request->header('Content-Type'),
            'content_length' => $request->header('Content-Length'),
            'has_file' => $request->hasFile('profile_picture'),
            'all_files' => count($request->allFiles()),
            'file_keys' => array_keys($request->allFiles()),
            'input_keys' => array_keys($request->all()),
        ]);

        $request->validate([
            'profile_picture' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
        ], [
            'profile_picture.required' => "L'image de profil est obligatoire.",
            'profile_picture.image' => 'Le fichier doit être une image.',
            'profile_picture.mimes' => "L'image doit être de type: jpeg, png, jpg, webp.",
            'profile_picture.max' => "L'image ne doit pas dépasser 5MB.",
        ]);

        try {
            ini_set('memory_limit', '256M');  // Increase memory for image processing

            $user = Auth::user();

            // Ensure directory exists and is writable
            if (!is_dir($this->profilePicturesPath)) {
                mkdir($this->profilePicturesPath, 0755, true);
            }
            if (!is_writable($this->profilePicturesPath)) {
                throw new \Exception('Profile pictures directory is not writable: ' . $this->profilePicturesPath);
            }

            // Delete any existing profile picture files for this user
            $possibleExtensions = ['jpg', 'jpeg', 'png', 'webp'];
            foreach ($possibleExtensions as $ext) {
                $oldFilePath = $this->profilePicturesPath . '/' . $user->id . '.' . $ext;
                if (file_exists($oldFilePath)) {
                    @unlink($oldFilePath);
                }
            }

            // Get the uploaded file
            $file = $request->file('profile_picture');
            $tempPath = $file->getPathname();

            // Detect actual MIME type
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $tempPath);
            finfo_close($finfo);

            \Log::info("Uploading image - MIME: {$mimeType}, Size: " . filesize($tempPath));

            // Create image resource based on MIME type
            $imageResource = null;
            switch ($mimeType) {
                case 'image/jpeg':
                case 'image/jpg':
                    $imageResource = @imagecreatefromjpeg($tempPath);
                    break;
                case 'image/png':
                    $imageResource = @imagecreatefrompng($tempPath);
                    break;
                case 'image/webp':
                    if (function_exists('imagecreatefromwebp')) {
                        $imageResource = @imagecreatefromwebp($tempPath);
                    }
                    break;
            }

            if (!$imageResource) {
                throw new \Exception('Failed to create image resource from uploaded file');
            }

            // Resize if needed
            $originalWidth = imagesx($imageResource);
            $originalHeight = imagesy($imageResource);
            $maxSize = 800;

            if ($originalWidth > $maxSize || $originalHeight > $maxSize) {
                $ratio = min($maxSize / $originalWidth, $maxSize / $originalHeight);
                $newWidth = (int) ($originalWidth * $ratio);
                $newHeight = (int) ($originalHeight * $ratio);

                $resizedImage = imagecreatetruecolor($newWidth, $newHeight);

                if (!$resizedImage) {
                    imagedestroy($imageResource);
                    throw new \Exception('Failed to create resized image');
                }

                // Preserve transparency for PNG
                if ($mimeType === 'image/png') {
                    imagealphablending($resizedImage, false);
                    imagesavealpha($resizedImage, true);
                    $transparent = imagecolorallocatealpha($resizedImage, 255, 255, 255, 127);
                    imagefill($resizedImage, 0, 0, $transparent);
                }

                imagecopyresampled($resizedImage, $imageResource, 0, 0, 0, 0, $newWidth, $newHeight, $originalWidth, $originalHeight);
                imagedestroy($imageResource);
                $imageResource = $resizedImage;
            }

            // Determine output format: WebP if supported, otherwise JPEG
            $outputFormat = 'jpg';
            $fileName = $user->id . '.jpg';
            $filePath = $this->profilePicturesPath . '/' . $fileName;
            
            // Try to save as WebP first if supported
            if (function_exists('imagewebp')) {
                $outputFormat = 'webp';
                $fileName = $user->id . '.webp';
                $filePath = $this->profilePicturesPath . '/' . $fileName;
                $success = @imagewebp($imageResource, $filePath, 85);
            } else {
                // Fallback to JPEG
                $success = @imagejpeg($imageResource, $filePath, 90);
            }

            imagedestroy($imageResource);

            if (!$success || !file_exists($filePath)) {
                throw new \Exception('Failed to save profile picture');
            }

            \Log::info("Profile picture saved successfully", [
                'user_id' => $user->id,
                'format' => $outputFormat,
                'file' => $fileName
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Photo de profil mise à jour avec succès.',
                'data' => [
                    'profile_picture' => $fileName,
                    'format' => $outputFormat
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Profile picture upload error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de la photo de profil',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get profile picture (public endpoint for image display)
     * Secured with signed URLs that expire after 1 hour
     */
    public function getProfilePicture(Request $request): mixed
    {
        try {
            $userId = $request->query('user_id');
            $timestamp = $request->query('t');
            $expires = $request->query('expires');
            $signature = $request->query('signature');
            
            // Validate all required parameters
            if (!$userId || !$timestamp || !$expires || !$signature) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or missing parameters'
                ], 400);
            }
            
            // Check if URL has expired
            if (time() > $expires) {
                return response()->json([
                    'success' => false,
                    'message' => 'URL has expired'
                ], 403);
            }
            
            // Verify signature
            $params = [
                'user_id' => $userId,
                't' => $timestamp,
                'expires' => $expires,
            ];
            
            $expectedSignature = hash_hmac('sha256', 
                http_build_query($params), 
                config('app.key')
            );
            
            if (!hash_equals($expectedSignature, $signature)) {
                \Log::warning('Invalid signature for profile picture', [
                    'user_id' => $userId,
                    'ip' => $request->ip(),
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid signature'
                ], 403);
            }

            // Check for different extensions
            $possibleExtensions = ['webp', 'jpg', 'jpeg', 'png'];
            
            foreach ($possibleExtensions as $ext) {
                $filePath = $this->profilePicturesPath . '/' . $userId . '.' . $ext;
                
                if (file_exists($filePath) && is_readable($filePath)) {
                    $mimeType = match($ext) {
                        'webp' => 'image/webp',
                        'png' => 'image/png',
                        'jpg', 'jpeg' => 'image/jpeg',
                        default => 'application/octet-stream',
                    };

                    return response()->file($filePath, [
                        'Content-Type' => $mimeType,
                        'Cache-Control' => 'public, max-age=3600',
                        'Access-Control-Allow-Origin' => '*',
                    ]);
                }
            }

            // Return a 404 image or empty response
            return response()->json([
                'success' => false,
                'message' => 'Profile picture not found'
            ], 404);

        } catch (\Exception $e) {
            \Log::error('Error retrieving profile picture: ' . $e->getMessage(), [
                'user_id' => $request->query('user_id'),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving profile picture'
            ], 500);
        }
    }
}
