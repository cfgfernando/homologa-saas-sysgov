<?php

declare(strict_types=1);

namespace Modules\Transport\Database\Seeders;

use App\Models\Tenant;
use App\Support\TenantContext;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Modules\Pessoas\Models\Pessoa;
use Modules\Transport\Models\TransportDriver;
use Modules\Transport\Models\TransportRoute;
use Modules\Transport\Models\TransportStop;
use Modules\Transport\Models\TransportStudentAllocation;
use Modules\Transport\Models\TransportVehicle;

final class TransportDemonstracaoSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::whereIn('id', [1, 2])->get();

        foreach ($tenants as $tenant) {
            app(TenantContext::class)->set($tenant);

            // 1. Veículos (Frota Escolar ORE e Vans)
            $v1 = TransportVehicle::firstOrCreate(
                ['tenant_id' => $tenant->id, 'code' => 'VEIC-001'],
                [
                    'plate' => 'BRA2E19',
                    'renavam' => '00987654321',
                    'chassis' => '9BWZZZ377VT004123',
                    'brand' => 'Mercedes-Benz',
                    'model' => 'OF-1519 Ônibus Rural Escolar (ORE 3)',
                    'year_manufacture' => 2022,
                    'year_model' => 2023,
                    'capacity_seats' => 44,
                    'vehicle_type' => 'bus',
                    'ownership_type' => 'owned',
                    'accessibility_adapted' => true,
                    'detran_inspection_due_date' => Carbon::now()->addMonths(2),
                    'crlv_due_date' => Carbon::now()->addYear(),
                    'status' => 'active',
                ]
            );

            $v2 = TransportVehicle::firstOrCreate(
                ['tenant_id' => $tenant->id, 'code' => 'VEIC-002'],
                [
                    'plate' => 'RKS8C44',
                    'renavam' => '00123456789',
                    'chassis' => '9BWZZZ377VT009845',
                    'brand' => 'Volkswagen',
                    'model' => 'Volksbus 8.160 ODR (ORE 1)',
                    'year_manufacture' => 2021,
                    'year_model' => 2022,
                    'capacity_seats' => 29,
                    'vehicle_type' => 'microbus',
                    'ownership_type' => 'owned',
                    'accessibility_adapted' => true,
                    'detran_inspection_due_date' => Carbon::now()->addMonths(1),
                    'crlv_due_date' => Carbon::now()->addYear(),
                    'status' => 'active',
                ]
            );

            $v3 = TransportVehicle::firstOrCreate(
                ['tenant_id' => $tenant->id, 'code' => 'VEIC-003'],
                [
                    'plate' => 'PQT4A12',
                    'renavam' => '00456123789',
                    'chassis' => '8AFZZZ377VT001122',
                    'brand' => 'Iveco',
                    'model' => 'Daily Minibus 50-170',
                    'year_manufacture' => 2020,
                    'year_model' => 2020,
                    'capacity_seats' => 19,
                    'vehicle_type' => 'van',
                    'ownership_type' => 'contracted',
                    'accessibility_adapted' => false,
                    'detran_inspection_due_date' => Carbon::now()->subDays(15), // Vencida para alertar no semáforo fiscal
                    'crlv_due_date' => Carbon::now()->addMonths(3),
                    'status' => 'maintenance',
                ]
            );

            $v4 = TransportVehicle::firstOrCreate(
                ['tenant_id' => $tenant->id, 'code' => 'VEIC-004'],
                [
                    'plate' => 'LMN5B88',
                    'renavam' => '00876543210',
                    'chassis' => '9BWZZZ377VT007766',
                    'brand' => 'Mercedes-Benz',
                    'model' => 'OF-1721 Ônibus Padron Escolar',
                    'year_manufacture' => 2023,
                    'year_model' => 2024,
                    'capacity_seats' => 59,
                    'vehicle_type' => 'bus',
                    'ownership_type' => 'owned',
                    'accessibility_adapted' => true,
                    'detran_inspection_due_date' => Carbon::now()->addMonths(4),
                    'crlv_due_date' => Carbon::now()->addYear(),
                    'status' => 'active',
                ]
            );

            // 2. Condutores (CTB Art. 138)
            $pessoa1 = Pessoa::where('tenant_id', $tenant->id)->first();
            $d1 = null;
            if ($pessoa1) {
                $d1 = TransportDriver::firstOrCreate(
                    ['tenant_id' => $tenant->id, 'cnh_number' => '12345678900'],
                    [
                        'pessoa_id' => $pessoa1->id,
                        'cnh_category' => 'D',
                        'cnh_due_date' => Carbon::now()->addYears(2),
                        'toxicological_due_date' => Carbon::now()->addYears(1),
                        'school_transport_course_due_date' => Carbon::now()->addYears(3),
                        'is_active' => true,
                    ]
                );
            }

            // 3. Rotas & Itinerários
            $r1 = TransportRoute::firstOrCreate(
                ['tenant_id' => $tenant->id, 'code' => 'ROTA-RUR-01'],
                [
                    'name' => 'Linha Veredas - Assentamento Esperança',
                    'shift' => 'morning',
                    'route_type' => 'rural',
                    'distance_paved_km' => 8.50,
                    'distance_unpaved_km' => 25.70,
                    'estimated_duration_minutes' => 50,
                    'assigned_vehicle_id' => $v1->id,
                    'assigned_driver_id' => $d1?->id,
                    'is_active' => true,
                ]
            );

            $r2 = TransportRoute::firstOrCreate(
                ['tenant_id' => $tenant->id, 'code' => 'ROTA-URB-02'],
                [
                    'name' => 'Linha Circular Bairros Sul',
                    'shift' => 'afternoon',
                    'route_type' => 'urban',
                    'distance_paved_km' => 14.80,
                    'distance_unpaved_km' => 0.00,
                    'estimated_duration_minutes' => 35,
                    'assigned_vehicle_id' => $v2->id,
                    'is_active' => true,
                ]
            );

            // 4. Pontos de Parada
            $stop1 = TransportStop::firstOrCreate(
                ['tenant_id' => $tenant->id, 'code' => 'PNT-001'],
                [
                    'name' => 'Comunidade São João',
                    'latitude' => -15.7801,
                    'longitude' => -47.8920,
                    'zone_type' => 'rural',
                    'is_active' => true,
                ]
            );

            $stop2 = TransportStop::firstOrCreate(
                ['tenant_id' => $tenant->id, 'code' => 'PNT-002'],
                [
                    'name' => 'Fazenda Boa Vista',
                    'latitude' => -15.7950,
                    'longitude' => -47.8850,
                    'zone_type' => 'rural',
                    'is_active' => true,
                ]
            );

            $stop3 = TransportStop::firstOrCreate(
                ['tenant_id' => $tenant->id, 'code' => 'PNT-003'],
                [
                    'name' => 'Escola Municipal Rural Castro Alves',
                    'latitude' => -15.8100,
                    'longitude' => -47.8720,
                    'zone_type' => 'rural',
                    'is_active' => true,
                ]
            );

            // 5. Alocações de Alunos com elegibilidade PNATE
            $estudantes = Pessoa::where('tenant_id', $tenant->id)->take(5)->get();
            foreach ($estudantes as $idx => $estudante) {
                TransportStudentAllocation::firstOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'pessoa_id' => $estudante->id,
                        'route_id' => $r1->id,
                    ],
                    [
                        'school_id' => null,
                        'pickup_stop_id' => ($idx % 2 === 0) ? $stop1->id : $stop2->id,
                        'census_eligible_pnate' => true,
                        'status' => 'active',
                    ]
                );
            }
        }
    }
}
