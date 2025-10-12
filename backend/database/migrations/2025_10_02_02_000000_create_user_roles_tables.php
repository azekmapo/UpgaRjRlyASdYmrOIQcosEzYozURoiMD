<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('etudiants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('option');
            $table->decimal('moyenne', 5, 2);
            $table->timestamps();

            $table->foreign('id')->references('id')->on('users')->onDelete('cascade');
            
            // Indexes for performance
            $table->index('id');
            $table->index('option');
        });

    // Create enum for enseignants grade (idempotent)
    DB::statement("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'grade_enum') THEN CREATE TYPE grade_enum AS ENUM ('MAB', 'MAA', 'MCB', 'MCA', 'Professeur'); END IF; END $$;");
        
        Schema::create('enseignants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('grade'); 
            $table->date('date_recrutement');
            $table->boolean('is_responsable')->default(false);
            $table->timestamps();

            $table->foreign('id')->references('id')->on('users')->onDelete('cascade');
            
            // Indexes for performance
            $table->index('id');
        });
        
        // Apply enum via raw SQL
        DB::statement('ALTER TABLE enseignants ALTER COLUMN grade TYPE grade_enum USING grade::grade_enum');

        Schema::create('entreprises', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('denomination');
            $table->timestamps();

            $table->foreign('id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('entreprises');
        Schema::dropIfExists('enseignants');
        DB::statement('DROP TYPE IF EXISTS grade_enum');
        Schema::dropIfExists('etudiants');
    }
};
