<?php

namespace App\Http\Controllers;

use App\Models\Signature;
use App\Models\Enseignant; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class SignatureController extends Controller
{
    private function authorizeTeacher($teacherId)
    {
        $teacher = Enseignant::findOrFail($teacherId);
        
        if (!$teacher->is_responsable) {
            abort(403, 'Only responsible teachers can manage signatures.');
        }
        
        return $teacher;
    }

    public function index($teacherId)
    {
        DB::beginTransaction();
        try {
            $this->authorizeTeacher($teacherId);
            $signatures = Signature::where('enseignant_id', $teacherId)->get();
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

    public function store(Request $request, $teacherId)
    {
        DB::beginTransaction();
        try {
            $this->authorizeTeacher($teacherId);

            $validator = Validator::make($request->all(), [
                'signature' => 'required|file|mimes:png,jpeg,jpg|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $existingSignaturesCount = Signature::where('enseignant_id', $teacherId)->count();
            $fileExtension = $request->file('signature')->getClientOriginalExtension();
            $fileName = $teacherId . '-signature-' . ($existingSignaturesCount + 1) . '.' . $fileExtension;
            $path = $request->file('signature')->storeAs('signatures', $fileName, 'private');

            $signature = Signature::create([
                'enseignant_id' => $teacherId,
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
            $this->authorizeTeacher($signature->enseignant_id);

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
                $fileName = $signature->enseignant_id . '-signature-' . (Signature::where('enseignant_id', $signature->enseignant_id)->count() + 1) . '.' . $fileExtension;
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
            $this->authorizeTeacher($signature->enseignant_id);
            
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

    public function activate(Request $request, $teacherId, $signatureId)
    {
        DB::beginTransaction();
        try {
            $this->authorizeTeacher($teacherId);

            $currentActiveSignature = Signature::where('enseignant_id', $teacherId)->where('is_active', true)->first();
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
        $filePaths = [$filename, 'signatures/' . $filename];
        
        foreach ($filePaths as $filePath) {
            if (Storage::disk('private')->exists($filePath)) {
                $fileContents = Storage::disk('private')->get($filePath);
                $fullPath = Storage::disk('private')->path($filePath);
                
                try {
                    $mimeType = mime_content_type($fullPath) ?: 'image/png';
                } catch (\Exception $e) {
                    $mimeType = 'image/png';
                }

                return response($fileContents, 200)
                    ->header('Content-Type', $mimeType)
                    ->header('Cache-Control', 'public, max-age=86400')
                    ->header('Access-Control-Allow-Origin', '*');
            }
        }
    
        return response()->json(['error' => 'Signature not found'], 404);
    }
}