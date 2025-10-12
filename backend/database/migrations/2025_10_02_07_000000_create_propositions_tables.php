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
    // Create enums for propositions (idempotent)
    DB::statement("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proposition_status_enum') THEN CREATE TYPE proposition_status_enum AS ENUM ('pending', 'accepted', 'declined'); END IF; END $$;");
    DB::statement("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_sujet_enum') THEN CREATE TYPE type_sujet_enum AS ENUM ('classique', 'innovant', 'stage'); END IF; END $$;");
        
        Schema::create('propositions_etudiant', function (Blueprint $table) {
            $table->id();
            $table->uuid('id_group');
            $table->string('option');
            $table->string('type_sujet'); // Will use enum via raw SQL
            $table->string('status'); // Will use enum via raw SQL
            $table->string('intitule');
            $table->text('resume');
            $table->text('technologies_utilisees');
            $table->text('besoins_materiels');
            $table->timestamps();

            $table->foreign('id_group')->references('id')->on('groups')->onDelete('cascade');
            
            // Index for performance
            $table->index('id_group');
        });
        
        // Apply enums
        DB::statement('ALTER TABLE propositions_etudiant ALTER COLUMN status TYPE proposition_status_enum USING status::proposition_status_enum');
        DB::statement('ALTER TABLE propositions_etudiant ALTER COLUMN type_sujet TYPE type_sujet_enum USING type_sujet::type_sujet_enum');

        Schema::create('propositions_enseignant', function (Blueprint $table) {
            $table->uuid('encadrant_id');
            $table->uuid('co_encadrant_id')->nullable();
            $table->string('option');
            $table->string('type_sujet');
            $table->string('status'); // Will use enum via raw SQL
            $table->string('intitule');
            $table->text('resume');
            $table->text('technologies_utilisees');
            $table->text('besoins_materiels');
            $table->timestamps();
            $table->id();

            $table->foreign('encadrant_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('co_encadrant_id')->references('id')->on('users')->onDelete('set null');
            
            // Indexes for performance
            $table->index('encadrant_id');
            $table->index('co_encadrant_id');
        });
        
        // Apply enum
        DB::statement('ALTER TABLE propositions_enseignant ALTER COLUMN status TYPE proposition_status_enum USING status::proposition_status_enum');

        Schema::create('propositions_entreprise', function (Blueprint $table) {
            $table->id();
            $table->uuid('entreprise_id');
            $table->string('option');
            $table->string('status'); // Will use enum via raw SQL
            $table->string('intitule');
            $table->text('resume');
            $table->timestamps();
            $table->text('technologies_utilisees')->nullable();

            $table->foreign('entreprise_id')->references('id')->on('users')->onDelete('cascade');
            
            // Index for performance
            $table->index('entreprise_id');
        });
        
        // Apply enum
        DB::statement('ALTER TABLE propositions_entreprise ALTER COLUMN status TYPE proposition_status_enum USING status::proposition_status_enum');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('propositions_entreprise');
        Schema::dropIfExists('propositions_enseignant');
        Schema::dropIfExists('propositions_etudiant');
        DB::statement('DROP TYPE IF EXISTS type_sujet_enum');
        DB::statement('DROP TYPE IF EXISTS proposition_status_enum');
    }
};
