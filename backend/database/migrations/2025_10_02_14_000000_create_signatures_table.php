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
        Schema::create('signatures', function (Blueprint $table) {
            $table->id();
            $table->uuid('enseignant_id');
            $table->longText('signature_data');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('enseignant_id')->references('id')->on('enseignants')->onDelete('cascade');
            $table->index('enseignant_id');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('signatures');
    }
};