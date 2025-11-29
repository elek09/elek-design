<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\GalleryItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GalleryApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['admin' => true]);
        
        // Létrehozunk egy kategóriát a tesztekhez
        $this->category = Category::factory()->create([
            'name' => 'Konyha',
            'type' => 'gallery',
        ]);
    }

    public function test_nyilvanos_gallery_lista_visszaadja_aktiv_elemeket(): void
    {
        GalleryItem::factory()->count(5)->active()->create([
            'category_id' => $this->category->id,
        ]);
        
        GalleryItem::factory()->count(2)->create([
            'category_id' => $this->category->id,
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/v1/gallery');

        $response->assertStatus(200);
        $data = $response->json('data');
        
        $this->assertCount(5, $data);
    }

    public function test_gallery_top_visszaadja_kiemelt_elemeket(): void
    {
        GalleryItem::factory()->count(3)->active()->featured()->create([
            'category_id' => $this->category->id,
        ]);
        
        GalleryItem::factory()->count(5)->active()->create([
            'category_id' => $this->category->id,
            'is_featured' => false,
        ]);

        $response = $this->getJson('/api/v1/gallery/top');

        $response->assertStatus(200);
        $data = $response->json('data');
        
        $this->assertCount(3, $data);
        foreach ($data as $item) {
            $this->assertTrue($item['is_featured']);
        }
    }

    public function test_admin_modosithatja_gallery_elem_aktiv_statuszt(): void
    {
        $item = GalleryItem::factory()->active()->create([
            'category_id' => $this->category->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/gallery/{$item->id}/status", [
                'is_active' => false
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('gallery_items', [
            'id' => $item->id,
            'is_active' => false,
        ]);
    }

    public function test_admin_modosithatja_gallery_elem_kiemelt_statuszt(): void
    {
        $item = GalleryItem::factory()->create([
            'category_id' => $this->category->id,
            'is_featured' => false,
        ]);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/v1/admin/gallery/{$item->id}/featured", [
                'is_featured' => true
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('gallery_items', [
            'id' => $item->id,
            'is_featured' => true,
        ]);
    }

    public function test_admin_torolheti_gallery_elemet(): void
    {
        $item = GalleryItem::factory()->create([
            'category_id' => $this->category->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/v1/admin/gallery/{$item->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('gallery_items', ['id' => $item->id]);
    }

    public function test_nem_admin_nem_ferheti_hozza_admin_gallery_funkciokhoz(): void
    {
        $user = User::factory()->create(['admin' => false]);
        $item = GalleryItem::factory()->create([
            'category_id' => $this->category->id,
        ]);

        $response = $this->actingAs($user)
            ->deleteJson("/api/v1/admin/gallery/{$item->id}");

        $response->assertStatus(403);
    }
}

