<?php

namespace App\Http\Controllers;

use App\Models\Option;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class OptionController extends Controller
{
    /**
     * Get all options with their responsables
     */
    public function index(): JsonResponse
    {
        try {
            Log::info('Fetching all options');
            
            $options = Option::with('responsable')->get();
            
            $formattedOptions = $options->map(function ($option) {
                return [
                    'id' => $option->id,
                    'option' => $option->nom,
                    'responsable' => $option->responsable ? [
                        'id' => $option->responsable->id,
                        'name' => $option->responsable->name
                    ] : null
                ];
            });

            Log::info('Options fetched successfully', ['count' => $formattedOptions->count()]);

            return response()->json([
                'success' => true,
                'options' => $formattedOptions
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching options', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des options'
            ], 500);
        }
    }

    /**
     * Get a single option by ID
     */
    public function show($id): JsonResponse
    {
        try {
            Log::info('Fetching option', ['id' => $id]);
            
            $option = Option::with('responsable')->findOrFail($id);

            Log::info('Option fetched successfully', ['option' => $option->nom]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $option->id,
                    'option' => $option->nom,
                    'responsable' => $option->responsable ? [
                        'id' => $option->responsable->id,
                        'name' => $option->responsable->name
                    ] : null
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching option', [
                'id' => $id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Option non trouvée'
            ], 404);
        }
    }

    /**
     * Create a new option (id_responsable is null by default)
     */
    public function store(Request $request): JsonResponse
    {
        Log::info('Create option request received', ['data' => $request->all()]);

        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255|unique:options,nom',
        ]);

        if ($validator->fails()) {
            Log::warning('Validation failed for option creation', ['errors' => $validator->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            Log::info('Attempting to create option', ['nom' => $request->nom]);
            
            $option = Option::create([
                'nom' => $request->nom,
                'id_responsable' => null
            ]);

            Log::info('Option created successfully', ['option_id' => $option->id]);

            return response()->json([
                'success' => true,
                'message' => 'Option créée avec succès',
                'data' => [
                    'id' => $option->id,
                    'option' => $option->nom,
                    'responsable' => null
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating option', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'option',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing option's name
     */
    public function update(Request $request, $id): JsonResponse
    {
        Log::info('Update option request received', ['id' => $id, 'data' => $request->all()]);

        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255|unique:options,nom,' . $id . ',id',
        ]);

        if ($validator->fails()) {
            Log::warning('Validation failed for option update', ['id' => $id, 'errors' => $validator->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            Log::info('Attempting to update option', ['id' => $id, 'nom' => $request->nom]);
            
            $option = Option::findOrFail($id);
            $option->update([
                'nom' => $request->nom
            ]);

            $option->load('responsable');

            Log::info('Option updated successfully', ['option_id' => $option->id]);

            return response()->json([
                'success' => true,
                'message' => 'Option mise à jour avec succès',
                'data' => [
                    'id' => $option->id,
                    'option' => $option->nom,
                    'responsable' => $option->responsable ? [
                        'id' => $option->responsable->id,
                        'name' => $option->responsable->name
                    ] : null
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating option', [
                'id' => $id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de l\'option',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an option
     */
    public function destroy($id): JsonResponse
    {
        Log::info('Delete option request received', ['id' => $id]);

        try {
            $option = Option::findOrFail($id);
            $optionName = $option->nom;
            
            $option->delete();

            Log::info('Option deleted successfully', ['id' => $id, 'name' => $optionName]);

            return response()->json([
                'success' => true,
                'message' => 'Option supprimée avec succès'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting option', [
                'id' => $id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'option',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}