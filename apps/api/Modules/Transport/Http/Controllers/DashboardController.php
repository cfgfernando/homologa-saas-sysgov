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
        $sixMonthsAgo = Carbon::today()->subMonths(6);

        // Vehicles
        $totalVehicles = TransportVehicle::count();
        $activeVehicles = TransportVehicle::where('status', 'active')->count();
        $pendingInspectionVehicles = TransportVehicle::where('status', 'active')
            ->where(function ($q) use ($sixMonthsAgo, $today) {
                $q->whereNull('last_inspection_date')
                    ->orWhere('last_inspection_date', '<', $sixMonthsAgo)
                    ->orWhere('next_inspection_date', '<', $today);
            })->count();

        // Drivers
        $totalDrivers = TransportDriver::count();
        $activeDrivers = TransportDriver::where('status', 'active')->count();
        $expiredCnhDrivers = TransportDriver::where('status', 'active')
            ->where('cnh_expiration_date', '<', $today)
            ->count();
        $expiredCourseDrivers = TransportDriver::where('status', 'active')
            ->where(function ($q) use ($today) {
                $q->where('has_school_transport_course', false)
                    ->orWhere(function ($q2) use ($today) {
                        $q2->whereNotNull('course_expiration_date')
                            ->where('course_expiration_date', '<', $today);
                    });
            })->count();

        // Routes
        $totalRoutes = TransportRoute::count();
        $activeRoutes = TransportRoute::where('status', 'active')->count();
        $ruralRoutes = TransportRoute::where('route_type', 'rural')->count();
        $urbanRoutes = TransportRoute::where('route_type', 'urban')->count();
        $mixedRoutes = TransportRoute::where('route_type', 'mixed')->count();

        // Students & Allocations
        $totalAllocations = TransportStudentAllocation::where('status', 'active')->count();
        $pnateEligibleCount = TransportStudentAllocation::where('status', 'active')
            ->where('is_pnate_eligible', true)
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
