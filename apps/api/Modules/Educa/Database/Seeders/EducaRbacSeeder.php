<?php

declare(strict_types=1);

namespace Modules\Educa\Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Services\ModuleRoleProvisioner;
use Illuminate\Database\Seeder;
use Modules\Admin\Models\Module;

/**
 * Seeder de RBAC e catálogo para o módulo SYS-Educa (e seus submódulos).
 *
 * Registra os submódulos no catálogo da plataforma (Modules\Admin\Models\Module),
 * as permissões de acesso canônicas (educa.{submodulo}.{recurso}.{acao}) e
 * provisiona papéis-template para os tenants cadastrados.
 */
final class EducaRbacSeeder extends Seeder
{
    /**
     * Submódulos desacoplados que integram o catálogo de licenças da plataforma.
     *
     * @var array<string, array{name: string, description: string}>
     */
    public const SUBMODULOS = [
        'educa' => [
            'name' => 'Educação (SYS-Educa: Núcleo e Calendário)',
            'description' => 'Núcleo acadêmico obrigatório: Anos Letivos, Calendário Escolar, Escolas, Turmas e Matriz Curricular BNCC.',
        ],
        'educa-secretaria' => [
            'name' => 'SYS-Educa: Secretaria Escolar',
            'description' => 'Secretaria escolar: Matrículas, Histórico Escolar Oficial e Transferências com protocolo integrado.',
        ],
        'educa-pedagogico' => [
            'name' => 'SYS-Educa: Diário e Avaliação',
            'description' => 'Operação docente: Diário de Classe, Frequência por dia letivo e Motor de Avaliação declarativo sem eval.',
        ],
        'educa-servidores' => [
            'name' => 'SYS-Educa: Servidores e Jornada',
            'description' => 'Lotação docente e cumprimento da jornada de 1/3 de hora-atividade (Lei Federal 11.738/2008 - Lei do Piso).',
        ],
        'educa-educacenso' => [
            'name' => 'SYS-Educa: Censo Escolar INEP/MEC',
            'description' => 'Auditoria e consistência cadastral e exportador oficial de layouts do Censo Escolar/INEP.',
        ],
        'educa-transporte' => [
            'name' => 'SYS-Educa: Transporte Escolar',
            'description' => 'Gestão de rotas de transporte escolar rural e urbano, veículos, motoristas credenciados e estudantes vinculados.',
        ],
        'educa-comunicacao' => [
            'name' => 'SYS-Educa: Comunicação e Notificações',
            'description' => 'Notificações a pais e responsáveis sobre faltas, ocorrências e comunicados oficiais via mensageria/Outbox.',
        ],
        'educa-merenda' => [
            'name' => 'SYS-Educa: Alimentação Escolar (PNAE)',
            'description' => 'Gestão nutricional PNAE, cardápios, laudos de restrições alimentares e controle diário de refeições.',
        ],
    ];

