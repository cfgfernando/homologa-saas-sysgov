<?php

declare(strict_types=1);

namespace Modules\Transport\Tests\Feature;

use App\Models\Tenant;
use App\Support\TenantContext;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Transport\Models\TransportRoute;
use Modules\Transport\Models\TransportVehicle;
use Tests\TestCase;

final class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_aware_models_scope_queries_to_active_tenant(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();

        // Create vehicle for Tenant A
        TransportVehicle::create([
            'tenant_id' => $tenantA->id,
            'code' => 'VEIC-001',
            'plate' => 'ABC1D23',
            'renavam' => '12345678901',
            'chassis' => '9BWZZZ377VT004251',
            'brand' => 'Mercedes-Benz',
            'model' => 'OF-1519',
            'year_manufacture' => 2022,
            'year_model' => 2022,
            'capacity_seats' => 44,
            'vehicle_type' => 'bus',
            'status' => 'active',
            'detran_inspection_due_date' => Carbon::now()->addMonths(3),
            'crlv_due_date' => Carbon::now()->addYear(),
        ]);

        // Create vehicle for Tenant B
        TransportVehicle::create([
            'tenant_id' => $tenantB->id,
            'code' => 'VEIC-002',
            'plate' => 'XYZ9E87',
            'renavam' => '98765432109',
            'chassis' => '9BWZZZ377VT009999',
            'brand' => 'Volkswagen',
            'model' => 'Volksbus',
            'year_manufacture' => 2023,
            'year_model' => 2023,
            'capacity_seats' => 32,
            'vehicle_type' => 'microbus',
            'status' => 'active',
            'detran_inspection_due_date' => Carbon::now()->addMonths(5),
            'crlv_due_date' => Carbon::now()->addYear(),
        ]);

        // Set context to Tenant A
        app()->make(TenantContext::class)->set($tenantA);

        $vehiclesA = TransportVehicle::all();
        $this->assertCount(1, $vehiclesA);
        $this->assertEquals('ABC1D23', $vehiclesA->first()->plate);

        // Set context to Tenant B
        app()->make(TenantContext::class)->set($tenantB);

        $vehiclesB = TransportVehicle::all();
        $this->assertCount(1, $vehiclesB);
        $this->assertEquals('XYZ9E87', $vehiclesB->first()->plate);
    }

    public function test_routes_are_isolated_by_tenant(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();

        TransportRoute::create([
            'tenant_id' => $tenantA->id,
            'code' => 'ROTA-A-01',
            'name' => 'Linha Rural Norte - Município A',
            'shift' => 'morning',
            'route_type' => 'rural',
            'distance_paved_km' => 15.0,
            'distance_unpaved_km' => 20.5,
            'estimated_duration_minutes' => 45,
            'is_active' => true,
        ]);

        TransportRoute::create([
            'tenant_id' => $tenantB->id,
            'code' => 'ROTA-B-01',
            'name' => 'Linha Urbana Centro - Município B',
            'shift' => 'afternoon',
            'route_type' => 'urban',
            'distance_paved_km' => 12.0,
            'distance_unpaved_km' => 0.0,
            'estimated_duration_minutes' => 30,
            'is_active' => true,
        ]);

        // Scope to Tenant A
        app()->make(TenantContext::class)->set($tenantA);
        $routesA = TransportRoute::all();

        $this->assertCount(1, $routesA);
        $this->assertEquals('ROTA-A-01', $routesA->first()->code);

        // Scope to Tenant B
        app()->make(TenantContext::class)->set($tenantB);
        $routesB = TransportRoute::all();

        $this->assertCount(1, $routesB);
        $this->assertEquals('ROTA-B-01', $routesB->first()->code);
    }
}
