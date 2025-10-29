<?php

namespace App\Http\Controllers;

use App\Mail\FinalGradeMail;
use App\Mail\PvReadyMail;
use App\Models\Bareme;
use App\Models\DistributionStatus;
use App\Models\Enseignant;
use App\Models\Note;
use App\Models\Option;
use App\Models\Periode;
use App\Models\Pfe;
use App\Models\Signature;
use App\Models\Soutenance;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use ZipArchive;

class NotationController extends Controller
{
    // ... autres méthodes restent identiques ...

    /**
     * Generate and send PVs when period ends
     */
    public function downloadPvsWithToken($token)
    {
        // Add this at the very beginning to confirm route is hit
        Log::info('=== ROUTE HIT: downloadPvsWithToken called with token: ' . $token . ' ===');

        try {
            // Verify token exists in cache (but don't remove it)
            $userId = Cache::get('download_token_' . $token);
            Log::info('Token lookup result: ' . ($userId ? 'Found user ID: ' . $userId : 'Token not found'));

            if (!$userId) {
                Log::error('Invalid or expired token: ' . $token);
                return response()->json(['error' => 'Token invalide ou expiré'], 403);
            }

            $user = User::find($userId);
            if (!$user || $user->role !== 'admin') {
                Log::error('Unauthorized access attempt for user: ' . $userId);
                return response()->json(['error' => 'Accès non autorisé'], 403);
            }

            Log::info('Valid token for admin: ' . $user->email);

            // DON'T clear token after use - allow infinite uses
            // Cache::forget('download_token_' . $token); // REMOVED

            $pvDirectory = storage_path('app/private/pvs');
            Log::info('Looking for PVs in directory: ' . $pvDirectory);
            Log::info('Directory exists: ' . (is_dir($pvDirectory) ? 'YES' : 'NO'));

            if (!is_dir($pvDirectory)) {
                Log::error('PV directory not found: ' . $pvDirectory);
                return response()->json(['error' => 'Aucun PV trouvé'], 404);
            }

            $files = glob($pvDirectory . '/*.pdf');
            Log::info('Found ' . count($files) . ' PDF files');
            Log::info('Files found: ' . implode(', ', array_map('basename', $files)));

            if (empty($files)) {
                Log::error('No PV files found in directory: ' . $pvDirectory);
                return response()->json(['error' => 'Aucun PV trouvé'], 404);
            }

            $zipFileName = 'PVs_' . date('Y-m-d_H-i-s') . '.zip';
            $zipPath = storage_path('app/private/' . $zipFileName);

            Log::info('Creating ZIP file at: ' . $zipPath);

            $zip = new ZipArchive();

            if ($zip->open($zipPath, ZipArchive::CREATE) !== TRUE) {
                Log::error('Cannot create ZIP file: ' . $zipPath);
                return response()->json(['error' => 'Impossible de créer le fichier ZIP'], 500);
            }

            foreach ($files as $file) {
                $zip->addFile($file, basename($file));
                Log::info('Added file to ZIP: ' . basename($file));
            }

            $zip->close();
            Log::info('ZIP file created successfully: ' . $zipFileName);

            return response()->download($zipPath, $zipFileName, [
                'Content-Type' => 'application/zip',
                'Content-Disposition' => 'attachment; filename="' . $zipFileName . '"',
            ])->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            Log::error('Error downloading PVs with token: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json(['error' => 'Erreur lors du téléchargement'], 500);
        }
    }

    public function sendPvsReadyNotification()
    {
        Log::info('Starting PVs ready notification process');

        $periode = Periode::find(13);
        $distributionStatus = DistributionStatus::find(5);

        Log::info('Période 13 trouvée: ' . ($periode ? "OUI (date_fin: {$periode->date_fin})" : 'NON'));
        Log::info('Date actuelle: ' . now());
        Log::info('Période terminée: ' . ($periode && $periode->date_fin < now() ? 'OUI' : 'NON'));

        Log::info('DistributionStatus 5 trouvé: ' . ($distributionStatus ? "OUI (is_distributed: {$distributionStatus->is_distributed})" : 'NON'));

        if ($periode && $periode->date_fin < now() && $distributionStatus && $distributionStatus->is_distributed == 0) {
            Log::info('Conditions remplies, génération des PVs');

            try {
                // Create private directory if it doesn't exist
                if (!Storage::exists('private/pvs')) {
                    Storage::makeDirectory('private/pvs');
                }

                $notes = Note::whereNotNull('note_generale')->get();
                Log::info('Nombre de notes trouvées: ' . $notes->count());

                $generatedFiles = [];

                foreach ($notes as $note) {
                    try {
                        $filename = $this->generatePv($note);
                        $generatedFiles[] = $filename;
                        Log::info('PV généré: ' . $filename);
                    } catch (\Exception $e) {
                        Log::error("Erreur génération PV pour note {$note->id}: " . $e->getMessage());
                    }
                }

                if (!empty($generatedFiles)) {
                    $admin = User::where('role', 'admin')->first();
                    Log::info('Admin trouvé: ' . ($admin ? "OUI ({$admin->email})" : 'NON'));

                    if ($admin) {
                        // Check if permanent token already exists for this admin
                        $existingToken = Cache::get('permanent_download_token_' . $admin->id);

                        if ($existingToken) {
                            // Use existing permanent token
                            $token = $existingToken;
                            Log::info('Using existing permanent token for admin: ' . $admin->email);
                        } else {
                            // Generate a new permanent download token
                            $token = Str::random(32);
                            // Store permanently (or with very long expiration)
                            Cache::put('download_token_' . $token, $admin->id, now()->addYears(10));
                            // Also store a reverse mapping for future reference
                            Cache::put('permanent_download_token_' . $admin->id, $token, now()->addYears(10));
                            Log::info('Generated new permanent token for admin: ' . $admin->email);
                        }

                        // Test both URL generation methods for API routes
                        $downloadUrl1 = url("api/download-pvs-token/{$token}");
                        $downloadUrl2 = route('api.download.pvs.token', ['token' => $token]);

                        Log::info('Generated API download URL (method 1): ' . $downloadUrl1);
                        Log::info('Generated API download URL (method 2): ' . $downloadUrl2);

                        // Use the route helper for better reliability
                        $downloadUrl = $downloadUrl2;

                        // Test if token is properly stored in cache
                        $testUserId = Cache::get('download_token_' . $token);
                        Log::info('Token verification - stored user ID: ' . $testUserId);

                        try {
                            Mail::to($admin->email)->send(new PvReadyMail($downloadUrl));
                            Log::info('Email envoyé avec succès à: ' . $admin->email);
                        } catch (\Exception $mailException) {
                            Log::error("Erreur lors de l'envoi de l'email: " . $mailException->getMessage());
                            throw $mailException;
                        }

                        $distributionStatus->is_distributed = 1;
                        $distributionStatus->distributed_at = now();
                        $distributionStatus->save();
                        Log::info('Distribution status updated successfully');
                    } else {
                        Log::error('Aucun administrateur trouvé dans la base de données');
                    }
                } else {
                    Log::warning('Aucun PV généré');
                }
            } catch (\Exception $e) {
                Log::error('Error sending PVs ready notification: ' . $e->getMessage());
                Log::error('Stack trace: ' . $e->getTraceAsString());
            }
        } else {
            Log::info('Conditions not met for sending PVs ready notification');
        }
    }

    // ... reste des méthodes identiques ...

    public function store(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'type_bareme' => 'required|string|in:encadrant,jury',
                'note_application' => 'required|numeric|min:0|max:20',
                'note_expose_oral' => 'required|numeric|min:0|max:20',
                'note_reponses_questions' => 'required|numeric|min:0|max:20',
                'note_assiduite' => 'nullable|numeric|min:0|max:20',
                'note_manucrit' => 'nullable|numeric|min:0|max:20',
            ]);