    /**
     * Permissões canônicas do módulo Educa (focadas inicialmente no submódulo core).
     *
     * @var array<string, string>
     */
    public const PERMISSOES = [
        'educa.view' => 'Acessar o módulo SYS-Educa',
        'educa.core.anos_letivos.view' => 'Consultar anos letivos, etapas e conformidade LDB',
        'educa.core.anos_letivos.create' => 'Criar ano letivo',
        'educa.core.anos_letivos.update' => 'Editar ano letivo, etapas e iniciar fase de avaliação',
        'educa.core.anos_letivos.delete' => 'Remover ano letivo em planejamento',
        'educa.core.anos_letivos.open' => 'Iniciar o ano letivo',
        'educa.core.anos_letivos.freeze' => 'Congelar e retomar o ano letivo',
        'educa.core.anos_letivos.close' => 'Encerrar o ano letivo (torna imutável)',
        'educa.core.anos_letivos.batch' => 'Operar anos letivos em lote',
        'educa.core.calendarios.view' => 'Consultar calendários e dias',
        'educa.core.calendarios.manage' => 'Criar, editar e importar calendários e marcar dias',
        'educa.core.calendarios.publish' => 'Publicar calendário escolar com validação da LDB',
        'educa.core.calendarios.delete' => 'Remover calendário em rascunho',
        'educa.core.motivos_dia.view' => 'Consultar motivos de dia',
        'educa.core.motivos_dia.manage' => 'Gerenciar motivos de dia',
        'educa.core.escolas.view' => 'Consultar escolas da rede municipal',
        'educa.core.escolas.manage' => 'Cadastrar e gerenciar escolas da rede municipal',
        'educa.core.turmas.view' => 'Consultar turmas e enturmações',
        'educa.core.turmas.manage' => 'Cadastrar e gerenciar turmas e vagas',
        'educa.core.cursos.view' => 'Consultar cursos e séries escolares',
        'educa.core.cursos.manage' => 'Gerenciar cursos e séries escolares',
        'educa.core.matrizes.view' => 'Consultar matrizes curriculares e componentes BNCC',
        'educa.core.matrizes.manage' => 'Gerenciar matrizes curriculares e componentes BNCC',
        'educa.quadro_horario.view' => 'Consultar quadro de horários e grade semanal',
        'educa.quadro_horario.manage' => 'Gerenciar quadro de horários e alocação docente',
        'educa.vagas.view' => 'Consultar capacidade da rede e fila de espera',
        'educa.vagas.manage' => 'Gerenciar capacidades e pré-matrículas',
        'educa.vagas.analisar' => 'Analisar e pontuar inscrições de vagas',
        'educa.vagas.convocar' => 'Convocar candidatos da fila de espera',
        'educa.vagas.converter' => 'Converter convocação em matrícula definitiva',
        'educa.aee.view' => 'Consultar prontuários PAEE e atendimentos especializados',
        'educa.aee.manage' => 'Gerenciar prontuários, salas SRM e PEI',
        'educa.aee.laudos.view' => 'Visualizar laudos médicos e CIDs restritos (LGPD)',
        'educa.aee.pei.manage' => 'Gerenciar Plano Educacional Individualizado (PEI)',
        'educa.aee.salas.manage' => 'Gerenciar Salas de Recursos Multifuncionais',
        'educa.conselho.view' => 'Consultar conselhos de classe e atas',
        'educa.conselho.admin' => 'Administração geral do conselho de classe',
        'educa.conselho.cronograma.manage' => 'Gerenciar cronogramas de conselho de classe',
        'educa.conselho.pre_conselho.manage' => 'Preencher e gerenciar fichas diagnósticas de pré-conselho',
        'educa.conselho.ata.manage' => 'Elaborar ata deliberativa e deliberações de conselho',
        'educa.conselho.homologar' => 'Homologar ata deliberativa de conselho de classe',
        'educa.pedagogico.diario.view' => 'Consultar diário de classe docente',
        'educa.pedagogico.diario.manage' => 'Lançar registros e conteúdos de aula no diário',
        'educa.pedagogico.frequencia.view' => 'Consultar frequências escolares',
        'educa.pedagogico.frequencia.manage' => 'Lançar e abonar faltas e frequências',
        'educa.pedagogico.avaliacao.view' => 'Consultar notas e mapa de médias',
        'educa.pedagogico.avaliacao.manage' => 'Configurar regras e lançar notas avaliativas',
        'educa.secretaria.matriculas.view' => 'Consultar matrículas e enturmações',
        'educa.secretaria.matriculas.manage' => 'Efetuar, enturmar, remanejar e cancelar matrículas',
        'educa.secretaria.alunos.view' => 'Consultar ficha e perfil complementar do estudante',
        'educa.secretaria.alunos.manage' => 'Atualizar ficha cadastral e responsáveis do estudante',
        'educa.servidores.view' => 'Consultar servidores escolares, alocações e ocorrências',
        'educa.servidores.manage' => 'Cadastrar e gerenciar servidores, lotações e afastamentos',
        'educa.educacenso.view' => 'Consultar dados, histórico e diagnósticos do Censo Escolar',
        'educa.educacenso.manage' => 'Gerenciar auditorias, exportações e retorno do Censo Escolar',
        'educa.educacenso.auditoria.execute' => 'Executar auditoria de consistência cadastral do Censo Escolar',
        'educa.educacenso.exportacao.execute' => 'Solicitar geração assíncrona do arquivo oficial do Censo',
        'educa.educacenso.exportacao.download' => 'Realizar download do arquivo posicional do Censo',
        'educa.educacenso.retorno.execute' => 'Processar arquivo oficial de retorno e conciliar códigos INEP',
        'educa.transporte.view' => 'Consultar dados gerais de transporte escolar',
        'educa.transporte.manage' => 'Gerenciamento completo de rotas, veículos, motoristas e alocações',
        'educa.transporte.rotas.view' => 'Consultar rotas e paradas de transporte escolar',
        'educa.transporte.rotas.manage' => 'Cadastrar e atualizar rotas, itinerários e paradas',
        'educa.transporte.rotas.create' => 'Criar novas rotas de transporte escolar',
        'educa.transporte.veiculos.view' => 'Consultar veículos e laudos de vistoria DETRAN',
        'educa.transporte.veiculos.manage' => 'Cadastrar veículos e registrar vistorias semestrais',
        'educa.transporte.condutores.view' => 'Consultar motoristas e monitores credenciados',
        'educa.transporte.condutores.manage' => 'Credenciar condutores com CNH D/E e monitores',
        'educa.transporte.alocacoes.view' => 'Consultar alocações de estudantes no transporte',
        'educa.transporte.alocacoes.manage' => 'Alocar e encerrar vagas de estudantes no transporte',
        'educa.comunicacao.view' => 'Consultar comunicados e ocorrências escolares',
        'educa.comunicacao.manage' => 'Gerenciamento completo de avisos, ocorrências e notificações',
        'educa.comunicacao.avisos.view' => 'Consultar mural de comunicados e avisos oficiais',
        'educa.comunicacao.avisos.manage' => 'Publicar e gerenciar comunicados e circulares',
        'educa.comunicacao.ocorrencias.view' => 'Consultar ocorrências pedagógicas e disciplinares',
        'educa.comunicacao.ocorrencias.manage' => 'Registrar ocorrências e despachar providências',
        'educa.comunicacao.notificacoes.send' => 'Disparar notificações e alertas via Outbox',
        'educa.secretaria.view' => 'Visualizar Secretaria Escolar',
        'educa.pedagogico.view' => 'Visualizar Diário e Avaliação',
        'educa.merenda.view' => 'Visualizar Alimentação Escolar (PNAE)',
        'educa.merenda.manage' => 'Gerenciar Cardápios e Refeições do PNAE',
        'educa-secretaria.view' => 'Acesso ao submódulo Secretaria Escolar',
        'educa-pedagogico.view' => 'Acesso ao submódulo Diário e Pedagógico',
        'educa-servidores.view' => 'Acesso ao submódulo Servidores da Educação',
        'educa-educacenso.view' => 'Acesso ao submódulo Educacenso',
        'educa-transporte.view' => 'Acesso ao submódulo Transporte Escolar',
        'educa-comunicacao.view' => 'Acesso ao submódulo Comunicação Escolar',
        'educa-merenda.view' => 'Acesso ao submódulo Alimentação Escolar',
    ];

