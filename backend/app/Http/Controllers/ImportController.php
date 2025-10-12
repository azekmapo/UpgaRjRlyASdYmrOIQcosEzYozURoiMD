<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Etudiant;
use App\Models\Enseignant;
use App\Models\Entreprise;
use App\Models\EmailImporteCsv;
use App\Models\Option;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Constants\Constants;

class ImportController extends Controller
{
    private const ETUDIANT_CSV_COLUMNS = ['Nom', 'Prénom', 'Email', 'Option', 'Moyenne'];
    private const ENSEIGNANT_CSV_COLUMNS = ['Nom', 'Prénom', 'Email', 'Grade', 'Date de Recrutement'];
    private const ENTREPRISE_CSV_COLUMNS = ['Nom', 'Prénom', 'Email', 'Dénomination'];

    public function importEtudiants(Request $request)
    {
        ini_set('max_execution_time', 1000);
        $request->validate([
            'file' => 'required|file|mimes:csv',
        ], [
            'file.required' => 'Veuillez sélectionner un fichier.',
            'file.mimes' => 'Le fichier doit être au format .csv.',
        ]);

        try {
            $validOptions = Option::pluck('nom')->toArray();
            $file = $request->file('file');
            $handle = fopen($file->getPathname(), 'r');
            $headers = fgetcsv($handle);

            if (!empty($headers[0])) {
                $headers[0] = preg_replace('/^\x{FEFF}/u', '', $headers[0]);
            }

            $missing_columns = array_diff(self::ETUDIANT_CSV_COLUMNS, $headers);

            if (!empty($missing_columns)) {
                fclose($handle);
                return response()->json([
                    'success' => false,
                    'message' => 'Colonnes manquantes dans le fichier CSV : ' . implode(', ', $missing_columns)
                ], 400);
            }

            $allData = [];
            $csvEmails = [];
            $duplicateEmailsInCsv = [];
            $existingEmailsInDb = [];
            $invalidOptions = [];
            $emptyFields = [];
            $invalidEmails = [];

            while (($data = fgetcsv($handle)) !== false) {
                $row = array_combine($headers, $data);
                $allData[] = $row;

                foreach (self::ETUDIANT_CSV_COLUMNS as $column) {
                    if (empty(trim($row[$column]))) {
                        $emptyFields[] = $column;
                    }
                }

                $email = trim($row['Email']);

                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $invalidEmails[] = $email;
                }

                if (in_array($email, $csvEmails)) {
                    $duplicateEmailsInCsv[] = $email;
                } else {
                    $csvEmails[] = $email;
                }

                if (User::where('email', $email)->exists()) {
                    $existingEmailsInDb[] = $email;
                }

                $option = trim($row['Option']);
                if (!in_array($option, $validOptions)) {
                    $invalidOptions[] = $option;
                }
            }

            fclose($handle);

            if (!empty($emptyFields)) {
                $uniqueEmptyFields = array_unique($emptyFields);
                return response()->json([
                    'success' => false,
                    'message' => 'Une erreur est survenue lors de l\'importation du fichier, car certains champs sont vides dans les colonnes suivantes : ' . implode(', ', $uniqueEmptyFields) . '.'
                ], 400);
            }

            if (!empty($invalidEmails)) {
                $uniqueInvalidEmails = array_unique($invalidEmails);
                return response()->json([
                    'success' => false,
                    'message' => 'Une erreur est survenue lors de l\'importation du fichier, car certaines adresses e-mail sont invalides : ' . implode(', ', $uniqueInvalidEmails) . '.'
                ], 400);
            }

            if (!empty($duplicateEmailsInCsv)) {
                $uniqueDuplicates = array_unique($duplicateEmailsInCsv);
                return response()->json([
                    'success' => false,
                    'message' => 'Une erreur est survenue lors de l\'importation du fichier, car il y a des emails dupliqués dans le CSV (' . implode(', ', $uniqueDuplicates) . ').'
                ], 400);
            }

            if (!empty($existingEmailsInDb)) {
                $uniqueExisting = array_unique($existingEmailsInDb);
                return response()->json([
                    'success' => false,
                    'message' => 'Une erreur est survenue lors de l\'importation du fichier, car ces emails existent déjà en base (' . implode(', ', $uniqueExisting) . ').'
                ], 400);
            }

            if (!empty($invalidOptions)) {
                $uniqueInvalidOptions = array_unique($invalidOptions);
                return response()->json([
                    'success' => false,
                    'message' => 'Une erreur est survenue lors de l\'importation du fichier, car il y a des options invalides (' . implode(', ', $uniqueInvalidOptions) . '). Options autorisées : ' . implode(', ', $validOptions) . '.'
                ], 400);
            }

            DB::transaction(function () use ($allData) {
                foreach ($allData as $row) {
                    $password = Str::random(12);

                    $user = User::create([
                        'name' => trim($row['Nom']) . ' ' . trim($row['Prénom']),
                        'email' => trim($row['Email']),
                        'password' => bcrypt($password),
                        'role' => 'etudiant',
                    ]);

                    Etudiant::create([
                        'id' => $user->id,
                        'option' => trim($row['Option']),
                        'moyenne' => $row['Moyenne'],
                    ]);

                    EmailImporteCsv::create([
                        'role' => $user->role,
                        'name' => $user->name,
                        'email' => $user->email,
                        'password' => $password
                    ]);
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Les étudiants ont été importés avec succès.'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de l\'importation du fichier.'
            ], 500);
        }
    }