            // Validate that total equals 20
            $total = $validatedData['note_application']
                + $validatedData['note_expose_oral']
                + $validatedData['note_reponses_questions'];

            if ($validatedData['type_bareme'] === 'encadrant') {
                $total += $validatedData['note_assiduite'] ?? 0;
            } else {
                $total += $validatedData['note_manucrit'] ?? 0;
            }

            if ($total != 20) {
                return response()->json([
                    'success' => false,
                    'message' => 'La somme des notes doit être égale à 20',
                    'errors' => ['total' => ['La somme des notes doit être égale à 20']]
                ], 422);
            }

            // Delete existing bareme for the selected role
            Bareme::where('type_bareme', $validatedData['type_bareme'])->delete();

            // Create new bareme
            $bareme = Bareme::create($validatedData);

            return response()->json([
                'success' => true,
                'message' => 'Barème enregistré avec succès.',
                'data' => $bareme
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error saving bareme: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => "Une erreur est survenue lors de l'enregistrement du barème."
            ], 500);
        }
    }

    public function getBaremeByRole(Request $request): JsonResponse
    {
        try {
            $role = $request->query('role');

            if (!in_array($role, ['encadrant', 'jury'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rôle invalide'
                ], 400);
            }

            $bareme = Bareme::where('type_bareme', $role)->first();

            return response()->json([
                'success' => true,
                'data' => $bareme
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting bareme: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la récupération du barème.'
            ], 500);
        }
    }

    public function getEvaluationData(Request $request): JsonResponse
    {
        try {
            $role = $request->query('role');

            if (!in_array($role, ['encadrant', 'jury'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rôle invalide'
                ], 400);
            }

            // Get bareme
            $bareme = Bareme::where('type_bareme', $role)->first();

            if (!$bareme) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun barème trouvé pour ce rôle'
                ], 404);
            }

            $userId = Auth::id();

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non authentifié'
                ], 401);
            }

            $pfes = collect();

            if ($role === 'encadrant') {
                // Get PFEs where user is encadrant
                $pfes = Pfe::where('id_encadrant', $userId)
                    ->with(['group.student1User', 'group.student2User', 'encadrantUser'])
                    ->get();
            } else {
                // Get PFEs where user is president or examinateur
                $pfes = Pfe::whereHas('jury', function ($query) use ($userId) {
                    $query
                        ->where('id_president', $userId)
                        ->orWhere('id_examinateur', $userId);
                })
                    ->with(['group.student1User', 'group.student2User', 'jury.presidentUser', 'jury.examinateurUser', 'encadrantUser'])
                    ->get();
            }

            // Transform PFEs data for frontend
            $transformedPfes = $pfes->map(function ($pfe) {
                $etudiantNames = [];

                if ($pfe->group) {
                    if ($pfe->group->student1User) {
                        $etudiantNames[] = $pfe->group->student1User->name;
                    }
                    if ($pfe->group->student2User) {
                        $etudiantNames[] = $pfe->group->student2User->name;
                    }
                }

                return [
                    'id' => $pfe->id,
                    'intitule' => $pfe->intitule ?? 'Projet sans titre',
                    'etudiant' => !empty($etudiantNames) ? implode(' & ', $etudiantNames) : 'Aucun étudiant assigné',
                    'encadrant' => $pfe->encadrantUser ? $pfe->encadrantUser->name : 'N/A',
                    'date_soutenance' => $pfe->date_soutenance ?? now()->addDays(7)->toISOString(),
                    'status' => 'en_cours'
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'bareme' => $bareme,
                    'pfes' => $transformedPfes
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting evaluation data: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la récupération des données.',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    public function getExistingNotes(Request $request): JsonResponse
    {
        try {
            $pfeId = $request->query('pfe_id');
            $role = $request->query('role');
            $userId = Auth::id();

            if (!$pfeId || !$role || !$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Paramètres manquants'
                ], 400);
            }

            // Get existing note for this PFE
            $note = Note::where('id_pfe', $pfeId)->first();

            if (!$note) {
                return response()->json([
                    'success' => true,
                    'data' => null
                ]);
            }

            // Get PFE with jury information to determine role key
            $pfe = Pfe::with('jury')->find($pfeId);
            $roleKey = 'encadrant';

            if ($role === 'jury') {
                if ($pfe->jury && $pfe->jury->id_president == $userId) {
                    $roleKey = 'president';
                } else {
                    $roleKey = 'examinateur';
                }
            }

            // Parse JSON data and extract notes for current user
            $noteApplication = json_decode($note->note_application ?? '{}', true);
            $noteExposeOrale = json_decode($note->note_expose_orale ?? '{}', true);
            $noteReponsesQuestions = json_decode($note->note_reponses_questions ?? '{}', true);
            $noteAssiduite = json_decode($note->note_assiduite ?? '{}', true);
            $noteManuscrit = json_decode($note->note_manuscrit ?? '{}', true);

            $existingNotes = [
                'note_application' => $noteApplication[$roleKey]['note'] ?? 0,
                'note_expose_orale' => $noteExposeOrale[$roleKey]['note'] ?? 0,
                'note_reponses_questions' => $noteReponsesQuestions[$roleKey]['note'] ?? 0,
                'note_assiduite' => $noteAssiduite[$roleKey]['note'] ?? 0,
                'note_manucrit' => $noteManuscrit[$roleKey]['note'] ?? 0,
            ];

            return response()->json([
                'success' => true,
                'data' => $existingNotes
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting existing notes: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data' => null
            ]);
        }
    }

    public function storeNote(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'role' => 'required|string|in:encadrant,jury',
                'pfe_id' => 'required|string|exists:pfes,id',
                'note_application' => 'required|numeric|min:0',
                'note_expose_orale' => 'required|numeric|min:0',
                'note_reponses_questions' => 'required|numeric|min:0',
                'note_assiduite' => 'nullable|numeric|min:0',
                'note_manucrit' => 'nullable|numeric|min:0',
            ]);

            $userId = Auth::id();

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non authentifié'
                ], 401);
            }

            // Get the bareme to validate against max values
            $bareme = Bareme::where('type_bareme', $validatedData['role'])->first();

            if (!$bareme) {
                return response()->json([
                    'success' => false,
                    'message' => 'Barème non trouvé pour ce rôle.'
                ], 404);
            }

            // Validate against bareme limits
            if ($validatedData['note_application'] > $bareme->note_application ||
                    $validatedData['note_expose_orale'] > $bareme->note_expose_oral ||
                    $validatedData['note_reponses_questions'] > $bareme->note_reponses_questions) {
                return response()->json([
                    'success' => false,
                    'message' => 'Une ou plusieurs notes dépassent les limites du barème.'
                ], 422);
            }

            if ($validatedData['role'] === 'encadrant' &&
                    isset($validatedData['note_assiduite']) &&
                    $validatedData['note_assiduite'] > $bareme->note_assiduite) {
                return response()->json([
                    'success' => false,
                    'message' => "La note d'assiduité dépasse la limite du barème."
                ], 422);
            }

            if ($validatedData['role'] === 'jury' &&
                    isset($validatedData['note_manucrit']) &&
                    $validatedData['note_manucrit'] > $bareme->note_manucrit) {
                return response()->json([
                    'success' => false,
                    'message' => 'La note de manuscrit dépasse la limite du barème.'
                ], 422);
            }

            // Get or create note record
            $note = Note::firstOrNew(['id_pfe' => $validatedData['pfe_id']]);

            // Get PFE with jury information
            $pfe = Pfe::with('jury')->find($validatedData['pfe_id']);
            $roleKey = 'encadrant';

            if ($validatedData['role'] === 'jury') {
                if ($pfe->jury && $pfe->jury->id_president == $userId) {
                    $roleKey = 'president';
                } else {
                    $roleKey = 'examinateur';
                }
            }

            // Prepare note data
            $noteData = [
                'note_application' => $validatedData['note_application'],
                'note_expose_orale' => $validatedData['note_expose_orale'],
                'note_reponses_questions' => $validatedData['note_reponses_questions']
            ];

            // Calculate total note based on role
            if ($roleKey === 'encadrant') {
                $noteData['note_assiduite'] = $validatedData['note_assiduite'];
                $note->note_encadrant = $noteData['note_application']
                    + $noteData['note_expose_orale']
                    + $noteData['note_reponses_questions']
                    + $noteData['note_assiduite'];
            } else {
                $noteData['note_manuscrit'] = $validatedData['note_manucrit'];
                $juryNote = $noteData['note_application']
                    + $noteData['note_expose_orale']
                    + $noteData['note_reponses_questions']
                    + $noteData['note_manuscrit'];

                if ($roleKey === 'president') {
                    $note->note_president = $juryNote;
                } else {
                    $note->note_examinateur = $juryNote;
                }
            }

            // Update JSON columns
            $existingData = [
                'note_application' => json_decode($note->note_application ?? '{}', true) ?: [],
                'note_expose_orale' => json_decode($note->note_expose_orale ?? '{}', true) ?: [],
                'note_reponses_questions' => json_decode($note->note_reponses_questions ?? '{}', true) ?: [],
                'note_assiduite' => json_decode($note->note_assiduite ?? '{}', true) ?: [],
                'note_manuscrit' => json_decode($note->note_manuscrit ?? '{}', true) ?: []
            ];

            foreach ($noteData as $type => $value) {
                $columnName = str_replace('_', '_', $type);
                if (isset($value)) {
                    $existingData[$columnName][$roleKey] = [
                        'note' => $value,
                        'id_enseignant' => $userId
                    ];
                }
            }

            $note->note_application = json_encode($existingData['note_application']);
            $note->note_expose_orale = json_encode($existingData['note_expose_orale']);
            $note->note_reponses_questions = json_encode($existingData['note_reponses_questions']);
            $note->note_assiduite = json_encode($existingData['note_assiduite']);
            $note->note_manuscrit = json_encode($existingData['note_manuscrit']);

            // Calculate general note if all notes are available
            if ($note->note_encadrant && $note->note_president && $note->note_examinateur) {
                $note->note_generale = ($note->note_encadrant + $note->note_president + $note->note_examinateur) / 3;
            }

            $note->save();

            return response()->json([
                'success' => true,
                'message' => 'Note enregistrée avec succès.',
                'data' => $note
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error storing note: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => "Une erreur est survenue lors de l'enregistrement de la note."
            ], 500);
        }
    }

    /**
     * Send final grades to students when the period ends
     */
    public function sendFinalGrades()
    {
        Log::info('Starting sendFinalGrades function');

        $periode = Periode::find(13);
        $distributionStatus = DistributionStatus::find(3);

        if ($periode && $periode->date_fin < now() && $distributionStatus->is_distributed == 0) {
            $notes = Note::whereNotNull('note_generale')->get();

            Log::info('Period check:', [
                'period_exists' => $periode ? 'yes' : 'no',
                'end_date' => $periode ? $periode->date_fin : 'no period found',
                'current_date' => now(),
                'period_ended' => $periode && $periode->date_fin < now() ? 'yes' : 'no'
            ]);

            Log::info('Distribution status check:', [
                'status_exists' => $distributionStatus ? 'yes' : 'no',
                'is_distributed' => $distributionStatus ? $distributionStatus->is_distributed : 'no status found'
            ]);

            foreach ($notes as $note) {
                $pfe = $note->pfe;
                $group = $pfe->group;

                // Get students from the group - now using direct User relationships
                $etudiants = [];
                if ($group->student1User) {
                    $etudiants[] = $group->student1User;
                }
                if ($group->student2User) {
                    $etudiants[] = $group->student2User;
                }

                foreach ($etudiants as $user) {
                    if ($user) {
                        Log::info('User : ' . $user->name);
                        Log::info('PFE : ' . $pfe->intitule);
                        Log::info('Note : ' . $note->note_generale);

                        Mail::to($user->email)->send(new FinalGradeMail($user->name, $pfe->intitule, $note->note_generale));
                        Log::info('Email sent to: ' . $user->email);
                    }
                }
            }

            $distributionStatus->is_distributed = 1;
            $distributionStatus->distributed_at = now();
            $distributionStatus->save();

            Log::info('All emails sent and distribution status updated.');
        } else {
            Log::info('No emails sent. Either the period has not ended or the grades have already been distributed.');
        }
    }

    private function generatePv(Note $note)
    {
        try {
            Log::info("Début génération PV pour note ID: {$note->id}");

            $phpWord = new PhpWord();
            $section = $phpWord->addSection();

            // Add header image with better error handling
            try {
                if (file_exists(public_path('j.PNG'))) {
                    $section->addImage(
                        public_path('j.PNG'),
                        [
                            'width' => 500,
                            'height' => 150,
                            'alignment' => 'center',
                            'wrappingStyle' => 'inline'
                        ]
                    );
                    $section->addTextBreak(1);
                    Log::info("Image d'en-tête ajoutée avec succès");
                } else {
                    Log::warning("L'image d'en-tête n'existe pas: " . public_path('j.PNG'));
                }
            } catch (\Exception $e) {
                Log::error("Erreur lors de l'ajout de l'image d'en-tête: " . $e->getMessage());
            }

            // Récupération du PFE
            $pfe = $note->pfe;
            if (!$pfe) {
                throw new \Exception("PFE non trouvé pour la note ID: {$note->id}");
            }
            Log::info("PFE trouvé: {$pfe->intitule}");

            $projectType = $pfe->type_sujet === 'innovant' ? 'innovant' : 'classique';
            $soutenance = Soutenance::where('id_pfe', $pfe->id)->first();
            $dateSoutenance = $soutenance ? date('Y-m-d', strtotime($soutenance->date)) : 'Non définie';

            // Header styles
            $headerStyle = ['bold' => true, 'size' => 14];
            $boldStyle = ['bold' => true];
            $centerAlignment = ['alignment' => 'center'];
            $normalStyle = ['bold' => false];

            // Add header with project type
            $section->addText(
                "Procès-Verbal Récapitulatif de Notation de Projet de Fin d'Études (" . ucfirst($projectType) . ')',
                $headerStyle,
                $centerAlignment
            );
            $section->addText('Diplôme préparé : MASTER', $boldStyle, $centerAlignment);

            // Get related data
            $group = $pfe->group;
            if (!$group) {
                throw new \Exception("Groupe non trouvé pour le PFE ID: {$pfe->id}");
            }

            // Récupération des étudiants avec gestion d'erreur
            $students = [];

            if ($group->student1User) {
                $students[] = $group->student1User->name;
                Log::info("Étudiant 1 trouvé: {$group->student1User->name}");
            }

            if ($group->student2User) {
                $students[] = $group->student2User->name;
                Log::info("Étudiant 2 trouvé: {$group->student2User->name}");
            }

            // Add student information
            $section->addText('Nom Etudiant (s) : ', $boldStyle, []);
            $section->addText(implode(' / ', array_filter($students)));

            // Intitulé du PFE
            $textrun = $section->addTextRun();
            $textrun->addText('Intitulé du PFE : ', $boldStyle, []);
            $textrun->addText($pfe->intitule);

            // Option et Soutenu le sur la même ligne
            $textrun = $section->addTextRun();
            $textrun->addText('Option : ', $boldStyle);
            $textrun->addText($pfe->option, $normalStyle);
            $textrun->addText('    ', $normalStyle);
            $textrun->addText('Soutenu le : ', $boldStyle);
            $textrun->addText($dateSoutenance, $normalStyle);

            $section->addTextBreak(1);

            // Get baremes
            $baremeEncadrant = Bareme::where('type_bareme', 'encadrant')->first();
            $baremeJury = Bareme::where('type_bareme', 'jury')->first();

            if (!$baremeEncadrant || !$baremeJury) {
                throw new \Exception('Barèmes non trouvés (encadrant: ' . ($baremeEncadrant ? 'OK' : 'MANQUANT') . ', jury: ' . ($baremeJury ? 'OK' : 'MANQUANT') . ')');
            }

            // Create grading table
            $table = $section->addTable([
                'borderSize' => 3,
                'borderColor' => '000000',
                'alignment' => 'center',
                'width' => 100 * 50,
                'unit' => 'pct'
            ]);

            // Headers
            $table->addRow();
            $table->addCell(2000)->addText('', $boldStyle);
            $table->addCell(1500)->addText('Encadrant/Co-encadrant', $boldStyle);
            $table->addCell(1500)->addText('Examinateur', $boldStyle);
            $table->addCell(1500)->addText('Président', $boldStyle);

            // CORRECTION: Fonction helper pour décoder les notes
            $decodeNoteData = function ($data) {
                if (is_string($data)) {
                    return json_decode($data, true);
                } elseif (is_array($data)) {
                    return $data;
                } else {
                    return null;
                }
            };

            // Parse notes avec gestion des différents formats
            $notes = [
                'Manuscrit' => [
                    'notes' => $decodeNoteData($note->note_manuscrit),
                    'bareme_encadrant' => null,
                    'bareme_jury' => $baremeJury->note_manucrit
                ],
                'Application' => [
                    'notes' => $decodeNoteData($note->note_application),
                    'bareme_encadrant' => $baremeEncadrant->note_application,
                    'bareme_jury' => $baremeJury->note_application
                ],
                'Exposé oral' => [
                    'notes' => $decodeNoteData($note->note_expose_orale),
                    'bareme_encadrant' => $baremeEncadrant->note_expose_oral,
                    'bareme_jury' => $baremeJury->note_expose_oral
                ],
                'Réponses aux questions' => [
                    'notes' => $decodeNoteData($note->note_reponses_questions),
                    'bareme_encadrant' => $baremeEncadrant->note_reponses_questions,
                    'bareme_jury' => $baremeJury->note_reponses_questions
                ],
                'Assiduité' => [
                    'notes' => $decodeNoteData($note->note_assiduite),
                    'bareme_encadrant' => $baremeEncadrant->note_assiduite,
                    'bareme_jury' => null
                ]
            ];

            // Add rows for each criterion
            foreach ($notes as $criterion => $data) {
                $table->addRow();
                $table->addCell(2000)->addText($criterion);

                $this->addNoteCell($table, $data['notes'], 'encadrant', $data['bareme_encadrant']);
                $this->addNoteCell($table, $data['notes'], 'examinateur', $data['bareme_jury']);
                $this->addNoteCell($table, $data['notes'], 'president', $data['bareme_jury']);
            }

            // Add total notes
            $table->addRow();
            $table->addCell(2000)->addText('Note globale', $boldStyle);
            $table->addCell(1500)->addText(($note->note_encadrant ? $this->formatNoteBareme($note->note_encadrant) . '/20' : '-'));
            $table->addCell(1500)->addText(($note->note_examinateur ? $this->formatNoteBareme($note->note_examinateur) . '/20' : '-'));
            $table->addCell(1500)->addText(($note->note_president ? $this->formatNoteBareme($note->note_president) . '/20' : '-'));

            // Noms du jury avec gestion d'erreur améliorée
            $table->addRow();
            $table->addCell(2000)->addText('Nom et Prénom de Jury', $boldStyle);

            // Encadrant et Co-encadrant
            $encadrantName = 'Non défini';
            $coEncadrantName = '';

            if ($pfe->encadrantUser) {
                $encadrantName = $pfe->encadrantUser->name;
            }

            if ($pfe->coEncadrantUser) {
                $coEncadrantName = $pfe->coEncadrantUser->name;
            }

            $encadrantCell = $encadrantName;
            if (!empty($coEncadrantName)) {
                $encadrantCell .= ' / ' . $coEncadrantName;
            }
            $table->addCell(1500)->addText($encadrantCell);

            // Examinateur et Président
            $examinateurName = '-';
            $presidentName = '-';

            if ($pfe->jury) {
                if ($pfe->jury->examinateurUser) {
                    $examinateurName = $pfe->jury->examinateurUser->name;
                }
                if ($pfe->jury->presidentUser) {
                    $presidentName = $pfe->jury->presidentUser->name;
                }
            }

            $table->addCell(1500)->addText($examinateurName);
            $table->addCell(1500)->addText($presidentName);

            // Add final grade
            $table->addRow();
            $table->addCell(2000)->addText('Note finale', $boldStyle);
            $table->addCell(1500)->addText($this->formatNoteBareme($note->note_generale) . '/20');
            $table->addCell(1500)->addText('Mention', $boldStyle);
            $table->addCell(1500)->addText($this->getMention($note->note_generale));

            // Add signatures section
            $section->addTextBreak(2);
            $signatureTable = $section->addTable(['alignment' => 'center', 'width' => 100 * 50, 'unit' => 'pct']);
            $signatureTable->addRow();
            
            // Signature du Président
            $cellPresident = $signatureTable->addCell(5000);
            $cellPresident->addText('Signature du Président', $boldStyle, ['alignment' => 'left']);
            
            try {
                if ($pfe->jury && $pfe->jury->id_president) {
                    $presidentSignature = Signature::where('user_id', $pfe->jury->id_president)
                        ->where('is_active', true)
                        ->first();
                    
                    if ($presidentSignature && $presidentSignature->signature_data) {
                        // Get signature content from private storage
                        $imageContent = Storage::disk('private')->get($presidentSignature->signature_data);
                        
                        if ($imageContent) {
                            $tempImagePath = sys_get_temp_dir() . '/president_sig_' . uniqid() . '.png';
                            file_put_contents($tempImagePath, $imageContent);
                            
                            $cellPresident->addImage(
                                $tempImagePath,
                                [
                                    'width' => 100,
                                    'height' => 50,
                                    'alignment' => 'left'
                                ]
                            );
                            
                            // Clean up temp file
                            @unlink($tempImagePath);
                            
                            Log::info("Signature du président ajoutée au PV");
                        } else {
                            Log::warning("Impossible de récupérer la signature du président");
                        }
                    } else {
                        Log::info("Aucune signature active trouvée pour le président");
                    }
                } else {
                    Log::info("Jury ou président non trouvé pour le PFE");
                }
            } catch (\Exception $e) {
                Log::error("Erreur lors de l'ajout de la signature du président: " . $e->getMessage());
            }
            
            // Signature du Chef de Département (Responsable)
            $cellResponsable = $signatureTable->addCell(5000);
            $cellResponsable->addText('Signature du Chef de Département', $boldStyle, ['alignment' => 'right']);
            
            try {
                $option = Option::where('nom', $pfe->option)->first();
                
                if ($option && $option->id_responsable) {
                    $activeSignature = Signature::where('user_id', $option->id_responsable)
                        ->where('is_active', true)
                        ->first();
                    
                    if ($activeSignature && $activeSignature->signature_data) {
                        // Get signature content from private storage
                        $imageContent = Storage::disk('private')->get($activeSignature->signature_data);
                        
                        if ($imageContent) {
                            $tempImagePath = sys_get_temp_dir() . '/responsable_sig_' . uniqid() . '.png';
                            file_put_contents($tempImagePath, $imageContent);
                            
                            $cellResponsable->addImage(
                                $tempImagePath,
                                [
                                    'width' => 100,
                                    'height' => 50,
                                    'alignment' => 'right'
                                ]
                            );
                            
                            // Clean up temp file
                            @unlink($tempImagePath);
                            
                            Log::info("Signature du responsable ajoutée au PV pour l'option: {$pfe->option}");
                        } else {
                            Log::warning("Impossible de récupérer la signature du responsable");
                        }
                    } else {
                        Log::info("Aucune signature active trouvée pour le responsable de l'option: {$pfe->option}");
                    }
                } else {
                    Log::info("Option ou responsable non trouvé pour: {$pfe->option}");
                }
            } catch (\Exception $e) {
                Log::error("Erreur lors de l'ajout de la signature du responsable: " . $e->getMessage());
            }

            // Generate unique filename
            $filename = 'PV_' . str_replace(' ', '_', $pfe->intitule) . '_' . date('Y-m-d') . '.pdf';

            // Save to private storage as PDF
            $pdfPath = storage_path('app/private/pvs/' . $filename);
            
            // Set PDF renderer
            \PhpOffice\PhpWord\Settings::setPdfRendererPath(base_path('vendor/dompdf/dompdf'));
            \PhpOffice\PhpWord\Settings::setPdfRendererName('DomPDF');
            
            // Create PDF writer and save
            $pdfWriter = IOFactory::createWriter($phpWord, 'PDF');
            $pdfWriter->save($pdfPath);

            Log::info("PV généré avec succès: {$filename}");
            return $filename;
        } catch (\Exception $e) {
            Log::error("Erreur dans generatePv pour note ID {$note->id}: " . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            throw $e;
        }
    }

    private function addNoteCell($table, $values, $role, $bareme)
    {
        // Vérification si les données sont valides
        if (is_array($values) && isset($values[$role]) && isset($bareme)) {
            $note = $values[$role]['note'] ?? 0;
            $displayText = $this->formatNoteBareme($note) . '/' . $this->formatNoteBareme($bareme);
        } else {
            $displayText = '-';
        }
        $table->addCell(1500)->addText($displayText);
    }

    private function formatNoteBareme($value)
    {
        if (is_null($value))
            return '0';
        return (floor($value) == $value) ? number_format($value, 0) : number_format($value, 2);
    }

    private function getMention($note)
    {
        if ($note >= 16)
            return 'Très Bien';
        if ($note >= 14)
            return 'Bien';
        if ($note >= 12)
            return 'Assez Bien';
        if ($note >= 10)
            return 'Passable';
        return 'Insuffisant';
    }
}
