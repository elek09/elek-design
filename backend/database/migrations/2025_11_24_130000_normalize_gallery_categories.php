<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('category_subcategories')) {
            Schema::create('category_subcategories', function (Blueprint $t) {
                $t->id();
                $t->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
                $t->string('slug')->unique();
                $t->string('name');
                $t->integer('nav_order')->nullable();
                $t->timestamps();
                $t->index(['category_id','nav_order']);
            });
        }

        $categories = DB::table('categories')->select('id','subcategories')->get();
        foreach ($categories as $cat) {
            if (empty($cat->subcategories)) continue;
            $subs = json_decode($cat->subcategories, true);
            if (!is_array($subs)) continue;
            foreach ($subs as $idx => $row) {
                $slug = (string)($row['id'] ?? $row['name'] ?? '');
                $name = (string)($row['name'] ?? $slug);
                if ($slug === '') continue;
                DB::table('category_subcategories')->updateOrInsert(
                    ['slug' => $slug],
                    [
                        'category_id' => $cat->id,
                        'name' => $name,
                        'nav_order' => $row['nav_order'] ?? $idx,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }

        if (!Schema::hasColumn('gallery_items', 'subcategory_id')) {
            Schema::table('gallery_items', function (Blueprint $t) {
                $t->foreignId('subcategory_id')->nullable()->after('category_id')->constrained('category_subcategories')->nullOnDelete();
                $t->index('subcategory_id');
            });
        }

        if (Schema::hasColumn('gallery_items','category') && Schema::hasColumn('gallery_items','subcategory_id')) {
            $subMap = DB::table('category_subcategories')->select('id','slug')->get()->keyBy('slug');
            DB::table('gallery_items')->orderBy('id')->chunk(500, function ($chunk) use ($subMap) {
                foreach ($chunk as $row) {
                    if (!empty($row->category) && isset($subMap[$row->category])) {
                        DB::table('gallery_items')->where('id',$row->id)->update([
                            'subcategory_id' => $subMap[$row->category]->id,
                        ]);
                    }
                }
            });
        }

        if (Schema::hasColumn('gallery_items','category') && Schema::hasColumn('gallery_items','category_id')) {
            $catTypes = DB::table('categories')->select('id','type')->get()->keyBy('type');
            DB::table('gallery_items')->whereNull('category_id')->orderBy('id')->chunk(500, function ($chunk) use ($catTypes) {
                foreach ($chunk as $row) {
                    if (!empty($row->category) && isset($catTypes[$row->category])) {
                        DB::table('gallery_items')->where('id',$row->id)->update([
                            'category_id' => $catTypes[$row->category]->id,
                        ]);
                    }
                }
            });
        }

        DB::table('gallery_items')
            ->whereNull('category_id')
            ->whereNull('subcategory_id')
            ->update(['is_active' => false]);

        if (Schema::hasColumn('gallery_items','category')) {
            Schema::table('gallery_items', function (Blueprint $t) {
                $t->dropColumn('category');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('gallery_items','category')) {
            Schema::table('gallery_items', function (Blueprint $t) {
                $t->string('category')->nullable()->after('title');
            });
        }

        if (Schema::hasColumn('gallery_items','category')) {
            $subMap = DB::table('category_subcategories')->select('id','slug')->get()->keyBy('id');
            $catMap = DB::table('categories')->select('id','type')->get()->keyBy('id');
            DB::table('gallery_items')->orderBy('id')->chunk(500, function ($chunk) use ($subMap,$catMap) {
                foreach ($chunk as $row) {
                    $value = null;
                    if ($row->subcategory_id && isset($subMap[$row->subcategory_id])) {
                        $value = $subMap[$row->subcategory_id]->slug;
                    } elseif ($row->category_id && isset($catMap[$row->category_id])) {
                        $value = $catMap[$row->category_id]->type;
                    }
                    if ($value !== null) {
                        DB::table('gallery_items')->where('id',$row->id)->update(['category' => $value]);
                    }
                }
            });
        }

        if (Schema::hasColumn('gallery_items','subcategory_id')) {
            $connection = config('database.default');
            if ($connection === 'sqlite') {
                Schema::disableForeignKeyConstraints();
                Schema::create('gallery_items_tmp', function (Blueprint $t) {
                    $t->id();
                    $t->string('title');
                    $t->string('category')->nullable();
                    $t->text('description')->nullable();
                    $t->string('image_path');
                    $t->boolean('is_active')->default(true);
                    $t->boolean('is_featured')->default(false);
                    if (Schema::hasColumn('gallery_items','category_id')) {
                        $t->unsignedBigInteger('category_id')->nullable();
                        $t->index('category_id');
                    }
                    $t->timestamps();
                });

                $columns = ['id','title','category','description','image_path','is_active','is_featured','created_at','updated_at'];
                if (Schema::hasColumn('gallery_items','category_id')) {
                    array_splice($columns, 6, 0, ['category_id']);
                }
                $cols = implode(',', $columns);
                DB::statement("INSERT INTO gallery_items_tmp ($cols) SELECT $cols FROM gallery_items");

                Schema::drop('gallery_items');
                Schema::rename('gallery_items_tmp', 'gallery_items');
                Schema::enableForeignKeyConstraints();
            } else {
                Schema::table('gallery_items', function (Blueprint $t) {
                    $t->dropConstrainedForeignId('subcategory_id');
                });
            }
        }

        Schema::dropIfExists('category_subcategories');
    }
};
