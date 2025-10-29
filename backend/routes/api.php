<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\ChoixPFEController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\SessionController;
use App\Http\Controllers\Api\NotificationUserController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PropositionController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\PeriodeController;
use App\Http\Controllers\CalendrierController;
use App\Http\Controllers\EncadrementController;
use App\Http\Controllers\SoutenanceController;
use App\Http\Controllers\ForgotPasswordController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\EnvoiEmailsController;
use App\Http\Controllers\GetAllUsersController;
use App\Http\Controllers\ManageUsersController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\ManagePropositionsController;
use App\Http\Controllers\JuryController;
use App\Http\Controllers\ResponsableController;
use App\Http\Controllers\NotationController;
use App\Http\Controllers\OptionController;
use App\Http\Controllers\SignatureController;
use App\Http\Middleware\CheckRoleAndPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'timestamp' => now()->toISOString(),
        'environment' => app()->environment(),
        'version' => config('app.version', '1.0.0'),
    ]);
});

// Public download endpoint with token
Route::get('/download-pvs-token/{token}', [NotationController::class, 'downloadPvsWithToken'])->name('api.download.pvs.token');

// Public period endpoints
Route::get('/periods', [PeriodeController::class, 'index']);
Route::get('/current-period', [PeriodeController::class, 'getCurrentPeriodes']);

