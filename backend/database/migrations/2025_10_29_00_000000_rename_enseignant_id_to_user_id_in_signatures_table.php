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
        Schema::table('signatures', function (Blueprint $table) {
            // Drop foreign key and index on enseignant_id
            $table->dropForeign(['enseignant_id']);
            $table->dropIndex(['enseignant_id']);

            // Rename column
            $table->renameColumn('enseignant_id', 'user_id');

            // Add new foreign key to users
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('signatures', function (Blueprint $table) {
            // Drop foreign key and index on user_id
            $table->dropForeign(['user_id']);
            $table->dropIndex(['user_id']);

            // Rename column back
            $table->renameColumn('user_id', 'enseignant_id');

            // Add back foreign key to enseignants
            $table->foreign('enseignant_id')->references('id')->on('enseignants')->onDelete('cascade');
            $table->index('enseignant_id');
        });
    }
};