<?php

declare(strict_types=1);

namespace Modules\Campanha\Services\Referencia;

use DomainException;

/**
 * Leitor mínimo de shapefile de polígonos (tipo 5) + DBF, só para a malha de bairros do IBGE
 * (SIRGAS 2000 em graus, compatível com WGS84 para o mapa).
 */
final class LeitorShapefile
{
    /**
     * Feições GeoJSON (MultiPolygon, propriedade `nome`) dos bairros de um município.
     *
     * @return list<array<string, mixed>>
     */
    public static function bairros(string $shp, string $dbf, int $codigoIbge): array
    {
        $registros = self::dbf($dbf);
        $feicoes = [];
        $pos = 100; // cabeçalho do .shp
        $tamanho = strlen($shp);
        foreach ($registros as $atributos) {
            if ($pos + 8 > $tamanho) {
                break;
            }
            $conteudo = unpack('N', $shp, $pos + 4)[1] * 2;
            $inicio = $pos + 8;
            $pos = $inicio + $conteudo;
            if ((int) ($atributos['CD_MUN'] ?? 0) !== $codigoIbge) {
                continue;
            }
            $tipo = unpack('V', $shp, $inicio)[1];
            if ($tipo !== 5) {
                continue; // registro nulo ou não poligonal
            }
            $poligonos = self::poligono($shp, $inicio);
            if ($poligonos !== []) {
                $feicoes[] = [
                    'type' => 'Feature',
                    'properties' => ['nome' => trim((string) ($atributos['NM_BAIRRO'] ?? '')), 'codigo' => trim((string) ($atributos['CD_BAIRRO'] ?? ''))],
                    'geometry' => ['type' => 'MultiPolygon', 'coordinates' => $poligonos],
                ];
            }
        }

        return $feicoes;
    }

    /**
     * Anéis do registro agrupados em polígonos: no shapefile, anel horário = externo, anti-horário = buraco.
     *
     * @return list<list<list<array{0: float, 1: float}>>>
     */
    private static function poligono(string $shp, int $inicio): array
    {
        ['p' => $partes, 'n' => $pontos] = unpack('Vp/Vn', $shp, $inicio + 36);
        $indices = array_values(unpack("V{$partes}", $shp, $inicio + 44));
        $base = $inicio + 44 + 4 * $partes;
        $poligonos = [];
        for ($i = 0; $i < $partes; $i++) {
            $de = $indices[$i];
            $ate = $i + 1 < $partes ? $indices[$i + 1] : $pontos;
            $anel = [];
            $area = 0.0;
            for ($k = $de; $k < $ate; $k++) {
                $xy = unpack('ex/ey', $shp, $base + 16 * $k);
                $anel[] = [round($xy['x'], 5), round($xy['y'], 5)];
            }
            for ($k = 0, $j = count($anel) - 1; $k < count($anel); $j = $k++) {
                $area += ($anel[$j][0] - $anel[$k][0]) * ($anel[$j][1] + $anel[$k][1]);
            }
            if (count($anel) < 4) {
                continue;
            }
            if ($area < 0 || $poligonos === []) {
                $poligonos[] = [$anel]; // horário (área < 0 nesta fórmula): externo
            } else {
                $poligonos[count($poligonos) - 1][] = $anel; // buraco do último externo
            }
        }

        return $poligonos;
    }

    /** @return list<array<string, string>> registros do DBF (dBase III), na ordem do .shp. */
    private static function dbf(string $dbf): array
    {
        if (strlen($dbf) < 32) {
            throw new DomainException('DBF inválido.');
        }
        ['n' => $total, 'h' => $cabecalho, 'r' => $registro] = unpack('Vn/vh/vr', $dbf, 4);
        $campos = [];
        for ($p = 32; $p < $cabecalho - 1 && ord($dbf[$p]) !== 0x0D; $p += 32) {
            $campos[] = [rtrim(substr($dbf, $p, 11), "\0"), ord($dbf[$p + 16])];
        }
        $saida = [];
        for ($i = 0; $i < $total; $i++) {
            $off = $cabecalho + $i * $registro + 1; // 1º byte: marca de excluído
            $linha = [];
            foreach ($campos as [$nome, $largura]) {
                $linha[$nome] = trim(substr($dbf, $off, $largura));
                $off += $largura;
            }
            $saida[] = $linha;
        }

        return $saida;
    }
}
