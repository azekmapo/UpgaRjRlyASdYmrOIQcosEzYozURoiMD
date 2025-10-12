<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DistributionStatusesSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            [
                'id' => 1,
                'is_distributed' => 0,
                'distributed_at' => '2025-07-07 14:52:06',
                'concerne_envoi' => 'Resultats fiche de voeux etudiants',
            ],
            [
                'id' => 2,
                'is_distributed' => 0,
                'distributed_at' => '2025-07-08 14:07:41',
                'concerne_envoi' => 'Emails d\'encadrement',
            ],
            [
                'id' => 3,
                'is_distributed' => 0,
                'distributed_at' => '2025-07-08 15:43:06',
                'concerne_envoi' => 'Notes aux etudiants',
            ],
            [
                'id' => 4,
                'is_distributed' => 0,
                'distributed_at' => '2025-07-10 15:08:23',
                'concerne_envoi' => 'Resultat fiche jury',
            ],
            [
                'id' => 5,
                'is_distributed' => 0,
                'distributed_at' => '2025-07-14 00:16:11',
                'concerne_envoi' => 'PVs des soutenances',
            ],
            [
                'id' => 6,
                'is_distributed' => 0,
                'distributed_at' => '2025-06-19 21:14:04',
                'concerne_envoi' => 'Grouper les etudiants qui n\'ont pas de binomes',
            ],
            [
                'id' => 7,
                'is_distributed' => 0,
                'distributed_at' => '2025-08-07 10:42:11',
                'concerne_envoi' => 'Validation des propositions',
            ],
        ];

        DB::table('distribution_statuses')->insert($statuses);
    }
}