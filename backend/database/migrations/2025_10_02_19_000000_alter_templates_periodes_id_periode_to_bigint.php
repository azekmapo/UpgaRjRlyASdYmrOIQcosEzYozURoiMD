<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Only run if table and column exist
        if (Schema::hasTable('templates_periodes') && Schema::hasColumn('templates_periodes', 'id_periode')) {
            // Convert integer to bigint safely using USING cast
            // Wrap in a transaction to avoid leaving DB in partial state
            DB::beginTransaction();
            try {
                // Drop existing FK if present
                DB::statement('ALTER TABLE templates_periodes DROP CONSTRAINT IF EXISTS templates_periodes_id_periode_foreign');

                // Alter column type to bigint (Postgres bigserial uses bigint)
                DB::statement("ALTER TABLE templates_periodes ALTER COLUMN id_periode TYPE bigint USING id_periode::bigint");

                // Recreate FK to periodes(id)
                DB::statement('ALTER TABLE templates_periodes ADD CONSTRAINT templates_periodes_id_periode_foreign FOREIGN KEY (id_periode) REFERENCES periodes(id) ON DELETE CASCADE');

                DB::commit();
            } catch (\Throwable $e) {
                DB::rollBack();
                // Re-throw so migration fails visibly
                throw $e;
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('templates_periodes') && Schema::hasColumn('templates_periodes', 'id_periode')) {
            DB::beginTransaction();
            try {
                DB::statement('ALTER TABLE templates_periodes DROP CONSTRAINT IF EXISTS templates_periodes_id_periode_foreign');
                DB::statement('ALTER TABLE templates_periodes ALTER COLUMN id_periode TYPE integer USING id_periode::integer');
                DB::statement('ALTER TABLE templates_periodes ADD CONSTRAINT templates_periodes_id_periode_foreign FOREIGN KEY (id_periode) REFERENCES periodes(id) ON DELETE CASCADE');
                DB::commit();
            } catch (\Throwable $e) {
                DB::rollBack();
                throw $e;
            }
        }
    }
};
