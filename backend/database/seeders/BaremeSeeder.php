<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BaremeSeeder extends Seeder
{
    public function run(): void
    {
        // Delete all existing records
        DB::table('baremes')->truncate();
        
        DB::table('baremes')->insert([
            [
                'id' => 31,
                'type_bareme' => 'jury',
                'note_application' => 5.00,
                'note_expose_oral' => 5.00,
                'note_reponses_questions' => 5.00,
                'note_assiduite' => 0.00,
                'note_manucrit' => 5.00,
            ],
            [
                'id' => 33,
                'type_bareme' => 'encadrant',
                'note_application' => 5.00,
                'note_expose_oral' => 5.00,
                'note_reponses_questions' => 5.00,
                'note_assiduite' => 5.00,
                'note_manucrit' => 0.00,
            ],
        ]);
    }
}