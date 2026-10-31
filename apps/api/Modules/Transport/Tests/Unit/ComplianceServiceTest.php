<?php

declare(strict_types=1);

namespace Modules\Transport\Tests\Unit;

use Carbon\Carbon;
use Modules\Transport\Models\TransportDriver;
use Modules\Transport\Models\TransportStop;
use Modules\Transport\Models\TransportVehicle;
use Modules\Transport\Services\DriverComplianceService;
use Modules\Transport\Services\PnateEligibilityService;
use Modules\Transport\Services\VehicleFleetService;
use Tests\TestCase;

final class ComplianceServiceTest extends TestCase
{
    public function test_driver_compliance_fails_when_cnh_is_category_b(): void
    {
        $service = new DriverComplianceService();
        $driver = new TransportDriver();
        $driver->cnh_category = 'B';
        $driver->cnh_due_date = Carbon::now()->addYear();
        $driver->toxicological_due_date = Carbon::now()->addYear();
        $driver->school_transport_course_due_date = Carbon::now()->addYear();
        $driver->is_active = true;

        $result = $service->validateDriver($driver);

        $this->assertFalse($result['compliant']);
        $this->assertStringContainsString('Exigida CNH de categoria D ou E', $result['violations'][0]);
    }

    public function test_driver_compliance_passes_when_all_ctb_requirements_met(): void
    {
        $service = new DriverComplianceService();
        $driver = new TransportDriver();
        $driver->cnh_category = 'D';
        $driver->cnh_due_date = Carbon::now()->addMonths(6);
        $driver->toxicological_due_date = Carbon::now()->addMonths(6);
        $driver->school_transport_course_due_date = Carbon::now()->addMonths(12);
        $driver->is_active = true;

        $result = $service->validateDriver($driver);

        $this->assertTrue($result['compliant']);
        $this->assertEmpty($result['violations']);
    }

    public function test_vehicle_compliance_fails_when_detran_inspection_is_expired(): void
    {
        $service = new VehicleFleetService();
        $vehicle = new TransportVehicle();
        $vehicle->status = 'active';
        $vehicle->detran_inspection_due_date = Carbon::now()->subDay();
        $vehicle->crlv_due_date = Carbon::now()->addMonths(6);

        $result = $service->validateVehicle($vehicle);

        $this->assertFalse($result['compliant']);
        $this->assertStringContainsString('Vistoria semestral do DETRAN vencida', $result['violations'][0]);
    }

    public function test_pnate_eligibility_requires_rural_zone_and_minimum_distance(): void
    {
        $service = new PnateEligibilityService();

        // Ponto de parada rural (Fazenda Santa Luzia, Goiânia rural)
        $ruralStop = new TransportStop();
        $ruralStop->zone_type = 'rural';
        $ruralStop->latitude = -16.600000;
        $ruralStop->longitude = -49.200000;

        // Escola Municipal (Centro, Goiânia) - Distância de aprox 10 km (> 2 km)
        $isEligible = $service->isEligibleForPnate($ruralStop, -16.686900, -49.264800, 2000.0);
        $this->assertTrue($isEligible);

        // Ponto de parada urbano a 500m da escola (não elegível ao PNATE federal)
        $urbanStop = new TransportStop();
        $urbanStop->zone_type = 'urban';
        $urbanStop->latitude = -16.685000;
        $urbanStop->longitude = -49.263000;

        $isUrbanEligible = $service->isEligibleForPnate($urbanStop, -16.686900, -49.264800, 2000.0);
        $this->assertFalse($isUrbanEligible);
    }
}
