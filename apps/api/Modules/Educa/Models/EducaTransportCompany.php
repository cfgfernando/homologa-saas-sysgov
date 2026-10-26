<?php

declare(strict_types=1);

namespace Modules\Educa\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Pessoas\Models\Pessoa;

final class EducaTransportCompany extends Model
{
    use HasUuids;
    use SoftDeletes;
    use TenantAware;

    protected $table = 'educa_transport_companies';

    protected $fillable = [
        'tenant_id',
        'legal_person_id',
        'responsible_person_id',
        'razao_social',
        'nome_fantasia',
        'cnpj',
        'contract_number',
        'contract_start_date',
        'contract_end_date',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'contract_start_date' => 'date',
        'contract_end_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function legalPerson(): BelongsTo
    {
        return $this->belongsTo(Pessoa::class, 'legal_person_id');
    }

    public function responsiblePerson(): BelongsTo
    {
        return $this->belongsTo(Pessoa::class, 'responsible_person_id');
    }

    public function vehicles(): HasMany
    {
        return $this->hasMany(EducaTransportVehicle::class, 'company_id');
    }

    public function drivers(): HasMany
    {
        return $this->hasMany(EducaTransportDriver::class, 'company_id');
    }

    public function routes(): HasMany
    {
        return $this->hasMany(EducaTransportRoute::class, 'company_id');
    }
}