    public function importEnseignants(Request $request)
    {
        ini_set('max_execution_time', 1000);
        $request->validate([
            'file' => 'required|file|mimes:csv',
        ], [
            'file.required' => 'Veuillez sélectionner un fichier.',
            'file.mimes' => 'Le fichier doit être au format .csv.',
        ]);

        try {
            $file = $request->file('file');
            $handle = fopen($file->getPathname(), 'r');
            $headers = fgetcsv($handle);

            if (!empty($headers[0])) {
                $headers[0] = preg_replace('/^\x{FEFF}/u', '', $headers[0]);
            }

            $missing_columns = array_diff(self::ENSEIGNANT_CSV_COLUMNS, $headers);

            if (!empty($missing_columns)) {
                fclose($handle);
                return response()->json([
                    'success' => false,
                    'message' => 'Colonnes manquantes dans le fichier CSV : ' . implode(', ', $missing_columns)
                ], 400);
            }

            $allData = [];
            $csvEmails = [];
            $duplicateEmailsInCsv = [];
            $existingEmailsInDb = [];
            $invalidGrades = [];
            $invalidDates = [];
            $emptyFields = [];
            $invalidEmails = [];

            while (($data = fgetcsv($handle)) !== false) {
                $row = array_combine($headers, $data);
                $allData[] = $row;

                foreach (self::ENSEIGNANT_CSV_COLUMNS as $column) {
                    if (empty(trim($row[$column]))) {
                        $emptyFields[] = $column;
                    }
                }

                $email = strtolower(trim($row['Email']));

                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $invalidEmails[] = $email;
                }

                if (in_array($email, $csvEmails)) {
                    $duplicateEmailsInCsv[] = $email;
                } else {
                    $csvEmails[] = $email;
                }

                if (User::where('email', $email)->exists()) {
                    $existingEmailsInDb[] = $email;
                }

                $grade = trim($row['Grade']);
                if (!in_array($grade, Constants::TEACHER_GRADES)) {
                    $invalidGrades[] = $grade;
                }

                $dateRecrutement = trim($row['Date de Recrutement']);
                if (!preg_match('/^\d{2}\/\d{2}\/\d{4}$/', $dateRecrutement)) {
                    $invalidDates[] = $dateRecrutement;
                } else {
                    $dateParts = explode('/', $dateRecrutement);
                    if (!checkdate($dateParts[1], $dateParts[0], $dateParts[2])) {
                        $invalidDates[] = $dateRecrutement;
                    }
                }
            }

            fclose($handle);

            if (!empty($emptyFields)) {
                $uniqueEmptyFields = array_unique($emptyFields);
                return response()->json([
                    'success' => false,
                    'message' => 'Une erreur est survenue lors de l\'importation du fichier, car certains champs sont vides dans les colonnes suivantes : ' . implode(', ', $uniqueEmptyFields) . '.'
                ], 400);
            }

            if (!empty($invalidEmails)) {
                $uniqueInvalidEmails = array_unique($invalidEmails);
                return response()->json([
                    'success' => false,
                    'message' => 'Une erreur est survenue lors de l\'importation du fichier, car certaines adresses e-mail sont invalides : ' . implode(', ', $uniqueInvalidEmails) . '.'
                ], 400);
            }

            if (!empty($duplicateEmailsInCsv)) {
                $uniqueDuplicates = array_unique($duplicateEmailsInCsv);
                return response()->json([
                    'success' => false,
                    'message' => 'Une erreur est survenue lors de l\'importation du fichier, car il y a des emails dupliqués dans le CSV (' . implode(', ', $uniqueDuplicates) . ').'
                ], 400);
            }

            if (!empty($existingEmailsInDb)) {
                $uniqueExisting = array_unique($existingEmailsInDb);
                return response()->json([
                    'success' => false,
                    'message' => 'Une erreur est survenue lors de l\'importation du fichier, car ces emails existent déjà en base (' . implode(', ', $uniqueExisting) . ').'
                ], 400);
            }

            if (!empty($invalidGrades)) {
                $uniqueInvalidGrades = array_unique($invalidGrades);
                return response()->json([
                    'success' => false,
                    'message' => 'Une erreur est survenue lors de l\'importation du fichier, car il y a des grades invalides (' . implode(', ', $uniqueInvalidGrades) . '). Grades autorisés : ' . implode(', ', Constants::TEACHER_GRADES) . '.'
                ], 400);
            }

            if (!empty($invalidDates)) {
                $uniqueInvalidDates = array_unique($invalidDates);
                return response()->json([
                    'success' => false,
                    'message' => 'Une erreur est survenue lors de l\'importation du fichier, car il y a des dates de recrutement invalides (' . implode(', ', $uniqueInvalidDates) . '). Format attendu : JJ/MM/AAAA (ex: 11/09/2020).'
                ], 400);
            }

            DB::transaction(function () use ($allData) {
                foreach ($allData as $row) {
                    $password = Str::random(12);

                    $user = User::create([
                        'name' => trim($row['Nom']) . ' ' . trim($row['Prénom']),
                        'email' => strtolower(trim($row['Email'])),
                        'password' => bcrypt($password),
                        'role' => 'enseignant',
                    ]);

                    $dateRecrutement = trim($row['Date de Recrutement']);
                    $dateParts = explode('/', $dateRecrutement);
                    $formattedDate = $dateParts[2] . '-' . $dateParts[1] . '-' . $dateParts[0];

                    Enseignant::create([
                        'id' => $user->id,
                        'grade' => trim($row['Grade']),
                        'is_responsable' => false,
                        'date_recrutement' => $formattedDate,
                    ]);

                    EmailImporteCsv::create([
                        'role' => $user->role,
                        'name' => $user->name,
                        'email' => $user->email,
                        'password' => $password
                    ]);
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Les enseignants ont été importés avec succès.'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de l\'importation du fichier.'
            ], 500);
        }
    }

