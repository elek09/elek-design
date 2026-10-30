<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gallery_items', function (Blueprint $table): void {
            $table->unsignedInteger('sort_order')->default(0)->after('thumb_path');
            $table->index(['category_id', 'subcategory_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::table('gallery_items', function (Blueprint $table): void {
            $table->dropIndex(['category_id', 'subcategory_id', 'sort_order']);
            $table->dropColumn('sort_order');
        });
    }
};
