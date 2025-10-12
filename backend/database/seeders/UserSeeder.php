<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Etudiant;
use App\Models\Enseignant;
use App\Models\Entreprise;
use App\Models\Option;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create Admin User
        User::create([
            'id' => Str::uuid(),
            'name' => 'Admin User',
            'email' => 'mtadlaoui@hotmail.com',
            'password' => Hash::make('12345678'),
            'role' => 'admin',
        ]);
        $u = Str::uuid();
        User::create([
            'id' => $u,
            'name' => "Etudiant",
            'email' => "mohammedyacinehenaoui@gmail.com",
            'password' => Hash::make('12345678'),
            'role' => 'etudiant',
        ]);

        Etudiant::create([
            'id' => $u,
            'option' => 'GL',
            'moyenne' => 14.5,
        ]);

        // Create Students (Etudiants)
        for ($i = 1; $i <= 2; $i++) {
            $userId = Str::uuid();
            User::create([
                'id' => $userId,
                'name' => "Etudiant $i",
                'email' => "etudiant$i@example.com",
                'password' => Hash::make('12345678'),
                'role' => 'etudiant',
            ]);

            Etudiant::create([
                'id' => $userId,
                'option' => $i === 1 ? 'GL' : 'IIA',
                'moyenne' => 14.5 + $i,
            ]);
        }

        $teacherData = [
            ['name' => 'Enseignant 1', 'email' => 'enseignant1@example.com', 'grade' => 'Professeur', 'is_responsable' => false],
            ['name' => 'Enseignant 2', 'email' => 'enseignant2@example.com', 'grade' => 'MAA', 'is_responsable' => false],
            ['name' => 'Enseignant 3', 'email' => 'enseignant3@example.com', 'grade' => 'MCB', 'is_responsable' => false],
            ['name' => 'Enseignant 4', 'email' => 'enseignant4@example.com', 'grade' => 'MCB', 'is_responsable' => false],
            ['name' => 'Enseignant 5', 'email' => 'enseignant5@example.com', 'grade' => 'MCB', 'is_responsable' => false],
        ];

        foreach ($teacherData as $teacher) {
            $userId = Str::uuid();
            User::create([
                'id' => $userId,
                'name' => $teacher['name'],
                'email' => $teacher['email'],
                'password' => Hash::make('12345678'),
                'role' => 'enseignant',
            ]);

            // Create corresponding enseignant record
            Enseignant::create([
                'id' => $userId,
                'grade' => $teacher['grade'],
                'date_recrutement' => now()->subYears(rand(1, 10)),
                'is_responsable' => $teacher['is_responsable'],
            ]);
        }

        // Create Companies (Entreprises)
        for ($i = 1; $i <= 2; $i++) {
            $userId = Str::uuid();
            User::create([
                'id' => $userId,
                'name' => "Entreprise $i",
                'email' => "entreprise{$i}@example.com",
                'password' => Hash::make('12345678'),
                'role' => 'entreprise',
            ]);

            // Create corresponding entreprise record
            Entreprise::create([
                'id' => $userId,
                'denomination' => "Entreprise $i SARL",
            ]);
        }
    }
}
