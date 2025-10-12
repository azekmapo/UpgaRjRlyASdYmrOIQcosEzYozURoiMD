<?php

namespace App\Http\Controllers;

use App\Models\Periode;
use App\Models\TemplatesPeriode;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\AutomationEmail;
use App\Models\PlanificationEmail;

class EnvoiEmailsController extends Controller
{
    public function goToEnvoiEmails()
    {
        try {
            $periodes = Periode::orderBy('id', 'asc')->get();
            $templatesPeriodes = TemplatesPeriode::all();

            return response()->json([
                'periodes' => $periodes,
                'templatesPeriodes' => $templatesPeriodes,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erreur lors du chargement des periodes et des templates'
            ], 500);
        }
    }

    public function goToListEmails(Request $request)
    {
        try {
            $automationEmails = AutomationEmail::all();
            $emailsPlanifies = PlanificationEmail::all();
            $periodes = Periode::orderBy('id', 'asc')->get();

            return response()->json([
                'automation_emails' => $automationEmails,
                'emails_planifies' => $emailsPlanifies,
                'periodes' => $periodes,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erreur lors du chargement des données'
            ], 500);
        }
    }

    public function suppAutomatisation($automationId)
    {
        try {
            $automation = AutomationEmail::findOrFail($automationId);

            $automation->delete();

            return response()->json([
                'success' => true,
                'message' => 'L\'automation a été supprimée avec succès'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Automation introuvable'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erreur lors de la suppression de l\'automation'
            ], 500);
        }
    }

    public function envoiEmails(Request $request)
    {
        $request->validate([
            'frequence' => 'required|numeric|min:1',
            'template_selectionne' => 'required|string',
            'email_objet' => 'required|string|max:255',
            'email_contenu' => 'required|string',
            'date_debut' => 'date_format:Y-m-d\TH:i|nullable',
            'date_fin' => 'date_format:Y-m-d\TH:i|nullable',
            'periode' => 'required|exists:periodes,id',
            'destinataires' => 'string|nullable',
        ]);

        try {
            if ($request->template_selectionne != 'email_personnalisé') {
                $periode = Periode::findOrFail($request->periode);
                $dateDebut = Carbon::parse($periode->date_debut);
                $dateFin = Carbon::parse($periode->date_fin);
            } else {
                $dateDebut = Carbon::parse($request->date_debut);
                $dateFin = Carbon::parse($request->date_fin);
            }

            $now = Carbon::now();

            if ($dateFin->lt($now) || $dateDebut->gt($dateFin)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Les dates entrées sont incorrectes !'
                ], 422);
            }

            if ($dateDebut->lt($now)) {
                $dateDebut = $now;
            }

            $templateId = intval($request->template_selectionne);
            $template = TemplatesPeriode::where('id', $templateId);
            $numero_template = $request->template_selectionne;

            if ($request->template_selectionne != 'email_personnalisé') {
                $numero_template = $template->value('numero_template');
                $destinataires = $template->value('distinataires');
            } else {
                $destinataires = $request->destinataires;
            }

            $p = ($request->template_selectionne == 'email_personnalisé') ? '/' : $request->periode;

            DB::beginTransaction();

            $automation = AutomationEmail::create([
                'periode' => $p,
                'date_debut' => $dateDebut,
                'date_fin' => $dateFin,
                'template' => $numero_template,
                'email_objet' => $request->email_objet,
                'email_contenu' => $request->email_contenu,
                'frequence' => $request->frequence,
                'description' => $destinataires,
                'status' => 'en_attente'
            ]);

            $dureeTotal = $dateDebut->diffInMinutes($dateFin);
            $planifications = [];

            for ($i = 0; $i < $request->frequence; $i++) {
                $progression = $request->frequence > 1 ? ($i / ($request->frequence - 1)) : 0;
                $minutesAjoutees = round($dureeTotal * $progression);
                $dateEnvoi = $dateDebut->copy()->addMinutes($minutesAjoutees);

                if ($i === 0) {
                    $dateEnvoi->addMinutes(10);
                }

                if ($i === $request->frequence - 1) {
                    $dateEnvoi = $dateFin->copy();
                }

                $planifications[] = [
                    'automation_id' => $automation->id,
                    'date_envoi_planifie' => $dateEnvoi,
                    'status' => 'en_attente',
                    'created_at' => now(),
                    'updated_at' => now()
                ];
            }

            PlanificationEmail::insert($planifications);
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'L\'automation a été créée avec succès'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'automation'
            ], 500);
        }
    }
}
