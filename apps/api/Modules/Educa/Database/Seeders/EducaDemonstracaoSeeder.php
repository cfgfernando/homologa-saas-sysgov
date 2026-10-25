<?php

declare(strict_types=1);

namespace Modules\Educa\Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Modules\Educa\Models\EducaAcademicCalendar;
use Modules\Educa\Models\EducaAcademicStage;
use Modules\Educa\Models\EducaAcademicYear;
use Modules\Educa\Models\EducaAeeEnrollment;
use Modules\Educa\Models\EducaAeePei;
use Modules\Educa\Models\EducaAeePeiGoal;
use Modules\Educa\Models\EducaAeeResourceRoom;
use Modules\Educa\Models\EducaAeeStudentProfile;
use Modules\Educa\Models\EducaClassDiary;
use Modules\Educa\Models\EducaClassEnrollment;
use Modules\Educa\Models\EducaCourse;
use Modules\Educa\Models\EducaCurriculumComponent;
use Modules\Educa\Models\EducaCurriculumMatrix;
use Modules\Educa\Models\EducaEnrollment;
use Modules\Educa\Models\EducaEvaluationRule;
use Modules\Educa\Models\EducaGrade;
use Modules\Educa\Models\EducaKnowledgeArea;
use Modules\Educa\Models\EducaMatrixComponent;
use Modules\Educa\Models\EducaMealLog;
use Modules\Educa\Models\EducaMenu;
use Modules\Educa\Models\EducaMenuItem;
use Modules\Educa\Models\EducaSchool;
use Modules\Educa\Models\EducaSchoolClass;
use Modules\Educa\Models\EducaStudentGrade;
use Modules\OrgChart\Models\OrgUnit;
use Modules\Pessoas\Models\Pessoa;
use Modules\Pessoas\Support\Documento;

/**
 * Seeder completo de demonstração da rede municipal de ensino para o SYS-Educa.
 * Popula escola modelo, ano letivo 2026, turmas, alunos integrados ao Cadastro Único de Pessoas,
 * notas, diários, cardápio do PNAE e atendimento no AEE.
 */
