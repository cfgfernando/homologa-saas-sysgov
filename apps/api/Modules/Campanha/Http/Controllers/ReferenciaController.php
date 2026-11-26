<?php

declare(strict_types=1);

namespace Modules\Campanha\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Modules\Campanha\Models\Campanha;
use Modules\Campanha\Models\Referencia\RefBairros;
use Modules\Campanha\Models\Referencia\RefImportacao;
use Modules\Campanha\Models\Referencia\RefMalha;
use Modules\Campanha\Models\Referencia\RefMunicipio;
use Modules\Campanha\Services\Referencia\ImportacaoReferenciaService;
use Modules\Campanha\Services\Referencia\UnidadesFederativas;

/** Base territorial pública (IBGE/TSE) — só leitura para os tenants (D3). */
final class ReferenciaController extends Controller
{
    public function municipios(string $uf): JsonResponse
    {
        $this->authorize('viewAny', Campanha::class);
        $uf = $this->uf($uf);
        $municipios = RefMunicipio::query()->where('uf', $uf)->orderBy('nome')->get();
        if ($municipios->isEmpty()) {
            app(ImportacaoReferenciaService::class)->solicitarSeFaltar($uf); // UF nova: busca IBGE/TSE em segundo plano
        }

        return response()->json([
            'municipios' => $municipios,
            'ultima_importacao' => RefImportacao::query()->where('uf', $uf)->latest('iniciado_em')->first(['situacao', 'iniciado_em', 'concluido_em']),
        ]);
    }

    /** GeoJSON dos municípios da UF, com ETag (o navegador guarda e revalida). */
    public function malha(Request $request, string $uf): Response
    {
        $this->authorize('viewAny', Campanha::class);
        $uf = $this->uf($uf);
        $malha = RefMalha::query()->find($uf);
        if ($malha === null) {
            // Primeira vez que alguém pede o mapa desta UF: busca IBGE/TSE em segundo plano.
            app(ImportacaoReferenciaService::class)->solicitarSeFaltar($uf);
            abort(404, 'A malha desta UF ainda não foi importada.');
        }
        // Malha velha/incompleta (faltam municípios do cadastro): serve a atual e busca a nova em segundo plano.
        app(ImportacaoReferenciaService::class)->atualizarMalhaSeIncompleta($malha);

        $etag = '"' . md5($malha->uf . (string) $malha->updated_at?->timestamp) . '"';
        if ($request->header('If-None-Match') === $etag) {
            return response('', 304, ['ETag' => $etag]);
        }

        return response($malha->geojson, 200, [
            'Content-Type' => 'application/geo+json',
            'ETag' => $etag,
            'Cache-Control' => 'private, no-cache',
        ]);
    }

    /** GeoJSON dos bairros de um município (campanhas de Prefeito/Vereador), com ETag. Sem malha: agenda a importação e responde 404. */
    public function bairros(Request $request, int $codigoIbge): Response
    {
        $this->authorize('viewAny', Campanha::class);
        abort_unless(in_array(intdiv($codigoIbge, 100000), UnidadesFederativas::CODIGOS, true), 404, 'Município inválido.');
        $bairros = RefBairros::query()->find($codigoIbge);
        if ($bairros === null) {
            app(ImportacaoReferenciaService::class)->solicitarBairrosSeFaltar($codigoIbge);
            abort(404, 'Os bairros deste município ainda não foram importados.');
        }

        $etag = '"' . md5($codigoIbge . (string) $bairros->updated_at?->timestamp) . '"';
        if ($request->header('If-None-Match') === $etag) {
            return response('', 304, ['ETag' => $etag]);
        }

        return response($bairros->geojson, 200, [
            'Content-Type' => 'application/geo+json',
            'ETag' => $etag,
            'Cache-Control' => 'private, no-cache',
            'X-Fonte-Bairros' => rawurlencode($bairros->fonte),
        ]);
    }

    private function uf(string $uf): string
    {
        $uf = strtoupper($uf);
        abort_unless(isset(UnidadesFederativas::CODIGOS[$uf]), 404, 'UF inválida.');

        return $uf;
    }
}
