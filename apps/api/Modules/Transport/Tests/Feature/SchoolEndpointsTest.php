<?php

declare(strict_types=1);

namespace Modules\Transport\Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Modules\Admin\Models\Module;
use Tests\TestCase;

final class SchoolEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_and_list_schools_via_api(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::create([
            'name' => 'Admin Teste',
            'email' => 'admin-' . Str::random(5) . '@teste.gov.br',
            'password' => bcrypt('secret'),
            'is_platform_admin' => true,
        ]);
        $tenant->users()->attach($user->id, ['status' => 'active', 'is_primary' => true]);

        $module = Module::firstOrCreate(
            ['alias' => 'transport'],
            ['name' => 'Transport', 'enabled' => true, 'monthly_fee_cents' => 0]
        );
        $module->tenants()->syncWithoutDetaching([
            $tenant->id => ['enabled' => true, 'settings' => json_encode([])],
        ]);

        $response = $this->actingAs($user)->withHeaders([
            'X-Tenant-ID' => (string) $tenant->id,
        ])->postJson('/api/transport/schools', [
            'name' => 'Escola Municipal Duque de Caxias',
            'inep_code' => '41012345',
            'zone' => 'rural',
            'address' => 'Linha 12, KM 4',
            'latitude' => -15.8234,
            'longitude' => -47.8912,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.name', 'Escola Municipal Duque de Caxias');

        $listResponse = $this->actingAs($user)->withHeaders([
            'X-Tenant-ID' => (string) $tenant->id,
        ])->getJson('/api/transport/schools');

        $listResponse->assertStatus(200);
        $listResponse->assertJsonFragment([
            'name' => 'Escola Municipal Duque de Caxias',
        ]);
    }
}
