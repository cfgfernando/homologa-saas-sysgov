<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Modules\Transport\Http\Controllers\AllocationController;
use Modules\Transport\Http\Controllers\CostController;
use Modules\Transport\Http\Controllers\DashboardController;
use Modules\Transport\Http\Controllers\DriverController;
use Modules\Transport\Http\Controllers\MaintenanceController;
use Modules\Transport\Http\Controllers\MonitorController;
use Modules\Transport\Http\Controllers\RouteController;
use Modules\Transport\Http\Controllers\SupplierController;
use Modules\Transport\Http\Controllers\VehicleController;

Route::get('/health', fn () => response()->json(['status' => 'ok', 'module' => 'Transport']));

Route::get('/dashboard', [DashboardController::class, 'index'])->name('transport.dashboard');

// Vehicles (Frota Escolar)
Route::prefix('vehicles')->group(function (): void {
    Route::get('/', [VehicleController::class, 'index'])->name('transport.vehicles.index');
    Route::post('/', [VehicleController::class, 'store'])->name('transport.vehicles.store');
    Route::get('/{id}', [VehicleController::class, 'show'])->name('transport.vehicles.show');
    Route::put('/{id}', [VehicleController::class, 'update'])->name('transport.vehicles.update');
    Route::delete('/{id}', [VehicleController::class, 'destroy'])->name('transport.vehicles.destroy');
});

// Drivers (Condutores CTB Art. 138)
Route::prefix('drivers')->group(function (): void {
    Route::get('/', [DriverController::class, 'index'])->name('transport.drivers.index');
    Route::post('/', [DriverController::class, 'store'])->name('transport.drivers.store');
    Route::get('/{id}', [DriverController::class, 'show'])->name('transport.drivers.show');
    Route::put('/{id}', [DriverController::class, 'update'])->name('transport.drivers.update');
    Route::delete('/{id}', [DriverController::class, 'destroy'])->name('transport.drivers.destroy');
});

// Monitors (Monitores de Bordo)
Route::prefix('monitors')->group(function (): void {
    Route::get('/', [MonitorController::class, 'index'])->name('transport.monitors.index');
    Route::post('/', [MonitorController::class, 'store'])->name('transport.monitors.store');
    Route::get('/{id}', [MonitorController::class, 'show'])->name('transport.monitors.show');
    Route::delete('/{id}', [MonitorController::class, 'destroy'])->name('transport.monitors.destroy');
});

// Suppliers (Fornecedores e Terceirizados)
Route::prefix('suppliers')->group(function (): void {
    Route::get('/', [SupplierController::class, 'index'])->name('transport.suppliers.index');
    Route::post('/', [SupplierController::class, 'store'])->name('transport.suppliers.store');
    Route::get('/{id}', [SupplierController::class, 'show'])->name('transport.suppliers.show');
    Route::delete('/{id}', [SupplierController::class, 'destroy'])->name('transport.suppliers.destroy');
});

// Maintenance (Ordens de Serviço)
Route::prefix('maintenance-orders')->group(function (): void {
    Route::get('/', [MaintenanceController::class, 'index'])->name('transport.maintenance.index');
    Route::post('/', [MaintenanceController::class, 'store'])->name('transport.maintenance.store');
    Route::get('/{id}', [MaintenanceController::class, 'show'])->name('transport.maintenance.show');
    Route::delete('/{id}', [MaintenanceController::class, 'destroy'])->name('transport.maintenance.destroy');
});

// Costs (Cálculo de Custos e Parâmetros)
Route::prefix('costs')->group(function (): void {
    Route::get('/parameters', [CostController::class, 'getParameters'])->name('transport.costs.parameters');
    Route::put('/parameters', [CostController::class, 'updateParameters'])->name('transport.costs.update-parameters');
    Route::get('/calculate', [CostController::class, 'calculateRoutes'])->name('transport.costs.calculate');
});

// Routes (Rotas e Itinerários)
Route::prefix('routes')->group(function (): void {
    Route::get('/', [RouteController::class, 'index'])->name('transport.routes.index');
    Route::post('/', [RouteController::class, 'store'])->name('transport.routes.store');
    Route::get('/{id}', [RouteController::class, 'show'])->name('transport.routes.show');
    Route::put('/{id}', [RouteController::class, 'update'])->name('transport.routes.update');
    Route::delete('/{id}', [RouteController::class, 'destroy'])->name('transport.routes.destroy');
});

// Student Allocations (Alocação de Alunos e PNATE)
Route::prefix('allocations')->group(function (): void {
    Route::get('/', [AllocationController::class, 'index'])->name('transport.allocations.index');
    Route::post('/', [AllocationController::class, 'store'])->name('transport.allocations.store');
    Route::get('/{id}', [AllocationController::class, 'show'])->name('transport.allocations.show');
    Route::delete('/{id}', [AllocationController::class, 'destroy'])->name('transport.allocations.destroy');
});
