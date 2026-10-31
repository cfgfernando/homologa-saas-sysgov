<?php

declare(strict_types=1);

namespace Modules\Transport\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class TransportStop extends Model
{
    use TenantAware;

    protected $table = 'transport_stops';

    protected $guarded = ['id'];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'rural_obstacles' => 'array',
        'is_active' => 'boolean',
    ];

    public function pickupAllocations(): HasMany
    {
        return $this->hasMany(TransportStudentAllocation::class, 'pickup_stop_id');
    }
}
