<?php
// app/Http/Controllers/EmailFicheVoeux.php
namespace App\Http\Controllers;

use App\Mail\ResultatFicheVoeux;
use App\Models\{PFE, User};
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Collection;

class EmailFicheVoeux extends Controller
{
    public function sendPfeEmails()
    {
        try {
            // Send to Enseignants who are encadrant or co-encadrant
            $this->sendEnseignantEmails();
            
            // Send to Students
            $this->sendStudentEmails();
            
            Log::info('PFE distribution emails sent successfully');
        } catch (\Exception $e) {
            Log::error('Error sending PFE emails: ' . $e->getMessage());
            throw $e;
        }
    }

    private function sendEnseignantEmails(): void
    {
        // Get all enseignants with their PFEs in a single optimized query
        $enseignantsWithPfes = User::where('role', 'enseignant')
            ->whereHas('enseignant', function ($query) {
                $query->whereHas('pfeAsEncadrant')
                    ->orWhereHas('pfeAsCoEncadrant');
            })
            ->with([
                'enseignant.pfeAsEncadrant.group.student1.user',
                'enseignant.pfeAsEncadrant.group.student2.user',
                'enseignant.pfeAsCoEncadrant.group.student1.user',
                'enseignant.pfeAsCoEncadrant.group.student2.user'
            ])
            ->get();

        foreach ($enseignantsWithPfes as $enseignant) {
            // Combine PFEs from both encadrant and co-encadrant relationships
            $pfesAsEncadrant = $enseignant->enseignant->pfeAsEncadrant ?? collect();
            $pfesAsCoEncadrant = $enseignant->enseignant->pfeAsCoEncadrant ?? collect();
            
            $allPfes = $pfesAsEncadrant->merge($pfesAsCoEncadrant);
            
            if ($allPfes->isNotEmpty()) {
                Log::info('Sending email to enseignant ' . $enseignant->name);
                Mail::to($enseignant->email)
                    ->send(new ResultatFicheVoeux(
                        pfes: $allPfes,
                        recipient: $enseignant,
                        isEnseignant: true
                    ));
            }
        }
    }

    private function sendStudentEmails(): void
    {
        // Get all students with their groups and PFEs in a single optimized query
        $studentsWithPfes = User::where('role', 'etudiant')
            ->whereHas('etudiant', function ($query) {
                $query->whereHas('groupsAsStudent1.pfe')
                    ->orWhereHas('groupsAsStudent2.pfe');
            })
            ->with([
                'etudiant.groupsAsStudent1.pfe',
                'etudiant.groupsAsStudent2.pfe'
            ])
            ->get();

        foreach ($studentsWithPfes as $student) {
            $etudiant = $student->etudiant;
            
            if (!$etudiant) {
                continue;
            }

            // Get the student's group (they should only be in one group with a PFE)
            $groupsAsStudent1 = $etudiant->groupsAsStudent1?? collect();
            $groupsAsStudent2 = $etudiant->groupsAsStudent2 ?? collect();
            
            $allGroups = $groupsAsStudent1->merge($groupsAsStudent2);
            $groupWithPfe = $allGroups->first(function ($group) {
                return $group->pfe !== null;
            });

            if ($groupWithPfe && $groupWithPfe->pfe) {
                Log::info('Sending email to student ' . $student->name);
                Mail::to($student->email)
                    ->send(new ResultatFicheVoeux(
                        pfes: collect([$groupWithPfe->pfe]),
                        recipient: $student,
                        isEnseignant: false
                    ));
            }
        }
    }
}