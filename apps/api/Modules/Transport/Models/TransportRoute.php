<?php

declare(strict_types=1);

namespace Modules\Transport\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class TransportRoute extends Model
{
    use TenantAware;

    protected $table = 'transport_routes';

    protected $guarded = ['id'];

    protected $casts = [
        'distance_paved_km' => 'float',
        'distance_unpaved_km' => 'float',
        'estimated_duration_minutes' => 'integer',
        'is_active' => 'boolean',
    ];

    public function assignedVehicle(): BelongsTo
    {
        return $this->belongsTo(TransportVehicle::class, 'assigned_vehicle_id');
    }

    public function vehicle(): BelongsTo
    {
        return $this->assignedVehicle();
    }

    public function assignedDriver(): BelongsTo
    {
        return $this->belongsTo(TransportDriver::class, 'assigned_driver_id');
    }

    public function driver(): BelongsTo
    {
        return $this->assignedDriver();
    }

    public function studentAllocations(): HasMany
    {
        return $this->hasMany(TransportStudentAllocation::class, 'route_id');
    }

    public function allocations(): HasMany
    {
        return $this->studentAllocations();
    }

    public function stops(): HasMany
    {
        return $this->hasMany(TransportStop::class, 'tenant_id', 'tenant_id');
    }

    public function activeAllocationsCount(): int
    {
        return $this->studentAllocations()->where('status', 'active')->count();
    }
}
