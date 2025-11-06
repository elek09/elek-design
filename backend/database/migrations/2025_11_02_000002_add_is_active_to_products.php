<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Guarded no-op: base create migration already includes is_active
        if (!Schema::hasColumn('products', 'is_active')) {
            Schema::table('products', function (Blueprint $t) {
                $t->boolean('is_active')->default(true)->after('options');
            });
        }

        // Backfill is_active from existing 'active' if present
        if (Schema::hasColumn('products', 'active')) {
            DB::statement('UPDATE products SET is_active = active');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Safe rollback: just drop the new column if it exists
        if (Schema::hasColumn('products', 'is_active')) {
            Schema::table('products', function (Blueprint $t) {
                $t->dropColumn('is_active');
            });
        }
    }
};