Route::get('/profile/picture', [ProfileController::class, 'getProfilePicture']);

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {
    // Public auth routes
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetCode']);
    Route::post('/verify-code', [ForgotPasswordController::class, 'verifyCode']);
    Route::post('/change-password', [ForgotPasswordController::class, 'changePassword']);
    
    // Protected auth routes (require authentication)
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

/*
|--------------------------------------------------------------------------
| Protected Routes (Require Authentication)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum'])->group(function () {
    // Notification users
    Route::get('/notification-users', [NotificationUserController::class, 'index']);

    // Sessions
    Route::get('/sessions', [SessionController::class, 'index']);
    Route::get('/sessions/admin', [SessionController::class, 'indexAdmin']);
    Route::post('/sessions/update', [SessionController::class, 'updateSession']);
    Route::get('/sessions/export', [SessionController::class, 'downloadExcel']);

    Route::get('/choix-pfe', [ChoixPFEController::class, 'index']);
    Route::post('/choix-pfe', [ChoixPFEController::class, 'store']);
    Route::put('/choix-pfe', [ChoixPFEController::class, 'update']);
    Route::delete('/choix-pfe', [ChoixPFEController::class, 'destroy']);

    Route::get('/notifications/{userId}', [NotificationController::class, 'index']);
    Route::post('/notifications/create', [NotificationController::class, 'store']);
    Route::delete('/notifications/delete/{id}/{userId}', [NotificationController::class, 'destroy']);
    Route::post('/notifications/proposition/respond', [NotificationController::class, 'handlePropositionResponse']);

    Route::get('/propositions', [PropositionController::class, 'index']);
    Route::get('/propositions/enseignantss', [PropositionController::class, 'getAllEnseignants']);
    Route::get('/propositions/enseignant', [PropositionController::class, 'getEnseignantPropositions']);
    Route::post('/propositions/enseignant', [PropositionController::class, 'storeEnseignantProposition']);
    Route::put('/propositions/enseignant/{id}', [PropositionController::class, 'updateEnseignantProposition']);
    Route::delete('/propositions/enseignant/{id}', [PropositionController::class, 'deleteEnseignantProposition']);
    Route::post('/propositions/etudiant', [PropositionController::class, 'storeEtudiantProposition']);
    Route::put('/propositions/etudiant/{id}', [PropositionController::class, 'updateEtudiantProposition']);
    Route::delete('/propositions/etudiant/{id}', [PropositionController::class, 'deleteEtudiantProposition']);
    Route::post('/propositions/entreprise', [PropositionController::class, 'storeEntrepriseProposition']);
    Route::put('/propositions/entreprise/{id}', [PropositionController::class, 'updateEntrepriseProposition']);
    Route::delete('/propositions/entreprise/{id}', [PropositionController::class, 'deleteEntrepriseProposition']);

    Route::get('/calendrier', [CalendrierController::class, 'index']);

    Route::get('/admin/dashboard', [AdminDashboardController::class, 'index']);

    Route::get('/groups/has-group/{userId}', [GroupController::class, 'hasGroup']);
    Route::post('/groups/user-info', [GroupController::class, 'getUserGroupInfo']);
    Route::get('/groups/available-students', [GroupController::class, 'getAvailableStudents']);
    Route::get('/groups/pending-invitations', [GroupController::class, 'getPendingInvitations']);
    Route::post('/groups/invite', [GroupController::class, 'createGroupInvitation']);
    Route::post('/groups/respond', [GroupController::class, 'handleInviteGroupResponse']);
    Route::delete('/groups/invite/cancel', [GroupController::class, 'cancelGroupInvitation']);

    Route::get('/encadrement', [EncadrementController::class, 'index']);
    Route::post('/encadrement/choices', [EncadrementController::class, 'submitChoices']);
    Route::delete('/encadrement/co-encadrant/{pfeId}', [EncadrementController::class, 'removeCoEncadrant']);

    Route::get('/soutenances', [SoutenanceController::class, 'index']);
    Route::post('/soutenances', [SoutenanceController::class, 'store']);
    Route::get('/soutenances/generation-status', [SoutenanceController::class, 'getGenerationStatus']);
    Route::put('/soutenances/{id}', [SoutenanceController::class, 'update']);
    Route::patch('/soutenances/{id}/time', [SoutenanceController::class, 'updateTime']);
    Route::delete('/soutenances/{id}', [SoutenanceController::class, 'destroy']);

    Route::get('/etudiant/profile', [ProfileController::class, 'getProfileEtudiant'])
    ->middleware(CheckRoleAndPeriod::class . ':etudiant,tout');
    Route::get('/enseignant/profile', [ProfileController::class, 'getProfileEnseignant'])
    ->middleware(CheckRoleAndPeriod::class . ':enseignant,tout');
    Route::get('/entreprise/profile', [ProfileController::class, 'getProfileEntreprise'])
    ->middleware(CheckRoleAndPeriod::class . ':entreprise,tout');
    Route::get('/admin/profile', [ProfileController::class, 'getProfileAdmin'])
    ->middleware(CheckRoleAndPeriod::class . ':admin,tout');
    Route::patch('/profile/change-password', [ProfileController::class, 'changePassword'])
    ->middleware(CheckRoleAndPeriod::class . ':tout,tout');
    Route::post('/profile/upload-picture', [ProfileController::class, 'uploadProfilePicture'])
    ->middleware(CheckRoleAndPeriod::class . ':tout,tout');
    Route::delete('/profile/delete-picture', [ProfileController::class, 'deleteProfilePicture'])
    ->middleware(CheckRoleAndPeriod::class . ':tout,tout');

    Route::get('/emails', [EnvoiEmailsController::class, 'goToListEmails'])
    ->middleware(CheckRoleAndPeriod::class . ':admin,tout');
    Route::delete('/suppAutomatisation/{automationId}', [EnvoiEmailsController::class, 'suppAutomatisation'])
    ->middleware(CheckRoleAndPeriod::class . ':admin,tout');
    Route::get('/envoi-emails', [EnvoiEmailsController::class, 'goToEnvoiEmails'])
    ->middleware(CheckRoleAndPeriod::class . ':admin,tout');
    Route::post('/envoiEmails', [EnvoiEmailsController::class, 'envoiEmails'])
    ->middleware(CheckRoleAndPeriod::class . ':admin,tout');

    Route::get('/utilisateurs', [GetAllUsersController::class, 'index'])
    ->middleware(CheckRoleAndPeriod::class . ':admin,tout');
    Route::get('/utilisateurs/enseignants', [GetAllUsersController::class, 'getEnseignants'])
    ->middleware(CheckRoleAndPeriod::class . ':admin,tout');
    Route::get('/utilisateurs/entreprises', [GetAllUsersController::class, 'getEntreprises'])
    ->middleware(CheckRoleAndPeriod::class . ':admin,tout');
    Route::delete('/utilisateurs/{id}', [GetAllUsersController::class, 'destroy'])
    ->middleware(CheckRoleAndPeriod::class . ':admin,tout');
    Route::post('/addEtudiant', [ManageUsersController::class, 'addEtudiant'])
    ->middleware(CheckRoleAndPeriod::class . ':admin,tout');
    Route::post('/addEnseignant', [ManageUsersController::class, 'addEnseignant'])
    ->middleware(CheckRoleAndPeriod::class . ':admin,tout');
    Route::post('/addEntreprise', [ManageUsersController::class, 'addEntreprise'])
    ->middleware(CheckRoleAndPeriod::class . ':admin,tout');
    Route::patch('/updateEtudiant', [ManageUsersController::class, 'updateEtudiant'])
    ->middleware(CheckRoleAndPeriod::class . ':admin,tout');
    Route::patch('/updateEnseignant', [ManageUsersController::class, 'updateEnseignant'])
    ->middleware(CheckRoleAndPeriod::class . ':admin,tout');
    Route::patch('/updateEntreprise', [ManageUsersController::class, 'updateEntreprise'])
    ->middleware(CheckRoleAndPeriod::class . ':admin,tout');
    Route::post('/import-etudiants', [ImportController::class, 'importEtudiants'])
    ->middleware(CheckRoleAndPeriod::class . ':admin,tout');
    Route::post('/import-enseignants', [ImportController::class, 'importEnseignants'])
    ->middleware(CheckRoleAndPeriod::class . ':admin,tout');
    Route::post('/import-entreprises', [ImportController::class, 'importEntreprises'])
    ->middleware(CheckRoleAndPeriod::class . ':admin,tout');

    Route::get('/propositions/etudiants', [ManagePropositionsController::class, 'getPropositionsEtudiants'])
    ->middleware(CheckRoleAndPeriod::class . ':responsable,3');
    Route::get('/propositions/enseignants', [ManagePropositionsController::class, 'getPropositionsEnseignants'])
    ->middleware(CheckRoleAndPeriod::class . ':responsable,3');
    Route::get('/propositions/entreprises', [ManagePropositionsController::class, 'getPropositionsEntreprises'])
    ->middleware(CheckRoleAndPeriod::class . ':responsable,3');
    Route::post('/propositions/etudiants/accept', [ManagePropositionsController::class, 'acceptPropositionEtudiant'])
    ->middleware(CheckRoleAndPeriod::class . ':responsable,3');
    Route::post('/propositions/etudiants/decline', [ManagePropositionsController::class, 'declinePropositionEtudiant'])
    ->middleware(CheckRoleAndPeriod::class . ':responsable,3');
    Route::post('/propositions/enseignants/accept', [ManagePropositionsController::class, 'acceptPropositionEnseignant'])
    ->middleware(CheckRoleAndPeriod::class . ':responsable,3');
    Route::post('/propositions/enseignants/decline', [ManagePropositionsController::class, 'declinePropositionEnseignant'])
    ->middleware(CheckRoleAndPeriod::class . ':responsable,3');
    Route::post('/propositions/entreprises/accept', [ManagePropositionsController::class, 'acceptPropositionEntreprise'])
    ->middleware(CheckRoleAndPeriod::class . ':responsable,3');
    Route::post('/propositions/entreprises/decline', [ManagePropositionsController::class, 'declinePropositionEntreprise'])
    ->middleware(CheckRoleAndPeriod::class . ':responsable,3');

    Route::get('/jury', [JuryController::class, 'index']);
    Route::post('/jury/submit-choices', [JuryController::class, 'submitChoices']);

    Route::get('/enseignants/responsable', [ResponsableController::class, 'getEnseignantsForResponsable'])
    ->middleware(CheckRoleAndPeriod::class . ':admin,tout');
    Route::patch('/enseignants/responsable', [ResponsableController::class, 'updateResponsable'])
    ->middleware(CheckRoleAndPeriod::class . ':admin,tout');

    // Bareme management routes
    Route::post('/bareme', [NotationController::class, 'store']);
    Route::get('/bareme', [NotationController::class, 'getBaremeByRole']);
    
    // Teacher evaluation routes
    Route::get('/evaluation/data', [NotationController::class, 'getEvaluationData']);
    Route::get('/evaluation/existing-notes', [NotationController::class, 'getExistingNotes']);
    Route::post('/evaluation/note', [NotationController::class, 'storeNote']);

    // Periodes management
    Route::put('/periodes/{id}', [PeriodeController::class, 'update']);

    Route::get('/dashboard/periode-active', [PeriodeController::class, 'getPeriodeActive'])
    ->middleware(CheckRoleAndPeriod::class . ':etudiant+enseignant+entreprise,tout');
    
    Route::prefix('signatures')->group(function () {
        Route::get('/user/{userId}', [SignatureController::class, 'index']);
        Route::get('/image/{filename}', [SignatureController::class, 'getSignatureImage']);
        Route::get('/image-direct/{filename}', [SignatureController::class, 'getSignatureImageDirect'])->where('filename', '.*');
        Route::get('/serve/{filename}', [SignatureController::class, 'serveSignature'])->name('signatures.serve')->middleware('auth:sanctum');
        Route::post('/create-signature/{userId}', [SignatureController::class, 'store']);
        Route::post('/{userId}/activate/{signatureId}', [SignatureController::class, 'activate']);
        Route::put('/update-signature/{id}', [SignatureController::class, 'update']);
        Route::delete('/delete-signature/{id}', [SignatureController::class, 'destroy']);
    });
    
    Route::get('/options', [OptionController::class, 'index']);
    Route::get('/options/{id}', [OptionController::class, 'show']);
    Route::post('/options', [OptionController::class, 'store']);
    Route::put('/options/{id}', [OptionController::class, 'update']);
    Route::delete('/options/{id}', [OptionController::class, 'destroy']);

    Route::get('/email-validations/{id}', [NotificationController::class, 'getEmailValidation'])
    ->middleware(CheckRoleAndPeriod::class . ':etudiant+enseignant+entreprise,4');
    Route::get('/email-automations/{id}', [NotificationController::class, 'getEmailAutomation'])
    ->middleware(CheckRoleAndPeriod::class . ':etudiant+enseignant+entreprise,tout');

});