    /**
     * Perfis-template provisionados nos tenants.
     *
     * @var array<string, array{name: string, description: string, permissions: list<string>}>
     */
    public const PERFIS = [
        'admin_educa' => [
            'name' => 'Administrador da Educação',
            'description' => 'Acesso total aos parâmetros escolares, anos letivos, calendários e configurações',
            'permissions' => [
                'educa.view',
                'educa.core.anos_letivos.view',
                'educa.core.anos_letivos.create',
                'educa.core.anos_letivos.update',
                'educa.core.anos_letivos.delete',
                'educa.core.anos_letivos.open',
                'educa.core.anos_letivos.freeze',
                'educa.core.anos_letivos.close',
                'educa.core.anos_letivos.batch',
                'educa.core.calendarios.view',
                'educa.core.calendarios.manage',
                'educa.core.calendarios.publish',
                'educa.core.calendarios.delete',
                'educa.core.motivos_dia.view',
                'educa.core.motivos_dia.manage',
                'educa.core.escolas.view',
                'educa.core.escolas.manage',
                'educa.core.turmas.view',
                'educa.core.turmas.manage',
                'educa.core.cursos.view',
                'educa.core.cursos.manage',
                'educa.core.matrizes.view',
                'educa.core.matrizes.manage',
                'educa.quadro_horario.view',
                'educa.quadro_horario.manage',
                'educa.vagas.view',
                'educa.vagas.manage',
                'educa.vagas.analisar',
                'educa.vagas.convocar',
                'educa.vagas.converter',
                'educa.aee.view',
                'educa.aee.manage',
                'educa.aee.laudos.view',
                'educa.aee.pei.manage',
                'educa.aee.salas.manage',
                'educa.conselho.view',
                'educa.conselho.admin',
                'educa.conselho.cronograma.manage',
                'educa.conselho.pre_conselho.manage',
                'educa.conselho.ata.manage',
                'educa.conselho.homologar',
                'educa.pedagogico.diario.view',
                'educa.pedagogico.diario.manage',
                'educa.pedagogico.frequencia.view',
                'educa.pedagogico.frequencia.manage',
                'educa.pedagogico.avaliacao.view',
                'educa.pedagogico.avaliacao.manage',
                'educa.secretaria.matriculas.view',
                'educa.secretaria.matriculas.manage',
                'educa.secretaria.alunos.view',
                'educa.secretaria.alunos.manage',
                'educa.servidores.view',
                'educa.servidores.manage',
                'educa.educacenso.view',
                'educa.educacenso.manage',
                'educa.transporte.view',
                'educa.transporte.manage',
                'educa.comunicacao.view',
                'educa.comunicacao.manage',
                'educa.merenda.view',
                'educa.merenda.manage',
            ],
        ],
        'secretario_educa' => [
            'name' => 'Secretário(a) de Educação / Escola',
            'description' => 'Gestão de anos letivos, etapas, turmas e calendários escolares da rede',
            'permissions' => [
                'educa.view',
                'educa.core.anos_letivos.view',
                'educa.core.anos_letivos.create',
                'educa.core.anos_letivos.update',
                'educa.core.anos_letivos.open',
                'educa.core.calendarios.view',
                'educa.core.calendarios.manage',
                'educa.core.calendarios.publish',
                'educa.core.motivos_dia.view',
                'educa.core.escolas.view',
                'educa.core.escolas.manage',
                'educa.core.turmas.view',
                'educa.core.turmas.manage',
                'educa.core.cursos.view',
                'educa.core.matrizes.view',
                'educa.quadro_horario.view',
                'educa.quadro_horario.manage',
                'educa.vagas.view',
                'educa.vagas.manage',
                'educa.vagas.convocar',
                'educa.vagas.converter',
                'educa.aee.view',
                'educa.aee.manage',
                'educa.conselho.view',
                'educa.pedagogico.diario.view',
                'educa.pedagogico.frequencia.view',
                'educa.pedagogico.avaliacao.view',
                'educa.secretaria.matriculas.view',
                'educa.secretaria.matriculas.manage',
                'educa.secretaria.alunos.view',
                'educa.secretaria.alunos.manage',
                'educa.servidores.view',
                'educa.educacenso.view',
                'educa.transporte.view',
                'educa.comunicacao.view',
                'educa.merenda.view',
            ],
        ],
        'coordenador_educa' => [
            'name' => 'Coordenador(a) Pedagógico(a)',
            'description' => 'Consulta de anos letivos, etapas e gestão de eventos e marcações de calendário',
            'permissions' => [
                'educa.view',
                'educa.core.anos_letivos.view',
                'educa.core.calendarios.view',
                'educa.core.calendarios.manage',
                'educa.core.motivos_dia.view',
            ],
        ],
        'consulta_educa' => [
            'name' => 'Consulta Educação',
            'description' => 'Apenas consulta aos calendários escolares e anos letivos',
            'permissions' => [
                'educa.view',
                'educa.core.anos_letivos.view',
                'educa.core.calendarios.view',
                'educa.core.motivos_dia.view',
            ],
        ],
    ];

