<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasColumn('categories','subcategories')) {
            Schema::table('categories', function (Blueprint $t) {
                $t->dropColumn('subcategories');
            });
        }
    }
    public function down(): void
    {
        if (!Schema::hasColumn('categories','subcategories')) {
            Schema::table('categories', function (Blueprint $t) {
                $t->json('subcategories')->nullable();
            });
        }
    }
};
