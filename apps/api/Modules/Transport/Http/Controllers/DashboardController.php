<?php

declare(strict_types=1);

namespace Modules\Transport\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Modules\Transport\Models\TransportDriver;
use Modules\Transport\Models\TransportRoute;
use Modules\Transport\Models\TransportStudentAllocation;
use Modules\Transport\Models\TransportVehicle;

final class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $today = Carbon::today();

        // Vehicles (Frota Escolar)
        $totalVehicles = TransportVehicle::count();
        $activeVehicles = TransportVehicle::where('status', 'active')->count();
        $pendingInspectionVehicles = TransportVehicle::where('status', 'active')
            ->where(function ($q) use ($today) {
                $q->whereNull('detran_inspection_due_date')
                    ->orWhere('detran_inspection_due_date', '<', $today);
            })->count();

        // Drivers (Condutores CTB Art. 138)
        $totalDrivers = TransportDriver::count();
        $activeDrivers = TransportDriver::where('is_active', true)->count();
        $expiredCnhDrivers = TransportDriver::where('is_active', true)
            ->where('cnh_due_date', '<', $today)
            ->count();
        $expiredCourseDrivers = TransportDriver::where('is_active', true)
            ->where('school_transport_course_due_date', '<', $today)
            ->count();

        // Routes (Rotas e Itinerários)
        $totalRoutes = TransportRoute::count();
        $activeRoutes = TransportRoute::where('is_active', true)->count();
        $ruralRoutes = TransportRoute::where('route_type', 'rural')->count();
        $urbanRoutes = TransportRoute::where('route_type', 'urban')->count();
        $mixedRoutes = TransportRoute::where('route_type', 'mixed')->count();

        // Students & Allocations (PNATE FNDE)
        $totalAllocations = TransportStudentAllocation::where('status', 'active')->count();
        $pnateEligibleCount = TransportStudentAllocation::where('status', 'active')
            ->where('census_eligible_pnate', true)
            ->count();

        return response()->json([
            'data' => [
                'vehicles' => [
                    'total' => $totalVehicles,
                    'active' => $activeVehicles,
                    'pending_inspection' => $pendingInspectionVehicles,
                ],
                'drivers' => [
                    'total' => $totalDrivers,
                    'active' => $activeDrivers,
                    'expired_cnh' => $expiredCnhDrivers,
                    'expired_course' => $expiredCourseDrivers,
                ],
                'routes' => [
                    'total' => $totalRoutes,
                    'active' => $activeRoutes,
                    'rural' => $ruralRoutes,
                    'urban' => $urbanRoutes,
                    'mixed' => $mixedRoutes,
                ],
                'students' => [
                    'total_transported' => $totalAllocations,
                    'pnate_eligible' => $pnateEligibleCount,
                ],
            ],
        ]);
    }
}
