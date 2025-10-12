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
        Schema::create('periodes', function (Blueprint $table) {
            $table->id();
            $table->string('titre');
            $table->text('description')->nullable();
            $table->date('date_debut');
            $table->date('date_fin');
            $table->string('dashboard_title')->nullable();
            $table->text('dashboard_description')->nullable();
            $table->string('dashboard_button')->nullable();
            $table->timestamps();
        });

        Schema::create('calendriers', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
        });

        Schema::create('distribution_statuses', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('is_distributed');
            $table->timestamp('distributed_at')->nullable();
            $table->text('concerne_envoi')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('distribution_statuses');
        Schema::dropIfExists('calendriers');
        Schema::dropIfExists('periodes');
    }
};
