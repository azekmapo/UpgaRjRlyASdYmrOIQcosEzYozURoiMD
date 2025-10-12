<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TemplatesPeriodesSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'numero_template' => 1,
                'id_periode' => 1,
                'distinataires' => 'Les étudiants sans binôme',
                'objet' => 'Les étudiants sans binôme pour le PFE',
                'contenu' => "Salut,\r\n\r\nNos registres indiquent que vous ne faites pas encore partie d'un binôme pour le projet de fin d'études.\r\n\r\nNous vous invitons si vous voulez à choisir un camarade et à enregistrer votre binôme sur la plateforme avant la date fixée, afin de poursuivre sereinement le processus académique.\r\n\r\nCordialement",
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'numero_template' => 1,
                'id_periode' => 2,
                'distinataires' => 'Les étudiants, enseignants et entreprises sans proposition',
                'objet' => 'Proposition de sujet de PFE : appel à participation',
                'contenu' => "Salut,\r\n\r\nLa période de dépôt des propositions de sujets de projet de fin d'études est ouverte.\r\n\r\nSi vous souhaitez proposer un sujet, vous pouvez le faire depuis votre espace personnel, jusqu'à la date limite indiquée.\r\n\r\nCordialement",
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'numero_template' => 1,
                'id_periode' => 3,
                'distinataires' => 'Les étudiants, enseignants et entreprises ayant proposé un sujet',
                'objet' => 'Votre proposition de PFE est en cours de traitement',
                'contenu' => "Salut,\r\n\r\nNous confirmons la réception de votre proposition de sujet de projet de fin d'études.\r\n\r\nCelle-ci a été transmise à la commission pédagogique pour examen.\r\n\r\nVous recevrez une réponse par e-mail dès qu'une décision aura été prise.\r\n\r\nCordialement",
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'numero_template' => 1,
                'id_periode' => 4,
                'distinataires' => 'Les étudiants sans proposition acceptée',
                'objet' => 'Sélection des sujets via la fiche de vœux',
                'contenu' => "Salut,\r\n\r\nVous pouvez désormais remplir les fiches de vœux des enseignants et entreprises disponible dans votre espace et classer les sujets ouverts qui vous intéressent.\r\n\r\nCordialement",
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'numero_template' => 1,
                'id_periode' => 5,
                'distinataires' => 'Tous les enseignants',
                'objet' => 'Participation à l\'encadrement d\'un sujet proposé par des étudiants et entreprises',
                'contenu' => "Salut,\r\n\r\nLes affectations finales des étudiants et entreprises avec leurs sujets de projet de fin d'études, validées par le responsable de la matière, sont désormais disponibles.\r\n\r\nVous pouvez consulter la liste des projets et les classer selon vos préférences pour l'encadrement.\r\n\r\nCordialement",
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'numero_template' => 1,
                'id_periode' => 7,
                'distinataires' => 'Les encadrants et co-encadrants',
                'objet' => 'Planning des soutenances disponible',
                'contenu' => "Salut,\r\n\r\nLe calendrier détaillé des soutenances de projet de fin d'études est désormais disponible.\r\n\r\nNous vous invitons signaler toute éventuelle indisponibilité dans les plus brefs délais.\r\n\r\nCordialement",
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'numero_template' => 2,
                'id_periode' => 7,
                'distinataires' => 'Les encadrants et co-encadrants',
                'objet' => 'Sélection de la session de soutenance pour les groupes encadrés',
                'contenu' => "Salut,\n\nNous vous contactons dans le cadre de l'organisation des soutenances de projet de fin d'études.\n\nLa période de sélection des sessions (Session 1 ou Session 2) est en cours. Merci de bien vouloir nous indiquer, pour chaque groupe que vous encadrez, la session de votre choix.\n\nCes informations sont indispensables pour finaliser le calendrier.\n\nCordialement",
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'numero_template' => 1,
                'id_periode' => 8,
                'distinataires' => 'Les enseignants sans vœux de jury renseignés',
                'objet' => 'Saisie des préférences de jury',
                'contenu' => "Salut,\r\n\r\nVous n'avez pas encore renseigné vos préférences pour la composition des jurys de soutenance.\r\n\r\nSi vous souhaitez le faire, vous pouvez les ajouter directement depuis la plateforme.\r\n\r\nCordialement",
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('templates_periodes')->insert($templates);
    }
}