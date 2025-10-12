<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OptionsSeeder extends Seeder
{
    public function run(): void
    {
        // Delete all existing records
        DB::table('options')->truncate();
        
        DB::table('options')->insert([
            [
                'id' => 1,
                'nom' => 'GL',
                'id_responsable' => null,
                'created_at' => '2025-07-18 12:39:16',
                'updated_at' => '2025-10-01 15:47:24',
            ],
            [
                'id' => 2,
                'nom' => 'IA',
                'id_responsable' => null,
                'created_at' => '2025-07-18 12:39:23',
                'updated_at' => '2025-10-01 15:47:39',
            ],
            [
                'id' => 3,
                'nom' => 'RSD',
                'id_responsable' => null,
                'created_at' => '2025-07-18 12:39:31',
                'updated_at' => '2025-07-19 16:25:35',
            ],
            [
                'id' => 4,
                'nom' => 'SIC',
                'id_responsable' => null,
                'created_at' => '2025-07-18 12:39:38',
                'updated_at' => '2025-07-19 16:09:08',
            ],
        ]);
    }
}