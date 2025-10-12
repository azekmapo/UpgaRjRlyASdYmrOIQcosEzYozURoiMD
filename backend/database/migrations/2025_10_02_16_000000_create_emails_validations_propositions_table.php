<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('emails_validations_propositions', function (Blueprint $table) {
            $table->id();
            $table->enum('role', ['etudiant', 'enseignant', 'entreprise']);
            $table->string('name');
            $table->string('email');
            $table->string('name2')->nullable();
            $table->string('email2')->nullable();
            $table->string('denomination')->nullable();
            $table->string('intitule');
            $table->enum('status', ['accepted', 'declined']);
            $table->text('remarques')->nullable();
            $table->string('option');
            $table->string('type')->nullable();
            $table->text('resumer');
            $table->text('technologies');
            $table->text('besoins_materiels')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emails_validations_propositions');
    }
};