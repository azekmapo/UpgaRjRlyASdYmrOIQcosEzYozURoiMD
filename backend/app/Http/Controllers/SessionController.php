<?php
namespace App\Http\Controllers;

use App\Models\Pfe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Illuminate\Support\Facades\Storage;

class SessionController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $enseignant = $user->enseignant;

        if (!$enseignant) {
            return response()->json([
                'error' => 'Accès non autorisé'
            ], 403);
        }

        $pfes = Pfe::where('id_encadrant', $enseignant->id)
    ->orderBy('id', 'asc') // Ajoute ce tri ici
    ->get()
    ->map(function ($pfe) {
        return [
            'id' => $pfe->id,
            'intitule' => $pfe->intitule,
            'option' => $pfe->option,
            'type_sujet' => $pfe->type_sujet,
            'session' => $pfe->session,
        ];
    });

        return response()->json([
            'pfes' => $pfes,
            'sessionStatus' => session('sessionStatus')
        ]);
    }

    public function indexAdmin()
    {
        $pfes = Pfe::all()->map(function ($pfe) {
            return [
                'id' => $pfe->id,
                'intitule' => $pfe->intitule,
                'option' => $pfe->option,
                'type_sujet' => $pfe->type_sujet,
                'session' => $pfe->session,
            ];
        });

        return response()->json([
            'pfes' => $pfes,
        ]);
    }

    public function updateSession(Request $request)
    {
        $request->validate([
            'pfe_id' => 'required|exists:pfes,id',
            'session' => 'required|in:session 1,session 2',
        ]);

        $pfe = Pfe::findOrFail($request->pfe_id);
        
        // Verify that the authenticated user is the supervisor
        if ($pfe->id_encadrant !== Auth::user()->enseignant->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'êtes pas autorisé à modifier cette session'
            ], 403);
        }

        try {
            $pfe->session = $request->session;
            $pfe->save();
            return response()->json([
                'success' => true,
                'message' => 'Session mise à jour avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de la session',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    public function downloadExcel()
    {
        $pfes = Pfe::select('intitule', 'option', 'type_sujet', 'session')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Set headers
        $sheet->setCellValue('A1', "L'intitulé");
        $sheet->setCellValue('B1', "L'option");
        $sheet->setCellValue('C1', 'Type');
        $sheet->setCellValue('D1', 'Sessions');

        // Add data
        $row = 2;
        foreach ($pfes as $pfe) {
            $sheet->setCellValue('A' . $row, $pfe->intitule);
            $sheet->setCellValue('B' . $row, $pfe->option);
            $sheet->setCellValue('C' . $row, $pfe->type_sujet);
            $sheet->setCellValue('D' . $row, $pfe->session);
            $row++;
        }

        // Auto-size columns
        foreach (range('A', 'D') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        // Create a temporary file
        $tempFile = 'sessions_pfe_' . time() . '.xlsx';
        $tempPath = sys_get_temp_dir() . '/' . $tempFile;
        
        // Create the Excel file
        $writer = new Xlsx($spreadsheet);
        $writer->save($tempPath);
        
        // Return file as download response
        return response()->download($tempPath, 'sessions_pfe.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="sessions_pfe.xlsx"'
        ])->deleteFileAfterSend(true);
    }
}