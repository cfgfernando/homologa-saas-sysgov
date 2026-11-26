<?php

declare(strict_types=1);

namespace Modules\Campanha\Services\Referencia;

use DomainException;
use Illuminate\Support\Facades\Http;
use Modules\Campanha\Models\Referencia\RefBairros;
use ZipArchive;

/**
 * Malha de bairros de um município, para campanhas municipais (Prefeito/Vereador).
 * 1º IBGE — bairros do Censo 2022 (shapefile por UF); 2º, se o município não tem bairros oficiais,
 * OpenStreetMap (Overpass: limites administrativos 9/10 dentro do município). Sem nenhum dos dois,
 * grava a malha vazia (o mapa mostra só o contorno do município).
 */
final class ImportadorBairros
{
    public function importar(int $codigoIbge): RefBairros
    {
        $uf = array_search(intdiv($codigoIbge, 100000), UnidadesFederativas::CODIGOS, true);
        if ($uf === false) {
            throw new DomainException("Código IBGE de município inválido: {$codigoIbge}.");
        }

        try {
            $feicoes = $this->ibge((string) $uf, $codigoIbge);
        } catch (DomainException) {
            $feicoes = []; // IBGE fora do ar ou arquivo inválido: tenta o OpenStreetMap
        }
        $fonte = 'IBGE — bairros do Censo 2022';
        if ($feicoes === []) {
            $feicoes = $this->osm($codigoIbge);
            $fonte = $feicoes === [] ? 'Sem bairros no IBGE nem no OpenStreetMap' : '© colaboradores do OpenStreetMap (ODbL)';
        }

        return RefBairros::query()->updateOrCreate(['codigo_ibge' => $codigoIbge], [
            'geojson' => json_encode(['type' => 'FeatureCollection', 'features' => $feicoes], JSON_UNESCAPED_UNICODE),
            'bairros' => count($feicoes),
            'fonte' => $fonte,
        ]);
    }

    /** @return list<array<string, mixed>> bairros do município no shapefile do IBGE (UF inteira, guardado por 30 dias). */
    public function ibge(string $uf, int $codigoIbge): array
    {
        $arquivo = storage_path("app/campanha/bairros/{$uf}_bairros_CD2022.zip");
        if (!is_file($arquivo) || filemtime($arquivo) < time() - 30 * 86400) {
            @mkdir(dirname($arquivo), 0775, true);
            $resposta = Http::timeout(300)->retry(2, 3000, throw: false)->sink($arquivo)
                ->get(config('campanha.fontes.ibge_bairros') . "/{$uf}_bairros_CD2022.zip");
            if (!$resposta->successful()) {
                @unlink($arquivo);
                throw new DomainException("Falha ao baixar os bairros do IBGE para {$uf} (HTTP {$resposta->status()}).");
            }
        }

        $zip = new ZipArchive();
        if ($zip->open($arquivo) !== true) {
            @unlink($arquivo);
            throw new DomainException("Arquivo de bairros do IBGE inválido para {$uf}.");
        }
        $shp = $dbf = null;
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $nome = (string) $zip->getNameIndex($i);
            if (str_ends_with(strtolower($nome), '.shp')) {
                $shp = $zip->getFromIndex($i);
            } elseif (str_ends_with(strtolower($nome), '.dbf')) {
                $dbf = $zip->getFromIndex($i);
            }
        }
        $zip->close();
        if (!is_string($shp) || !is_string($dbf)) {
            throw new DomainException("O arquivo de bairros do IBGE para {$uf} não tem .shp/.dbf.");
        }

        return LeitorShapefile::bairros($shp, $dbf, $codigoIbge);
    }

    /** @return list<array<string, mixed>> bairros (admin_level 9/10) do OpenStreetMap dentro do município. */
    public function osm(int $codigoIbge): array
    {
        $consulta = '[out:json][timeout:120];'
            . 'area["IBGE:GEOCODIGO"="' . $codigoIbge . '"]["boundary"="administrative"]->.m;'
            . 'rel(area.m)["boundary"="administrative"]["admin_level"~"^(9|10)$"];'
            . 'out geom;';
        $resposta = Http::timeout(180)->retry(2, 5000, throw: false)->asForm()
            ->withHeaders(['User-Agent' => 'SYSGOV-Campanha/1.0'])
            ->post((string) config('campanha.fontes.osm_overpass'), ['data' => $consulta]);
        if (!$resposta->successful() || !is_array($resposta->json('elements'))) {
            throw new DomainException("Falha ao consultar o OpenStreetMap (HTTP {$resposta->status()}).");
        }

        $feicoes = [];
        foreach ($resposta->json('elements') as $rel) {
            $nome = trim((string) ($rel['tags']['name'] ?? ''));
            $externos = $internos = [];
            foreach ($rel['members'] ?? [] as $m) {
                if (($m['type'] ?? '') !== 'way' || empty($m['geometry'])) {
                    continue;
                }
                $linha = array_map(fn (array $p): array => [round((float) $p['lon'], 5), round((float) $p['lat'], 5)], $m['geometry']);
                ($m['role'] ?? 'outer') === 'inner' ? $internos[] = $linha : $externos[] = $linha;
            }
            $aneis = self::juntarAneis($externos);
            if ($nome === '' || $aneis === []) {
                continue;
            }
            $buracos = self::juntarAneis($internos);
            $poligonos = array_map(fn (array $anel): array => [$anel], $aneis);
            // Buracos vão para o 1º polígono (relações de bairro raramente têm mais de um anel externo).
            foreach ($buracos as $b) {
                $poligonos[0][] = $b;
            }
            $feicoes[] = ['type' => 'Feature', 'properties' => ['nome' => $nome], 'geometry' => ['type' => 'MultiPolygon', 'coordinates' => $poligonos]];
        }

        return $feicoes;
    }

    /**
     * Junta trechos (ways) ponta com ponta até fechar anéis.
     *
     * @param list<list<array{0: float, 1: float}>> $trechos
     * @return list<list<array{0: float, 1: float}>>
     */
    public static function juntarAneis(array $trechos): array
    {
        $aneis = [];
        $mesmo = fn (array $a, array $b): bool => $a[0] === $b[0] && $a[1] === $b[1];
        while ($trechos !== []) {
            $anel = array_shift($trechos);
            $mudou = true;
            while (!$mesmo($anel[0], $anel[count($anel) - 1]) && $mudou) {
                $mudou = false;
                foreach ($trechos as $i => $t) {
                    $fim = $anel[count($anel) - 1];
                    if ($mesmo($fim, $t[0])) {
                        $anel = array_merge($anel, array_slice($t, 1));
                    } elseif ($mesmo($fim, $t[count($t) - 1])) {
                        $anel = array_merge($anel, array_slice(array_reverse($t), 1));
                    } else {
                        continue;
                    }
                    unset($trechos[$i]);
                    $mudou = true;
                    break;
                }
                $trechos = array_values($trechos);
            }
            if (count($anel) >= 4 && $mesmo($anel[0], $anel[count($anel) - 1])) {
                $aneis[] = $anel;
            }
        }

        return $aneis;
    }
}
