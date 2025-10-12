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
        Schema::create('groups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('id_etd1');
            $table->uuid('id_etd2')->nullable();
            $table->decimal('moyenne', 5, 2);
            $table->string('option');
            $table->timestamps();

            // Foreign keys referencing users table
            $table->foreign('id_etd1')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('id_etd2')->references('id')->on('users')->onDelete('cascade');
            
            // Indexes for performance
            $table->index('id_etd1');
            $table->index('id_etd2');
            $table->index('option');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('groups');
    }
};
