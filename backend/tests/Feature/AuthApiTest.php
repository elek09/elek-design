<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_letrehoz_uj_felhasznalot(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Új Felhasználó',
            'email' => 'uj@example.com',
            'password' => 'Jelszo123!',
            'password_confirmation' => 'Jelszo123!',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'name' => 'Új Felhasználó',
                        'email' => 'uj@example.com',
                    ]
                ]
            ]);

        $this->assertDatabaseHas('users', ['email' => 'uj@example.com']);
        $this->assertAuthenticated();
    }

    public function test_register_validalja_email_egyediseget(): void
    {
        User::factory()->create(['email' => 'letezik@example.com']);

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Teszt',
            'email' => 'letezik@example.com',
            'password' => 'Jelszo123!',
            'password_confirmation' => 'Jelszo123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_register_validalja_kotelezo_mezőket(): void
    {
        $response = $this->postJson('/api/v1/auth/register', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_login_sikeres_helyes_adatokkal(): void
    {
        $user = User::factory()->create([
            'email' => 'teszt@example.com',
            'password' => Hash::make('HelyreTett123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'teszt@example.com',
            'password' => 'HelyreTett123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'email' => 'teszt@example.com',
                    ]
                ]
            ]);

        $this->assertAuthenticated();
    }

    public function test_login_sikertelen_rossz_jelszoval(): void
    {
        User::factory()->create([
            'email' => 'teszt@example.com',
            'password' => Hash::make('HelyreTett123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'teszt@example.com',
            'password' => 'RosszJelszo',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'errors' => [
                    'credentials' => ['Invalid credentials']
                ]
            ]);

        $this->assertGuest();
    }

    public function test_login_sikertelen_nem_létező_emaillel(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'nemletezik@example.com',
            'password' => 'BármiJelszo',
        ]);

        $response->assertStatus(401);
        $this->assertGuest();
    }

    public function test_login_validalja_kotelezo_mezőket(): void
    {
        $response = $this->postJson('/api/v1/auth/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_logout_kijelentkezteti_a_felhasznalot(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertGuest();
    }

    public function test_logout_mukodik_bejelentkezetlen_felhasznalonak_is(): void
    {
        $response = $this->postJson('/api/v1/auth/logout');

        $response->assertStatus(200);
        $this->assertGuest();
    }
}
