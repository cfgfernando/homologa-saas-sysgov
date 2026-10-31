<?php

declare(strict_types=1);

namespace Modules\Transport\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

final class TransportVehicle extends Model
{
    use TenantAware;
    use SoftDeletes;

    protected $table = 'transport_vehicles';

    protected $guarded = ['id'];

    protected $casts = [
        'year_manufacture' => 'integer',
        'year_model' => 'integer',
        'capacity_seats' => 'integer',
        'accessibility_adapted' => 'boolean',
        'detran_inspection_due_date' => 'date',
        'crlv_due_date' => 'date',
        'metadata' => 'array',
    ];

    public function routes(): HasMany
    {
        return $this->hasMany(TransportRoute::class, 'assigned_vehicle_id');
    }

    public function maintenanceOrders(): HasMany
    {
        return $this->hasMany(TransportMaintenanceOrder::class, 'vehicle_id');
    }

    public function isDetranInspectionExpired(): bool
    {
        return $this->detran_inspection_due_date->isPast();
    }
}