    public function run(): void
    {
        $sysTenant = Tenant::firstOrCreate(
            ['slug' => 'systrat'],
            ['name' => 'SYSTRAT (Sistema)', 'cnpj' => '00000000000000', 'type' => 'interno', 'status' => 'active']
        );

        // 1. Cadastra/Atualiza todos os submódulos no catálogo da plataforma
        $modulesMap = [];
        foreach (self::SUBMODULOS as $alias => $submodulo) {
            $modulesMap[$alias] = Module::updateOrCreate(
                ['alias' => $alias],
                [
                    'name' => $submodulo['name'],
                    'description' => $submodulo['description'],
                    'enabled' => true,
                    'monthly_fee_cents' => 0,
                ]
            );
        }

        // 2. Cadastra permissões
        $permissionIds = [];
        foreach (self::PERMISSOES as $slug => $name) {
            $permissionIds[$slug] = Permission::updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'module' => 'educa', 'guard_name' => 'web']
            )->id;
        }

        // Associa permissões ao módulo 'educa' no catálogo
        if (isset($modulesMap['educa'])) {
            $modulesMap['educa']->permissions()->sync(array_values($permissionIds));
        }

        // 3. Cadastra os perfis-template no tenant de sistema
        foreach (self::PERFIS as $slug => $perfil) {
            $role = Role::updateOrCreate(
                ['slug' => $slug, 'tenant_id' => $sysTenant->id],
                [
                    'name' => $perfil['name'],
                    'scope' => 'tenant',
                    'module' => 'educa',
                    'is_system' => true,
                    'description' => $perfil['description'],
                    'guard_name' => 'web',
                ]
            );

            $role->permissions()->sync(
                array_map(fn (string $p): int => $permissionIds[$p], $perfil['permissions'])
            );
        }

        // 4. Provisiona o módulo 'educa' e todos os seus submódulos para os tenants existentes
        $provisioner = app(ModuleRoleProvisioner::class);
        $allTenants = Tenant::all();

        foreach ($allTenants as $tenant) {
            $pivotModules = [];
            foreach ($modulesMap as $alias => $mod) {
                $pivotModules[$mod->id] = [
                    'enabled' => true,
                    'monthly_fee_cents' => 0,
                    'settings' => json_encode([]),
                ];
            }
            $tenant->modules()->syncWithoutDetaching($pivotModules);

            $provisioner->provisionForTenant($tenant, 'educa');
        }

        $this->informar('SYS-Educa: todos os submódulos registrados no catálogo e provisionados nos tenants com sucesso.');
    }

    private function informar(string $mensagem): void
    {
        // @phpstan-ignore isset.property
        if (isset($this->command)) {
            $this->command->info($mensagem);
        }
    }
}
