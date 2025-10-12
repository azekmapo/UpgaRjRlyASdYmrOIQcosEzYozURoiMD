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
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sender_id');
            $table->uuid('receiver_id');
            $table->string('title');
            $table->text('message');
            $table->string('type');
            $table->string('status');
            $table->timestamps();
            $table->bigInteger('proposition_id')->nullable();
            $table->uuid('group_id')->nullable();
            $table->string('email_validation_id')->nullable();
            $table->string('email_automation_id')->nullable();
            
            $table->foreign('sender_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('receiver_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('proposition_id')->references('id')->on('propositions_enseignant')->onDelete('cascade');
            $table->foreign('group_id')->references('id')->on('groups')->onDelete('cascade');
            
            // Indexes for performance
            $table->index('sender_id');
            $table->index('receiver_id');
            $table->index('proposition_id');
            $table->index('group_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