    public function importEntreprises(Request $request)
    {
        ini_set('max_execution_time', 1000);
        $request->validate([
            'file' => 'required|file|mimes:csv',
        ], [
            'file.required' => 'Veuillez sélectionner un fichier.',
            'file.mimes' => 'Le fichier doit être au format .csv.',
        ]);

        try {
            $file = $request->file('file');
            $handle = fopen($file->getPathname(), 'r');
            $headers = fgetcsv($handle);

            if (!empty($headers[0])) {
                $headers[0] = preg_replace('/^\x{FEFF}/u', '', $headers[0]);
            }

            $missing_columns = array_diff(self::ENTREPRISE_CSV_COLUMNS, $headers);

            if (!empty($missing_columns)) {
                fclose($handle);
                return response()->json([
                    'success' => false,
                    'message' => 'Colonnes manquantes dans le fichier CSV : ' . implode(', ', $missing_columns)
                ], 400);
            }

            $allData = [];
            $csvEmails = [];
            $duplicateEmailsInCsv = [];
            $existingEmailsInDb = [];
            $emptyFields = [];
            $invalidEmails = [];

            while (($data = fgetcsv($handle)) !== false) {
                $row = array_combine($headers, $data);
                $allData[] = $row;

                foreach (self::ENTREPRISE_CSV_COLUMNS as $column) {
                    if (empty(trim($row[$column]))) {
                        $emptyFields[] = $column;
                    }
                }

                $email = strtolower(trim($row['Email']));

                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $invalidEmails[] = $email;
                }

                if (in_array($email, $csvEmails)) {
                    $duplicateEmailsInCsv[] = $email;
                } else {
                    $csvEmails[] = $email;
                }

                if (User::where('email', $email)->exists()) {
                    $existingEmailsInDb[] = $email;
                }
            }

            fclose($handle);

            if (!empty($emptyFields)) {
                $uniqueEmptyFields = array_unique($emptyFields);
                return response()->json([
                    'success' => false,
                    'message' => 'Une erreur est survenue lors de l\'importation du fichier, car certains champs sont vides dans les colonnes suivantes : ' . implode(', ', $uniqueEmptyFields) . '.'
                ], 400);
            }

            if (!empty($invalidEmails)) {
                $uniqueInvalidEmails = array_unique($invalidEmails);
                return response()->json([
                    'success' => false,
                    'message' => 'Une erreur est survenue lors de l\'importation du fichier, car certaines adresses e-mail sont invalides : ' . implode(', ', $uniqueInvalidEmails) . '.'
                ], 400);
            }

            if (!empty($duplicateEmailsInCsv)) {
                $uniqueDuplicates = array_unique($duplicateEmailsInCsv);
                return response()->json([
                    'success' => false,
                    'message' => 'Une erreur est survenue lors de l\'importation du fichier, car il y a des emails dupliqués dans le CSV (' . implode(', ', $uniqueDuplicates) . ').'
                ], 400);
            }

            if (!empty($existingEmailsInDb)) {
                $uniqueExisting = array_unique($existingEmailsInDb);
                return response()->json([
                    'success' => false,
                    'message' => 'Une erreur est survenue lors de l\'importation du fichier, car ces emails existent déjà en base (' . implode(', ', $uniqueExisting) . ').'
                ], 400);
            }

            DB::transaction(function () use ($allData) {
                foreach ($allData as $row) {
                    $password = Str::random(12);

                    $user = User::create([
                        'name' => trim($row['Nom']) . ' ' . trim($row['Prénom']),
                        'email' => strtolower(trim($row['Email'])),
                        'password' => bcrypt($password),
                        'role' => 'entreprise',
                    ]);

                    Entreprise::create([
                        'id' => $user->id,
                        'denomination' => trim($row['Dénomination']),
                    ]);

                    EmailImporteCsv::create([
                        'role' => $user->role,
                        'name' => $user->name,
                        'email' => $user->email,
                        'password' => $password
                    ]);
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Les entreprises ont été importées avec succès.'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de l\'importation du fichier'
            ], 500);
        }
    }
}