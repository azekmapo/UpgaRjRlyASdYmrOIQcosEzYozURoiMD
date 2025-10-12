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
        Schema::create('jurys', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('id_president');
            $table->uuid('id_examinateur');
            $table->timestamps();

            // Foreign keys referencing users table
            $table->foreign('id_president')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('id_examinateur')->references('id')->on('users')->onDelete('cascade');
            
            // Indexes for performance
            $table->index('id_president');
            $table->index('id_examinateur');
        });

        Schema::create('salles', function (Blueprint $table) {
            $table->id();
            $table->string('nom_salle');
            $table->timestamps();
        });

        Schema::create('baremes', function (Blueprint $table) {
            $table->id();
            $table->enum('type_bareme', ['encadrant', 'jury']);
            $table->decimal('note_application', 5, 2)->default(0);
            $table->decimal('note_expose_oral', 5, 2)->default(0);
            $table->decimal('note_reponses_questions', 5, 2)->default(0);
            $table->decimal('note_assiduite', 5, 2)->default(0);
            $table->decimal('note_manucrit', 5, 2)->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('baremes');
        Schema::dropIfExists('salles');
        Schema::dropIfExists('jurys');
    }
};
