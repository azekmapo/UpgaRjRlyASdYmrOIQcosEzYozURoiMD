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
        Schema::create('automation_emails', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('periode');
            $table->dateTime('date_debut');
            $table->dateTime('date_fin');
            $table->string('template');
            $table->string('email_objet');
            $table->text('email_contenu');
            $table->integer('frequence');
            $table->text('description');
            $table->enum('status', ['en_attente', 'en_cours', 'termine']);
            $table->timestamps();
        });

        Schema::create('planification_emails', function (Blueprint $table) {
            $table->id();
            $table->uuid('automation_id');
            $table->dateTime('date_envoi_planifie');
            $table->enum('status', ['en_attente','envoye','echoue']);
            $table->timestamps();

            $table->foreign('automation_id')->references('id')->on('automation_emails')->onDelete('cascade');
            
            // Index for performance
            $table->index('automation_id');
        });

        Schema::create('templates_periodes', function (Blueprint $table) {
            $table->id();
            $table->integer('numero_template');
            $table->integer('id_periode');
            $table->string('distinataires');
            $table->string('objet');
            $table->text('contenu');
            $table->timestamps();
            
            $table->foreign('id_periode')->references('id')->on('periodes')->onDelete('cascade');
            
            // Index for performance
            $table->index('id_periode');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('templates_periodes');
        Schema::dropIfExists('envoi_emails');
        Schema::dropIfExists('planification_emails');
        Schema::dropIfExists('automation_emails');
    }
};
