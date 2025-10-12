<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('soutenances', function (Blueprint $table) {
            $table->id();
            $table->uuid('id_pfe');
            $table->unsignedBigInteger('id_salle')->nullable();
            $table->dateTime('date')->nullable();
            $table->time('heure_debut')->nullable();
            $table->time('heure_fin')->nullable();
            $table->string('session')->nullable();
            $table->timestamps();

            $table->foreign('id_pfe')->references('id')->on('pfes')->onDelete('cascade');
            $table->foreign('id_salle')->references('id')->on('salles')->onDelete('set null');
            
            // Indexes for performance
            $table->index('id_pfe');
            $table->index('id_salle');
        });

        Schema::create('notes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('id_pfe');
            $table->json('note_manuscrit')->nullable();
            $table->json('note_application')->nullable();
            $table->json('note_expose_orale')->nullable();
            $table->json('note_reponses_questions')->nullable();
            $table->json('note_assiduite')->nullable();
            $table->decimal('note_generale', 5, 2)->nullable();
            $table->decimal('note_encadrant', 5, 2)->nullable();
            $table->decimal('note_president', 5, 2)->nullable();
            $table->decimal('note_examinateur', 5, 2)->nullable();
            $table->timestamps();

            $table->foreign('id_pfe')->references('id')->on('pfes')->onDelete('cascade');
            
            // Index for performance
            $table->index('id_pfe');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notes');
        Schema::dropIfExists('soutenances');
    }
};
