<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('products', 'active')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('active');
            });
        }
    }

    public function down(): void
    {
        // Restore legacy column if needed (defaulting to true)
        if (! Schema::hasColumn('products', 'active')) {
            Schema::table('products', function (Blueprint $table) {
                $table->boolean('active')->default(true)->after('is_active');
            });
        }
    }
};
