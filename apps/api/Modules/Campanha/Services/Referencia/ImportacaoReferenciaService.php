<?php

declare(strict_types=1);

namespace Modules\Campanha\Services\Referencia;

use Illuminate\Support\Facades\Cache;
use Modules\Campanha\Jobs\ImportarBairrosJob;
use Modules\Campanha\Jobs\ImportarMalhaJob;
use Modules\Campanha\Jobs\ImportarReferenciaJob;
use Modules\Campanha\Models\Referencia\RefBairros;
use Modules\Campanha\Models\Referencia\RefImportacao;
use Modules\Campanha\Models\Referencia\RefMalha;
use Modules\Campanha\Models\Referencia\RefMunicipio;
use Throwable;

/**
 * Importação completa da base pública de uma UF (D4): cada fonte roda à parte — a falha de uma não
 * derruba as outras — e o resultado (contagens, não associados, erros) fica em campanha_ref_importacoes.
 * Nunca toca os dados das campanhas.
 */
final class ImportacaoReferenciaService
{
    public function __construct(
        private readonly ImportadorIbge $ibge,
        private readonly ImportadorTse $tse,
    ) {}

    /**
     * Agenda a importação da UF (depois da resposta HTTP) se a malha ainda não existe e não há
     * importação em andamento iniciada há menos de 30 minutos. Retorna true se há (ou passou a haver) importação.
     */
    public function solicitarSeFaltar(string $uf): bool
    {
        $uf = strtoupper($uf);
        if (!isset(UnidadesFederativas::CODIGOS[$uf])) {
            return false;
        }
        if (RefMalha::query()->whereKey($uf)->exists()) {
            return false;
        }
        $emAndamento = RefImportacao::query()->where('uf', $uf)->where('situacao', 'em_andamento')
            ->where('iniciado_em', '>=', now()->subMinutes(30))->exists();
        if (!$emAndamento) {
            ImportarReferenciaJob::dispatchAfterResponse($uf);
        }

        return true;
    }

    /**
     * Malha gravada com menos municípios que o cadastro (ex.: baixada da API v3 do IBGE, que não tem os
     * municípios novos): agenda só a nova busca da malha, no máximo uma vez a cada 30 minutos por UF.
     * A malha antiga continua sendo servida até a nova chegar (o ETag muda e o navegador baixa de novo).
     */
    public function atualizarMalhaSeIncompleta(RefMalha $malha): bool
    {
        $uf = (string) $malha->uf;
        $naMalha = substr_count((string) $malha->geojson, '"codarea"');
        $cadastrados = RefMunicipio::query()->where('uf', $uf)->count();
        if ($cadastrados === 0 || $naMalha >= $cadastrados) {
            return false;
        }
        if (!Cache::add("campanha:malha-incompleta:{$uf}", true, now()->addMinutes(30))) {
            return true;
        }
        ImportarMalhaJob::dispatchAfterResponse($uf);

        return true;
    }

    /** Agenda a importação dos bairros do município (depois da resposta) se ainda não existem. */
    public function solicitarBairrosSeFaltar(int $codigoIbge): bool
    {
        if (RefBairros::query()->whereKey($codigoIbge)->exists()) {
            return false;
        }
        // Cache::add só grava se a chave não existe: uma importação por vez por município (expira em 15 min).
        if (Cache::add(ImportarBairrosJob::chave($codigoIbge), true, now()->addMinutes(15))) {
            ImportarBairrosJob::dispatchAfterResponse($codigoIbge);
        }

        return true;
    }

    /** @param (callable(string): void)|null $informar */
    public function importar(string $uf, int $eleicao, ?int $anoEleitorado = null, ?callable $informar = null): RefImportacao
    {
        $uf = strtoupper($uf);
        UnidadesFederativas::codigo($uf);
        $registro = RefImportacao::create(['uf' => $uf, 'situacao' => 'em_andamento', 'iniciado_em' => now()]);
        $resumo = [];
        $etapas = [
            'municipios_ibge' => fn () => $this->ibge->municipios($uf),
            'populacao_ibge' => fn () => $this->ibge->populacao($uf),
            'malha_ibge' => fn () => $this->ibge->malha($uf),
            'eleitorado_tse' => fn () => $this->tse->eleitorado($uf, $anoEleitorado),
            'eleitos_tse' => fn () => $this->tse->mandatarios($uf, $eleicao),
        ];
        foreach ($etapas as $nome => $etapa) {
            $informar && $informar("{$nome}…");
            try {
                $resumo[$nome] = ['ok' => true, 'resultado' => $etapa()];
            } catch (Throwable $e) {
                $resumo[$nome] = ['ok' => false, 'erro' => $e->getMessage()];
                if ($nome === 'municipios_ibge') {
                    break; // sem municípios, as demais fontes não têm onde gravar
                }
            }
        }

        $falhou = collect($resumo)->contains(fn (array $r): bool => !$r['ok']) || count($resumo) < count($etapas);
        $registro->update(['situacao' => $falhou ? 'concluida_com_falhas' : 'concluida', 'resumo' => $resumo, 'concluido_em' => now()]);

        return $registro;
    }
}
