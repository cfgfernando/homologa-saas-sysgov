<?php

declare(strict_types=1);

namespace Modules\Campanha\Models\Referencia;

use Illuminate\Database\Eloquent\Model;

/**
 * Malha de bairros de um município (GeoJSON, propriedade `nome`) — base pública, sem tenant.
 *
 * @property int $codigo_ibge
 * @property string $geojson
 * @property int $bairros
 * @property string $fonte
 */
final class RefBairros extends Model
{
    protected $table = 'campanha_ref_bairros';

    protected $primaryKey = 'codigo_ibge';

    public $incrementing = false;

    protected $guarded = [];

    protected $hidden = ['geojson'];

    protected $casts = ['codigo_ibge' => 'integer', 'bairros' => 'integer'];
}
