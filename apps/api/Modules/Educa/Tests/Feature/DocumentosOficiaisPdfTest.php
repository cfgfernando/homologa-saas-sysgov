<?php

declare(strict_types=1);

namespace Modules\Educa\Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\Module;
use Modules\Educa\Database\Seeders\EducaDemonstracaoSeeder;
use Modules\Educa\Database\Seeders\EducaRbacSeeder;
use Modules\Educa\Models\EducaAcademicYear;
use Modules\Educa\Models\EducaEnrollment;
use Modules\Educa\Models\EducaSchool;
use Modules\Educa\Models\EducaSchoolClass;
use Modules\OrgChart\Models\OrgUnit;
use Modules\Pessoas\Models\Pessoa;
use Modules\Pessoas\Support\Documento;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class DocumentosOficiaisPdfTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $adminUser;
    private array $authHeaders;
    private EducaSchool $escola;
    private Pessoa $aluno;
    private EducaEnrollment $matricula;
    private EducaSchoolClass $turma;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'Prefeitura de Teste Documentos',
            'slug' => 'pref-teste-docs',
            'type' => 'prefeitura',
            'status' => 'active',
        ]);

        app(TenantContext::class)->set($this->tenant);

        // Habilita módulo educa
        Module::firstOrCreate(
            ['alias' => 'educa'],
            ['name' => 'SYS-Educa', 'description' => 'Módulo de Educação', 'status' => 'active']
        );

        $this->seed(EducaRbacSeeder::class);

        $this->adminUser = User::factory()->create([
            'is_platform_admin' => true,
        ]);
        $this->tenant->users()->attach($this->adminUser->id, [
            'status' => 'active',
            'is_primary' => true,
        ]);

        Sanctum::actingAs($this->adminUser);

        $this->authHeaders = [
            'Accept' => 'application/json',
            'X-Tenant-Slug' => $this->tenant->slug,
        ];

        // Cria estrutura mínima de teste
        $orgUnit = OrgUnit::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Escola Municipal de Testes',
            'code' => 'ESC-TESTE-01',
            'type' => 'departamento',
            'status' => 'active',
        ]);

        $this->escola = EducaSchool::create([
            'tenant_id' => $this->tenant->id,
            'org_unit_id' => $orgUnit->id,
            'codigo_inep' => '12345678',
            'sigla' => 'EMT',
            'situacao_funcionamento' => 'em_atividade',
        ]);

        $anoLetivo = EducaAcademicYear::create([
            'tenant_id' => $this->tenant->id,
            'school_id' => $this->escola->id,
            'ano' => 2026,
            'status' => 'ativo',
            'data_inicio' => '2026-02-05',
            'data_fim' => '2026-12-18',
        ]);

        $curso = \Modules\Educa\Models\EducaCourse::create([
            'tenant_id' => $this->tenant->id,
            'codigo' => 'EF-TESTE',
            'nome' => 'Ensino Fundamental Teste',
            'nivel' => 'fundamental_iniciais',
            'modalidade' => 'regular',
        ]);

        $serie = \Modules\Educa\Models\EducaGrade::create([
            'tenant_id' => $this->tenant->id,
            'course_id' => $curso->id,
            'sequencial' => 5,
            'codigo' => '5ANO',
            'nome' => '5º Ano Teste',
        ]);

        $cpf = '12345678909';
        $this->aluno = Pessoa::create([
            'tenant_id' => $this->tenant->id,
            'tipo' => 'PF',
            'nome' => 'Joãozinho dos Testes',
            'cpf' => $cpf,
            'documento_hash' => Documento::hash($cpf),
            'data_nascimento' => '2015-05-10',
            'status' => 'ativo',
        ]);

        $this->matricula = EducaEnrollment::create([
            'tenant_id' => $this->tenant->id,
            'school_id' => $this->escola->id,
            'course_id' => $curso->id,
            'grade_id' => $serie->id,
            'aluno_pessoa_id' => $this->aluno->id,
            'academic_year_id' => $anoLetivo->id,
            'codigo_matricula' => 'MAT-2026-TESTE',
            'data_matricula' => '2026-02-05',
            'status' => EducaEnrollment::STATUS_ATIVA,
        ]);

        $matriz = \Modules\Educa\Models\EducaCurriculumMatrix::create([
            'tenant_id' => $this->tenant->id,
            'course_id' => $curso->id,
            'grade_id' => $serie->id,
            'nome' => 'Matriz Curricular 5º Ano Teste',
            'ano_vigencia' => 2026,
            'total_horas_anuais' => 800,
            'ativo' => true,
        ]);

        $this->turma = EducaSchoolClass::create([
            'tenant_id' => $this->tenant->id,
            'school_id' => $this->escola->id,
            'course_id' => $curso->id,
            'grade_id' => $serie->id,
            'academic_year_id' => $anoLetivo->id,
            'matrix_id' => $matriz->id,
            'codigo' => 'TURMA-5A',
            'nome' => '5º Ano A Teste',
            'turno' => 'matutino',
            'lotacao_maxima' => 30,
            'status' => 'ativa',
        ]);
    }

    public function test_emissao_de_boletim_escolar_em_pdf(): void
    {
        $response = $this->withHeaders($this->authHeaders)
            ->get("/api/educa/documentos/matriculas/{$this->matricula->id}/boletim-pdf");

        $response->assertStatus(200);
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringStartsWith('%PDF-', $response->getContent());
    }

    public function test_emissao_de_declaracao_de_matricula_em_pdf_com_qr_code(): void
    {
        $response = $this->withHeaders($this->authHeaders)
            ->get("/api/educa/documentos/matriculas/{$this->matricula->id}/declaracao-matricula-pdf");

        $response->assertStatus(200);
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringStartsWith('%PDF-', $response->getContent());
    }

    public function test_emissao_de_ficha_individual_do_estudante_em_pdf(): void
    {
        $response = $this->withHeaders($this->authHeaders)
            ->get("/api/educa/documentos/matriculas/{$this->matricula->id}/ficha-individual-pdf");

        $response->assertStatus(200);
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringStartsWith('%PDF-', $response->getContent());
    }

    public function test_emissao_de_historico_escolar_oficial_ldb_em_pdf(): void
    {
        $response = $this->withHeaders($this->authHeaders)
            ->get("/api/educa/documentos/alunos/{$this->aluno->id}/historico-escolar-pdf");

        $response->assertStatus(200);
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringStartsWith('%PDF-', $response->getContent());
    }

    public function test_execucao_do_seeder_de_demonstracao_do_educa(): void
    {
        $seeder = new EducaDemonstracaoSeeder();
        $seeder->run($this->tenant->id);

        // Verifica se a escola de demonstração foi criada
        $this->assertDatabaseHas('educa_schools', [
            'tenant_id' => $this->tenant->id,
            'codigo_inep' => '41012345',
            'sigla' => 'EMPMS',
        ]);

        // Verifica se o ano letivo 2026 foi criado
        $this->assertDatabaseHas('educa_academic_years', [
            'tenant_id' => $this->tenant->id,
            'ano' => 2026,
            'status' => 'ativo',
        ]);

        // Verifica se alunos reais foram inseridos no Cadastro Único de Pessoas
        $this->assertDatabaseHas('pessoas', [
            'tenant_id' => $this->tenant->id,
            'nome' => 'Lucas Gabriel dos Santos',
        ]);

        // Verifica cardápio do PNAE homologado
        $this->assertDatabaseHas('educa_menus', [
            'tenant_id' => $this->tenant->id,
            'status' => 'homologado',
            'responsavel_tecnico_crn' => 'CRN-8/12345',
        ]);
    }
}
