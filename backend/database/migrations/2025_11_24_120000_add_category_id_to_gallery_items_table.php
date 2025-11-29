<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('gallery_items', function (Blueprint $t) {
            if (!Schema::hasColumn('gallery_items', 'category_id')) {
                $t->foreignId('category_id')->nullable()->after('category')->constrained('categories')->nullOnDelete();
                $t->index('category_id');
            }
        });

        if (Schema::hasColumn('gallery_items', 'category') && Schema::hasColumn('gallery_items', 'category_id')) {
            $pairs = DB::table('categories')->select('id', 'type')->get()->keyBy('type');
            DB::table('gallery_items')->orderBy('id')->chunk(500, function ($chunk) use ($pairs) {
                foreach ($chunk as $row) {
                    if ($row->category && isset($pairs[$row->category])) {
                        DB::table('gallery_items')->where('id', $row->id)->update([
                            'category_id' => $pairs[$row->category]->id,
                        ]);
                    }
                }
            });
        }
    }

    public function down(): void
    {
        $connection = config('database.default');
        if ($connection === 'sqlite') {
            if (Schema::hasColumn('gallery_items', 'category_id')) {
                Schema::disableForeignKeyConstraints();
                Schema::create('gallery_items_tmp', function (Blueprint $t) {
                    $t->id();
                    $t->string('title');
                    if (!Schema::hasColumn('gallery_items','category')) {
                        $t->string('category')->nullable();
                    } else {
                        $t->string('category')->nullable();
                    }
                    $t->text('description')->nullable();
                    $t->string('image_path');
                    $t->boolean('is_active')->default(true);
                    $t->boolean('is_featured')->default(false);
                    if (Schema::hasColumn('gallery_items','subcategory_id')) {
                        $t->unsignedBigInteger('subcategory_id')->nullable();
                        $t->index('subcategory_id');
                    }
                    $t->timestamps();
                });

                $columns = ['id','title','category','description','image_path','is_active','is_featured','created_at','updated_at'];
                if (Schema::hasColumn('gallery_items','subcategory_id')) {
                    array_splice($columns, 6, 0, ['subcategory_id']);
                }
                $cols = implode(',', $columns);
                DB::statement("INSERT INTO gallery_items_tmp ($cols) SELECT $cols FROM gallery_items");

                Schema::drop('gallery_items');
                Schema::rename('gallery_items_tmp', 'gallery_items');
                Schema::enableForeignKeyConstraints();
            }
        } else {
            Schema::table('gallery_items', function (Blueprint $t) {
                if (Schema::hasColumn('gallery_items', 'category_id')) {
                    $t->dropConstrainedForeignId('category_id');
                }
            });
        }
    }
};