final class EducaDemonstracaoSeeder extends Seeder
{
    public function run(?int $tenantId = null): void
    {
        if (app()->environment('production')) {
            throw new \RuntimeException('Dados de demonstração não podem ser semeados em ambiente de produção.');
        }

        $context = app(TenantContext::class);
        $tenant = $tenantId !== null 
            ? Tenant::find($tenantId) 
            : ($context->hasTenant() ? $context->get() : (Tenant::where('slug', 'araucaria-pr')->first() ?? Tenant::where('slug', 'systrat')->first() ?? Tenant::first()));

        if (!$tenant) {
            $this->command?->error('Tenant não encontrado — abortando carga de demonstração do Educa.');
            return;
        }

        app(TenantContext::class)->set($tenant);
        $tId = $tenant->id;

        DB::transaction(function () use ($tId): void {
            $this->command?->info("Iniciando carga de demonstração do SYS-Educa no tenant ID {$tId}...");

            // 1. Unidade Organizacional (Escola)
            $orgUnit = OrgUnit::firstOrCreate(
                ['tenant_id' => $tId, 'code' => 'ESC-DEMO-01'],
                [
                    'name' => 'Escola Municipal Professora Maria da Silva',
                    'type' => 'departamento',
                    'is_active' => true,
                ]
            );

            // 2. Extensão Escolar (EducaSchool)
            $escola = EducaSchool::firstOrCreate(
                ['tenant_id' => $tId, 'codigo_inep' => '41012345'],
                [
                    'org_unit_id' => $orgUnit->id,
                    'sigla' => 'EMPMS',
                    'situacao_funcionamento' => 'em_atividade',
                    'dependencia_administrativa' => 'municipal',
                    'zona' => 'urbana',
                    'regulamentada' => true,
                ]
            );

            // 3. Ano Letivo 2026 e Etapas (Bimestres)
            $anoLetivo = EducaAcademicYear::firstOrCreate(
                ['tenant_id' => $tId, 'school_id' => $escola->id, 'ano' => 2026],
                [
                    'status' => 'active',
                    'data_inicio' => '2026-02-05',
                    'data_fim' => '2026-12-18',
                ]
            );

            // 4 Bimestres
            $etapas = [
                ['sequencial' => 1, 'nome' => '1º Bimestre', 'inicio' => '2026-02-05', 'fim' => '2026-04-20'],
                ['sequencial' => 2, 'nome' => '2º Bimestre', 'inicio' => '2026-04-22', 'fim' => '2026-07-10'],
                ['sequencial' => 3, 'nome' => '3º Bimestre', 'inicio' => '2026-07-28', 'fim' => '2026-09-30'],
                ['sequencial' => 4, 'nome' => '4º Bimestre', 'inicio' => '2026-10-01', 'fim' => '2026-12-18'],
            ];

            foreach ($etapas as $et) {
                EducaAcademicStage::firstOrCreate(
                    [
                        'tenant_id' => $tId,
                        'academic_year_id' => $anoLetivo->id,
                        'sequencial' => $et['sequencial'],
                    ],
                    [
                        'data_inicio' => $et['inicio'],
                        'data_fim' => $et['fim'],
                        'dias_letivos' => 50,
                    ]
                );
            }

            // 4. Áreas do Conhecimento e Componentes Curriculares da BNCC
            $areas = [
                'Linguagens' => ['Língua Portuguesa' => 'PORT', 'Arte' => 'ART', 'Educação Física' => 'EDF', 'Língua Inglesa' => 'ING'],
                'Matemática' => ['Matemática' => 'MAT'],
                'Ciências da Natureza' => ['Ciências' => 'CIE'],
                'Ciências Humanas' => ['História' => 'HIST', 'Geografia' => 'GEO'],
            ];

            $areaCodigos = [
                'Linguagens' => 'LING',
                'Matemática' => 'MAT',
                'Ciências da Natureza' => 'CNAT',
                'Ciências Humanas' => 'CHUM',
            ];

            $componentesModels = [];
            foreach ($areas as $areaNome => $comps) {
                $area = EducaKnowledgeArea::firstOrCreate(
                    ['tenant_id' => $tId, 'codigo' => $areaCodigos[$areaNome] ?? strtoupper(substr($areaNome, 0, 4))],
                    ['nome' => $areaNome]
                );

                foreach ($comps as $compNome => $compSigla) {
                    $componentesModels[$compSigla] = EducaCurriculumComponent::firstOrCreate(
                        ['tenant_id' => $tId, 'codigo' => 'CC-' . $compSigla],
                        [
                            'knowledge_area_id' => $area->id,
                            'nome' => $compNome,
                            'sigla' => $compSigla,
                            'base_curricular' => 'nacional_comum',
                        ]
                    );
                }
            }

            // 5. Cursos e Séries
            $curso = EducaCourse::firstOrCreate(
                ['tenant_id' => $tId, 'codigo' => 'EF-AI'],
                [
                    'nome' => 'Ensino Fundamental Anos Iniciais',
                    'nivel' => 'fundamental_iniciais',
                    'modalidade' => 'regular',
                ]
            );

            $serie = EducaGrade::firstOrCreate(
                ['tenant_id' => $tId, 'course_id' => $curso->id, 'sequencial' => 5],
                [
                    'codigo' => '5ANO',
                    'nome' => '5º Ano',
                ]
            );

            // 6. Matriz Curricular
            $matriz = EducaCurriculumMatrix::firstOrCreate(
                ['tenant_id' => $tId, 'course_id' => $curso->id, 'grade_id' => $serie->id, 'ano_vigencia' => 2026],
                [
                    'nome' => 'Matriz BNCC 5º Ano Fundamental',
                    'total_horas_anuais' => 800,
                    'ativo' => true,
                ]
            );

            foreach ($componentesModels as $comp) {
                EducaMatrixComponent::firstOrCreate(
                    [
                        'tenant_id' => $tId,
                        'matrix_id' => $matriz->id,
                        'component_id' => $comp->id,
                    ],
                    [
                        'horas_anuais' => in_array($comp->sigla, ['PORT', 'MAT']) ? 200 : 80,
                        'horas_semanais' => in_array($comp->sigla, ['PORT', 'MAT']) ? 5 : 2,
                        'tipo_nota' => 'numerica',
                    ]
                );
            }

            // 7. Turma de Demonstração
            $turma = EducaSchoolClass::firstOrCreate(
                ['tenant_id' => $tId, 'school_id' => $escola->id, 'codigo' => 'TURMA-5A'],
                [
                    'academic_year_id' => $anoLetivo->id,
                    'course_id' => $curso->id,
                    'grade_id' => $serie->id,
                    'matrix_id' => $matriz->id,
                    'nome' => '5º Ano A - Matutino',
                    'turno' => 'matutino',
                    'lotacao_maxima' => 30,
                    'status' => 'ativa',
                ]
            );

            // 8. Estudantes no Cadastro Único de Pessoas + Matrículas
            $alunosExemplo = [
                ['nome' => 'Lucas Gabriel dos Santos', 'cpf' => '04589211902', 'nasc' => '2015-04-12', 'mae' => 'Mariana dos Santos'],
                ['nome' => 'Beatriz Oliveira Silva', 'cpf' => '08945122933', 'nasc' => '2015-08-25', 'mae' => 'Clara Oliveira Silva'],
                ['nome' => 'Enzo Felipe Fernandes', 'cpf' => '11294833910', 'nasc' => '2015-02-18', 'mae' => 'Juliana Fernandes'],
                ['nome' => 'Sofia Helena de Albuquerque', 'cpf' => '07833411988', 'nasc' => '2015-11-03', 'mae' => 'Roberta Albuquerque'],
                ['nome' => 'Arthur Miguel Pereira', 'cpf' => '13488277944', 'nasc' => '2015-06-30', 'mae' => 'Daniela Pereira'],
            ];

            $regraAvaliacao = EducaEvaluationRule::firstOrCreate(
                ['tenant_id' => $tId, 'nome' => 'Regra Padrão Ensino Fundamental (Média 6.0)'],
                [
                    'tipo_nota' => EducaEvaluationRule::TIPO_NOTA_NUMERICA,
                    'nota_maxima' => 10.00,
                    'nota_minima_aprovacao' => 6.00,
                    'formula_media_anual' => '(E1 + E2 + E3 + E4) / 4',
                    'formula_recuperacao' => 'max(E, REC)',
                    'nota_minima_exame' => 5.00,
                    'ativo' => true,
                ]
            );

            $matriculasCriadas = [];
            foreach ($alunosExemplo as $idx => $dadoAluno) {
                $docHash = Documento::hash($dadoAluno['cpf']);
                $pessoa = Pessoa::firstOrCreate(
                    ['tenant_id' => $tId, 'documento_hash' => $docHash],
                    [
                        'tipo' => 'fisica',
                        'nome' => $dadoAluno['nome'],
                        'documento' => $dadoAluno['cpf'],
                        'data_nascimento' => $dadoAluno['nasc'],
                        'nome_mae' => $dadoAluno['mae'],
                        'status' => 'ativo',
                    ]
                );

                $numMatricula = 'MAT-2026-' . str_pad((string)($idx + 1), 4, '0', STR_PAD_LEFT);
                $matricula = EducaEnrollment::firstOrCreate(
                    ['tenant_id' => $tId, 'aluno_pessoa_id' => $pessoa->id, 'academic_year_id' => $anoLetivo->id],
                    [
                        'school_id' => $escola->id,
                        'course_id' => $curso->id,
                        'grade_id' => $serie->id,
                        'codigo_matricula' => $numMatricula,
                        'data_matricula' => '2026-02-05',
                        'tipo_matricula' => 'regular',
                        'status' => EducaEnrollment::STATUS_ATIVA,
                    ]
                );

                EducaClassEnrollment::firstOrCreate(
                    [
                        'tenant_id' => $tId,
                        'enrollment_id' => $matricula->id,
                        'school_class_id' => $turma->id,
                    ],
                    [
                        'numero_ordem' => $idx + 1,
                        'data_entrada' => '2026-02-05',
                        'status' => 'ativa',
                    ]
                );

                $matriculasCriadas[] = $matricula;

                // Lançamento de notas nos 3 primeiros bimestres para cada componente
                foreach ($componentesModels as $comp) {
                    $notasBim = [
                        1 => 7.5 + ($idx * 0.4),
                        2 => 8.0 + ($idx * 0.3),
                        3 => 8.5 + ($idx * 0.2),
                    ];

                    foreach ($notasBim as $seq => $nt) {
                        $notaArredondada = min(10.0, round($nt, 1));
                        EducaStudentGrade::firstOrCreate(
                            [
                                'tenant_id' => $tId,
                                'enrollment_id' => $matricula->id,
                                'curriculum_component_id' => $comp->id,
                                'etapa_sequencial' => $seq,
                            ],
                            [
                                'evaluation_rule_id' => $regraAvaliacao->id,
                                'nota_bruta' => $notaArredondada,
                                'nota_arredondada' => $notaArredondada,
                                'conceito' => $notaArredondada >= 9.0 ? 'A' : ($notaArredondada >= 7.0 ? 'B' : 'C'),
                            ]
                        );
                    }
                }
            }

            // 9. Cardápio de Alimentação Escolar (PNAE)
            $cardapio = EducaMenu::firstOrCreate(
                ['tenant_id' => $tId, 'school_id' => $escola->id, 'nome' => 'Cardápio PNAE Anos Iniciais - Semana 1'],
                [
                    'academic_year_id' => $anoLetivo->id,
                    'etapa_ensino' => 'fundamental',
                    'tipo_refeicao' => 'almoco',
                    'periodo' => 'semanal',
                    'vigencia_inicio' => '2026-03-02',
                    'vigencia_fim' => '2026-03-06',
                    'status' => 'homologado',
                    'responsavel_tecnico_nome' => 'Dra. Gabriela Castro Nutricionista',
                    'responsavel_tecnico_crn' => 'CRN-8/12345',
                    'homologado_em' => Carbon::now(),
                ]
            );

            EducaMenuItem::firstOrCreate(
                ['tenant_id' => $tId, 'menu_id' => $cardapio->id, 'nome_preparacao' => 'Arroz Integral com Feijão Carioca e Frango Desfiado'],
                [
                    'dia_semana' => 2,
                    'porcao_gramas' => 250.0,
                    'calorias_kcal' => 380.0,
                    'alergenos' => [],
                ]
            );

            // 10. Atendimento Educacional Especializado (AEE)
            $alunoAeeMat = $matriculasCriadas[0]; // Lucas Gabriel
            $perfilAee = EducaAeeStudentProfile::firstOrCreate(
                ['tenant_id' => $tId, 'pessoa_id' => $alunoAeeMat->aluno_pessoa_id],
                [
                    'enrollment_id' => $alunoAeeMat->id,
                    'school_id' => $escola->id,
                    'tipo_condicao' => 'tea',
                    'cid10_codigo' => 'F84.0',
                    'profissional_emissor' => 'Dr. Fernando Neuropediatra',
                    'registro_profissional' => 'CRM-PR 45123',
                    'precisa_cuidador' => true,
                    'precisa_transporte_adaptado' => false,
                    'status' => 'ativo',
                ]
            );

            $salaRecursos = EducaAeeResourceRoom::firstOrCreate(
                ['tenant_id' => $tId, 'school_id' => $escola->id, 'nome' => 'Sala de Recursos Multifuncionais 01'],
                [
                    'tipo_sala' => 'tipo_1_generica',
                    'capacidade_atendimento' => 15,
                    'is_active' => true,
                ]
            );

            EducaAeeEnrollment::firstOrCreate(
                ['tenant_id' => $tId, 'student_profile_id' => $perfilAee->id, 'resource_room_id' => $salaRecursos->id],
                [
                    'regular_enrollment_id' => $alunoAeeMat->id,
                    'turno_atendimento' => 'tarde',
                    'dias_semana' => ['terca', 'quinta'],
                    'status' => 'ativo',
                ]
            );

            $pei = EducaAeePei::firstOrCreate(
                ['tenant_id' => $tId, 'student_profile_id' => $perfilAee->id, 'academic_year_id' => $anoLetivo->id],
                [
                    'ano_letivo' => 2026,
                    'semestre' => 1,
                    'status' => 'ativo',
                    'habilidades_atuais' => 'Comunicação verbal funcional, bom raciocínio lógico-matemático.',
                    'necessidades_especificas' => 'Apoio em interações sociais em grupo e adequação de tempo de avaliação.',
                    'adequacoes_curriculares' => 'Prancha de comunicação visual e fones redutores de ruído em sala regular.',
                ]
            );

            EducaAeePeiGoal::firstOrCreate(
                ['tenant_id' => $tId, 'pei_id' => $pei->id, 'area_desenvolvimento' => 'autonomia_vida_diaria'],
                [
                    'objetivo' => 'Desenvolver autonomia na organização de materiais e tarefas escolares',
                    'status' => 'em_andamento',
                ]
            );

            $this->command?->info('✓ Carga de demonstração do SYS-Educa concluída com sucesso!');
        });
    }
}
