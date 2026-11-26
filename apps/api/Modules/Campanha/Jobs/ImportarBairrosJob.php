<?php

declare(strict_types=1);

namespace Modules\Campanha\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Modules\Campanha\Services\Referencia\ImportadorBairros;
use Throwable;

/** Importa a malha de bairros de um município (IBGE, ou OpenStreetMap se faltar) depois da resposta HTTP. */
final class ImportarBairrosJob
{
    use Dispatchable;
    use Queueable;

    public function __construct(public readonly int $codigoIbge) {}

    public function handle(ImportadorBairros $importador): void
    {
        try {
            $importador->importar($this->codigoIbge);
        } catch (Throwable $e) {
            Log::warning("Campanha: falha ao importar bairros de {$this->codigoIbge}: {$e->getMessage()}");
        } finally {
            Cache::forget(self::chave($this->codigoIbge));
        }
    }

    /** Trava para não agendar a mesma importação duas vezes enquanto ela roda. */
    public static function chave(int $codigoIbge): string
    {
        return "campanha:importando-bairros:{$codigoIbge}";
    }
}
