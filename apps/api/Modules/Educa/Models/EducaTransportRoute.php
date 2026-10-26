<?php

declare(strict_types=1);

namespace Modules\Educa\Models;

use App\Models\Concerns\TenantAware;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Linha ou itinerário de Transporte Escolar Municipal.
 */
final class EducaTransportRoute extends Model
{
    use HasUuids;
    use SoftDeletes;
    use TenantAware;

    public const TURNO_MATUTINO = 'matutino';
    public const TURNO_VESPERTINO = 'vespertino';
    public const TURNO_NOTURNO = 'noturno';
    public const TURNO_INTEGRAL = 'integral';

    public const TIPO_URBANA = 'urbana';
    public const TIPO_RURAL = 'rural';
    public const TIPO_MISTA = 'mista';

    protected $table = 'educa_transport_routes';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'codigo',
        'nome',
        'academic_year',
        'turno',
        'tipo_rota',
        'quilometragem_estimada',
        'km_paved',
        'km_unpaved',
        'horario_saida',
        'horario_chegada',
        'return_departure_time',
        'is_outsourced',
        'ativo',
    ];

    protected $casts = [
        'academic_year' => 'integer',
        'quilometragem_estimada' => 'float',
        'km_paved' => 'float',
        'km_unpaved' => 'float',
        'is_outsourced' => 'boolean',
        'ativo' => 'boolean',
    ];

    public function company(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(EducaTransportCompany::class, 'company_id');
    }

    public function stops(): HasMany
    {
        return $this->hasMany(EducaTransportStop::class, 'route_id')->orderBy('ordem');
    }

    public function schools(): BelongsToMany
    {
        return $this->belongsToMany(EducaSchool::class, 'educa_transport_route_schools', 'route_id', 'school_id')
            ->withTimestamps();
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(EducaTransportStudentAllocation::class, 'route_id');
    }
}
