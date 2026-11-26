<?php

declare(strict_types=1);

namespace Modules\Campanha\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Modules\Campanha\Services\Referencia\ImportacaoReferenciaService;

/**
 * Importa a base pública (IBGE + TSE) de uma UF — o mesmo que `campanha:importar-referencia`.
 * Disparado depois da resposta quando a campanha usa uma UF cuja malha ainda não existe.
 */
final class ImportarReferenciaJob
{
    use Dispatchable;
    use Queueable;

    public function __construct(public readonly string $uf) {}

    public function handle(ImportacaoReferenciaService $importacao): void
    {
        $importacao->importar($this->uf, (int) config('campanha.eleicao_municipal', 2024));
    }
}
