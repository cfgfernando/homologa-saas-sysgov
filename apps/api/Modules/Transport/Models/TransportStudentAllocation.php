<?php

declare(strict_types=1);

namespace Modules\Transport\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Pessoas\Models\Pessoa;

final class TransportStudentAllocation extends Model
{
    use TenantAware;

    protected $table = 'transport_student_allocations';

    protected $guarded = ['id', 'tenant_id'];

    protected $casts = [
        'census_eligible_pnate' => 'boolean',
    ];

    public function pessoa(): BelongsTo
    {
        return $this->belongsTo(Pessoa::class, 'pessoa_id');
    }

    public function route(): BelongsTo
    {
        return $this->belongsTo(TransportRoute::class, 'route_id');
    }

    public function pickupStop(): BelongsTo
    {
        return $this->belongsTo(TransportStop::class, 'pickup_stop_id');
    }

    public function dropoffStop(): BelongsTo
    {
        return $this->belongsTo(TransportStop::class, 'dropoff_stop_id');
    }
}
