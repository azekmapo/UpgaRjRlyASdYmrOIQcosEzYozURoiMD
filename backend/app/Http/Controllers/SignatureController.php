<?php

namespace App\Http\Controllers;

use App\Models\Signature;
use App\Models\Enseignant;
use App\Models\Jury;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

class SignatureController extends Controller
{
    private function authorizeUser($userId)
    {
        $user = User::findOrFail($userId);
        
        $isPresident = Jury::where('id_president', $userId)->exists();
        $isAdmin = $user->role === 'admin';
        
        if (!$isPresident && !$isAdmin) {
            abort(403, 'Only jury presidents or admins can manage signatures.');
        }
        
        return $user;
    }

    public function index($userId)
    {
        DB::beginTransaction();
        try {
            $this->authorizeUser($userId);
            $signatures = Signature::where('user_id', $userId)->get();
            DB::commit();
            return response()->json($signatures, 200);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'error' => 'An error occurred while fetching signatures.',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    public function store(Request $request, $userId)
    {
        DB::beginTransaction();
        try {
            $this->authorizeUser($userId);

            $validator = Validator::make($request->all(), [
                'signature' => 'required|file|mimes:png,jpeg,jpg|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $existingSignaturesCount = Signature::where('user_id', $userId)->count();
            $fileExtension = $request->file('signature')->getClientOriginalExtension();
            $fileName = $userId . '-signature-' . ($existingSignaturesCount + 1) . '.' . $fileExtension;
            $path = $request->file('signature')->storeAs('signatures', $fileName, 'private');

            $signature = Signature::create([
                'user_id' => $userId,
                'signature_data' => $path,
                'is_active' => false,
            ]);

            DB::commit();
            return response()->json([
                'message' => 'Signature created successfully',
                'signature' => $signature
            ], 201);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'error' => 'An error occurred while creating the signature.',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    public function update(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $signature = Signature::findOrFail($id);
            $this->authorizeUser($signature->user_id);

            $validator = Validator::make($request->all(), [
                'signature' => 'nullable|file|mimes:png,jpeg,jpg|max:2048',
                'is_active' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            if ($request->hasFile('signature')) {
                if ($signature->signature_data && Storage::disk('private')->exists($signature->signature_data)) {
                    Storage::disk('private')->delete($signature->signature_data);
                }

                $fileExtension = $request->file('signature')->getClientOriginalExtension();
                $fileName = $signature->user_id . '-signature-' . (Signature::where('user_id', $signature->user_id)->count() + 1) . '.' . $fileExtension;
                $path = $request->file('signature')->storeAs('signatures', $fileName, 'private');
                $signature->signature_data = $path;
            }

            if ($request->has('is_active')) {
                $signature->is_active = $request->is_active;
            }

            $signature->save();
            DB::commit();
            return response()->json([
                'message' => 'Signature updated successfully',
                'signature' => $signature
            ], 200);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'error' => 'An error occurred while updating the signature.',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $signature = Signature::findOrFail($id);
            $this->authorizeUser($signature->user_id);
            
            if ($signature->signature_data && Storage::disk('private')->exists($signature->signature_data)) {
                Storage::disk('private')->delete($signature->signature_data);
            }
            
            $signature->delete();
            DB::commit();
            return response()->json(['message' => 'Signature deleted successfully'], 200);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'error' => 'An error occurred while deleting the signature.',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    public function activate(Request $request, $userId, $signatureId)
    {
        DB::beginTransaction();
        try {
            $this->authorizeUser($userId);

            $currentActiveSignature = Signature::where('user_id', $userId)->where('is_active', true)->first();
            if ($currentActiveSignature) {
                $currentActiveSignature->is_active = false;
                $currentActiveSignature->save();
            }

            $signature = Signature::findOrFail($signatureId);
            $signature->is_active = true;
            $signature->save();

            DB::commit();
            return response()->json([
                'message' => 'Signature activated successfully.',
                'signature' => $signature
            ], 200);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'error' => 'An error occurred while activating the signature.',
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }

    public function getSignatureImage($filename)
    {
        try {
            $filePaths = [$filename, 'signatures/' . $filename];
            
            foreach ($filePaths as $filePath) {
                if (Storage::disk('private')->exists($filePath)) {
                    // Generate URL for auth-protected route
                    $url = route('signatures.serve', ['filename' => basename($filePath)]);
                    
                    return response()->json([
                        'success' => true,
                        'url' => $url,
                        'expires_at' => null
                    ], 200);
                }
            }
        
            return response()->json(['error' => 'Signature not found'], 404);
        } catch (\Exception $e) {
            Log::error('Error generating signature URL: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate signature URL'], 500);
        }
    }
    
    public function getSignatureImageDirect($filename)
    {
        // Alternative endpoint for direct image serving (if needed)
        $filePaths = [
            $filename,
            'signatures/' . $filename,
            'app/private/signatures/' . $filename,
            storage_path('app/private/signatures/' . $filename)
        ];
        
        foreach ($filePaths as $filePath) {
            Log::info('Checking file path: ' . $filePath);
            if (Storage::disk('private')->exists($filePath)) {
                Log::info('Found file at: ' . $filePath);
                $fileContents = Storage::disk('private')->get($filePath);
                $fullPath = Storage::disk('private')->path($filePath);
                
                try {
                    $mimeType = mime_content_type($fullPath) ?: 'image/png';
                } catch (\Exception $e) {
                    $mimeType = 'image/png';
                }

                return response($fileContents, 200)
                    ->header('Content-Type', $mimeType)
                    ->header('Cache-Control', 'public, max-age=3600')
                    ->header('Access-Control-Allow-Origin', '*');
            }
        }
        
        Log::error('Signature not found for filename: ' . $filename);
        return response()->json(['error' => 'Signature not found'], 404);
    }
    
    public function serveSignature($filename)
    {
        try {
            $filePath = 'signatures/' . $filename;
            
            if (!Storage::disk('private')->exists($filePath)) {
                return response()->json(['error' => 'Signature not found'], 404);
            }
            
            $fullPath = Storage::disk('private')->path($filePath);
            $mimeType = mime_content_type($fullPath) ?: 'image/png';
            
            return response()->file($fullPath, [
                'Content-Type' => $mimeType,
                'Cache-Control' => 'private, max-age=3600'
            ]);
        } catch (\Exception $e) {
            Log::error('Error serving signature: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to serve signature'], 500);
        }
    }
}