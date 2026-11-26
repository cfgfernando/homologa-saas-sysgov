<?php

declare(strict_types=1);

namespace Modules\Campanha\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Modules\Campanha\Services\Referencia\ImportadorIbge;

/**
 * Busca de novo só a malha municipal da UF no IBGE. Disparado depois da resposta quando a malha gravada tem
 * menos municípios que o cadastro (malha antiga, sem os municípios instalados depois).
 */
final class ImportarMalhaJob
{
    use Dispatchable;
    use Queueable;

    public function __construct(public readonly string $uf) {}

    public function handle(ImportadorIbge $ibge): void
    {
        $ibge->malha($this->uf);
    }
}
