<?php

declare(strict_types=1);

namespace Modules\Transport\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class TransportMaintenanceOrder extends Model
{
    use TenantAware;

    protected $table = 'transport_maintenance_orders';

    protected $guarded = ['id', 'tenant_id'];

    protected $casts = [
        'amount_cents' => 'integer',
        'odometer_km' => 'integer',
        'service_date' => 'date',
    ];

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(TransportVehicle::class, 'vehicle_id');
    }
}
