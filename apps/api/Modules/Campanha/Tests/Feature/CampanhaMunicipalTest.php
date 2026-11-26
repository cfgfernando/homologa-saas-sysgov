<?php

declare(strict_types=1);

namespace Modules\Campanha\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Http;
use Modules\Campanha\Jobs\ImportarBairrosJob;
use Modules\Campanha\Models\Referencia\RefBairros;
use Modules\Campanha\Services\Referencia\ImportadorBairros;
use Modules\Campanha\Tests\Concerns\CenarioCampanha;
use Modules\Campanha\Tests\TestCase;

/** Campanha de Prefeito/Vereador: município obrigatório na UF e mapa por bairros. */
final class CampanhaMunicipalTest extends TestCase
{
    use CenarioCampanha;
    use RefreshDatabase;

    public function test_prefeito_e_vereador_exigem_municipio_da_uf_e_agendam_os_bairros(): void
    {
        $tenant = $this->criarTenant();
        $gestao = $this->como($this->usuario($tenant), $tenant);

        $gestao->postJson('/api/campanha/campanhas', ['nome' => 'Prefeito PG', 'ano' => 2028, 'cargo' => 'Prefeito', 'uf' => 'PR'])
            ->assertStatus(422)->assertJsonPath('error', 'Informe o município da campanha para Prefeito.');
        $gestao->postJson('/api/campanha/campanhas', ['nome' => 'Prefeito PG', 'ano' => 2028, 'cargo' => 'Prefeito', 'uf' => 'PR', 'codigo_ibge' => 4205407])
            ->assertStatus(422)->assertJsonPath('error', 'O município escolhido não pertence a PR.');
        $gestao->postJson('/api/campanha/campanhas', ['nome' => 'X', 'ano' => 2028, 'cargo' => 'Síndico', 'uf' => 'PR'])->assertStatus(422);

        $id = $gestao->postJson('/api/campanha/campanhas', ['nome' => 'Prefeito PG', 'ano' => 2028, 'cargo' => 'Prefeito', 'uf' => 'PR', 'codigo_ibge' => 4119905])
            ->assertCreated()->assertJsonPath('codigo_ibge', 4119905)->json('id');
        Bus::assertDispatchedAfterResponse(ImportarBairrosJob::class, fn (ImportarBairrosJob $j) => $j->codigoIbge === 4119905);

        // Virou cargo estadual: o município é descartado.
        $gestao->putJson("/api/campanha/campanhas/{$id}", ['cargo' => 'Deputado Estadual'])->assertOk()->assertJsonPath('codigo_ibge', null);
    }

    public function test_bairros_do_municipio_com_etag_e_importacao_agendada_uma_vez(): void
    {
        $tenant = $this->criarTenant();
        $consulta = $this->como($this->usuario($tenant, ['campanha_consulta']), $tenant);

        $consulta->getJson('/api/campanha/referencia/municipios/4119905/bairros')->assertNotFound();
        $consulta->getJson('/api/campanha/referencia/municipios/4119905/bairros')->assertNotFound();
        Bus::assertDispatchedAfterResponseTimes(ImportarBairrosJob::class, 1);
        $consulta->getJson('/api/campanha/referencia/municipios/9999999/bairros')->assertNotFound();

        RefBairros::query()->create(['codigo_ibge' => 4119905, 'geojson' => '{"type":"FeatureCollection","features":[]}', 'bairros' => 0, 'fonte' => 'teste']);
        $r = $consulta->get('/api/campanha/referencia/municipios/4119905/bairros')->assertOk();
        $consulta->withHeader('If-None-Match', (string) $r->headers->get('ETag'))->get('/api/campanha/referencia/municipios/4119905/bairros')->assertStatus(304);
    }

    public function test_sem_bairros_no_ibge_usa_o_openstreetmap(): void
    {
        $importador = app(ImportadorBairros::class);
        @unlink(storage_path('app/campanha/bairros/PR_bairros_CD2022.zip'));
        Http::fake(['geoftp.ibge.gov.br/*' => Http::response('', 404), 'overpass*' => Http::response(['elements' => [[
            'type' => 'relation', 'tags' => ['name' => 'Centro'],
            'members' => [
                ['type' => 'way', 'role' => 'outer', 'geometry' => [['lat' => 0, 'lon' => 0], ['lat' => 0, 'lon' => 1]]],
                ['type' => 'way', 'role' => 'outer', 'geometry' => [['lat' => 1, 'lon' => 1], ['lat' => 0, 'lon' => 1]]],
                ['type' => 'way', 'role' => 'outer', 'geometry' => [['lat' => 1, 'lon' => 1], ['lat' => 0, 'lon' => 0]]],
            ],
        ]]])]);

        $registro = $importador->importar(4119905);

        $this->assertSame(1, $registro->bairros);
        $this->assertStringContainsString('OpenStreetMap', $registro->fonte);
        $geo = json_decode($registro->geojson, true);
        $this->assertSame('Centro', $geo['features'][0]['properties']['nome']);
        $this->assertCount(4, $geo['features'][0]['geometry']['coordinates'][0][0]); // anel fechado
    }
}
