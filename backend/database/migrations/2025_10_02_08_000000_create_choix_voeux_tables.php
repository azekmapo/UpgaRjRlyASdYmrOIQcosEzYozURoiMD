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
        Schema::create('choix_pfe', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('id_group');
            $table->json('ranked_themes');
            $table->timestamps();

            $table->foreign('id_group')->references('id')->on('groups')->onDelete('cascade');
            
            // Index for performance
            $table->index('id_group');
        });

        Schema::create('voeux_jury', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('id_enseignant');
            $table->json('ranked_themes');
            $table->timestamps();

            // Foreign key referencing users table
            $table->foreign('id_enseignant')->references('id')->on('users')->onDelete('cascade');
            
            // Index for performance
            $table->index('id_enseignant');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('voeux_jury');
        Schema::dropIfExists('choix_pfe');
    }
};
