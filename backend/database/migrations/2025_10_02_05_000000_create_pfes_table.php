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
    // Create enums for pfes table (idempotent)
    DB::statement("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_enum') THEN CREATE TYPE session_enum AS ENUM ('session 1', 'session 2'); END IF; END $$;");
    DB::statement("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'option_enum') THEN CREATE TYPE option_enum AS ENUM ('GL', 'SIC', 'IA', 'RSD'); END IF; END $$;");
        
        Schema::create('pfes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('session')->default('session 1'); // Will use enum via raw SQL
            $table->string('option')->nullable(); // Will use enum via raw SQL
            $table->string('intitule');
            $table->text('resume')->nullable();
            $table->text('technologies_utilisees')->nullable();
            $table->text('besoins_materiels')->nullable();
            $table->string('type_sujet')->nullable();
            $table->uuid('id_encadrant');
            $table->uuid('id_co_encadrant')->nullable();
            $table->uuid('id_group')->unique(); // Add unique constraint
            $table->uuid('id_entreprise')->nullable();
            $table->timestamps();
            $table->uuid('id_jury')->nullable();
            $table->text('origine_proposition')->nullable();

            // Foreign keys referencing users table
            $table->foreign('id_encadrant')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('id_co_encadrant')->references('id')->on('users')->onDelete('set null');
            $table->foreign('id_group')->references('id')->on('groups')->onDelete('cascade');
            $table->foreign('id_entreprise')->references('id')->on('users')->onDelete('set null');
            $table->foreign('id_jury')->references('id')->on('jurys')->onDelete('set null');
            
            // Indexes for performance
            $table->index('id_encadrant');
            $table->index('id_co_encadrant');
            $table->index('id_entreprise');
            $table->index('id_jury');
            $table->index('session');
            $table->index('option');
            $table->index('type_sujet');
        });
        
        // Apply enums via raw SQL (drop defaults first, then alter type, then restore defaults)
        DB::statement('ALTER TABLE pfes ALTER COLUMN session DROP DEFAULT');
        DB::statement('ALTER TABLE pfes ALTER COLUMN session TYPE session_enum USING session::session_enum');
        DB::statement("ALTER TABLE pfes ALTER COLUMN session SET DEFAULT 'session 1'::session_enum");
        
        DB::statement('ALTER TABLE pfes ALTER COLUMN option TYPE option_enum USING option::option_enum');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pfes');
        DB::statement('DROP TYPE IF EXISTS option_enum');
        DB::statement('DROP TYPE IF EXISTS session_enum');
    }
};
