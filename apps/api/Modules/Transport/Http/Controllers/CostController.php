<?php

declare(strict_types=1);

namespace Modules\Transport\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Support\AuditLogger;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Transport\Models\TransportCostParameter;
use Modules\Transport\Models\TransportRoute;

final class CostController extends Controller
{
    public function __construct(
        private readonly AuditLogger $audit,
        private readonly TenantContext $tenantContext,
    ) {}

    public function getParameters(): JsonResponse
    {
        $params = TransportCostParameter::firstOrCreate(
            ['tenant_id' => $this->tenantContext->id()],
            [
                'fuel_price_cents' => 580,
                'avg_consumption_km_per_liter' => 3.80,
                'maintenance_cost_per_km_cents' => 120,
                'tire_cost_per_km_cents' => 45,
                'driver_salary_cents' => 320000,
            ]
        );

        return response()->json(['data' => $params]);
    }

    public function updateParameters(Request $request): JsonResponse
    {
        $data = $request->validate([
            'fuel_price_cents' => ['required', 'integer', 'min:0'],
            'avg_consumption_km_per_liter' => ['required', 'numeric', 'min:0.1'],
            'maintenance_cost_per_km_cents' => ['required', 'integer', 'min:0'],
            'tire_cost_per_km_cents' => ['required', 'integer', 'min:0'],
            'driver_salary_cents' => ['required', 'integer', 'min:0'],
        ]);

        $params = TransportCostParameter::updateOrCreate(
            ['tenant_id' => $this->tenantContext->id()],
            $data
        );

        $this->audit->record('transporte', 'update', 'cost_parameters:' . $params->id, null, $params->toArray());

        return response()->json(['data' => $params]);
    }

    public function calculateRoutes(): JsonResponse
    {
        $params = TransportCostParameter::firstOrCreate(
            ['tenant_id' => $this->tenantContext->id()],
            [
                'fuel_price_cents' => 580,
                'avg_consumption_km_per_liter' => 3.80,
                'maintenance_cost_per_km_cents' => 120,
                'tire_cost_per_km_cents' => 45,
                'driver_salary_cents' => 320000,
            ]
        );

        $routes = TransportRoute::with(['vehicle', 'allocations'])->where('is_active', true)->get();

        $results = $routes->map(function ($route) use ($params) {
            $totalDistanceKm = (float) ($route->distance_paved_km + $route->distance_unpaved_km);
            // 20 school days per month, 2 trips per day (round trip)
            $monthlyDistanceKm = $totalDistanceKm * 2 * 20;

            // Fuel cost = (Monthly Km / consumption) * fuel price
            $litersNeeded = $params->avg_consumption_km_per_liter > 0
                ? ($monthlyDistanceKm / $params->avg_consumption_km_per_liter)
                : 0;
            $monthlyFuelCostCents = (int) round($litersNeeded * $params->fuel_price_cents);

            // Maintenance cost = Monthly Km * maintenance per km
            $monthlyMaintenanceCostCents = (int) round($monthlyDistanceKm * $params->maintenance_cost_per_km_cents);

            // Tire cost = Monthly Km * tire per km
            $monthlyTireCostCents = (int) round($monthlyDistanceKm * $params->tire_cost_per_km_cents);

            // Fixed driver cost
            $monthlyDriverCostCents = $params->driver_salary_cents;

            $totalMonthlyCostCents = $monthlyFuelCostCents + $monthlyMaintenanceCostCents + $monthlyTireCostCents + $monthlyDriverCostCents;

            $studentsCount = $route->allocations->count();
            $costPerStudentCents = $studentsCount > 0
                ? (int) round($totalMonthlyCostCents / $studentsCount)
                : $totalMonthlyCostCents;

            return [
                'route_id' => $route->id,
                'route_code' => $route->code,
                'route_name' => $route->name,
                'daily_distance_km' => round($totalDistanceKm * 2, 2),
                'monthly_distance_km' => round($monthlyDistanceKm, 2),
                'students_count' => $studentsCount,
                'monthly_fuel_cost_cents' => $monthlyFuelCostCents,
                'monthly_maintenance_cost_cents' => $monthlyMaintenanceCostCents,
                'monthly_tire_cost_cents' => $monthlyTireCostCents,
                'monthly_driver_cost_cents' => $monthlyDriverCostCents,
                'total_monthly_cost_cents' => $totalMonthlyCostCents,
                'cost_per_student_cents' => $costPerStudentCents,
            ];
        });

        return response()->json(['data' => $results, 'parameters' => $params]);
    }
}
