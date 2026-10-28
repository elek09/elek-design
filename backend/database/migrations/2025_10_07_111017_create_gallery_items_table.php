<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('gallery_items', function (Blueprint $t) {
            $t->id();
            $t->string('title');
            $t->string('category')->nullable();
            $t->text('description')->nullable();
            $t->string('image_path');
            $t->boolean('is_active')->default(true);
            $t->boolean('is_featured')->default(false);
            $t->timestamps();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('gallery_items');
    }
};
