<?php

declare(strict_types=1);

namespace Modules\Campanha\Services;

use App\Models\User;
use App\Support\AuditLogger;
use App\Support\OutboxPublisher;
use App\Support\TenantContext;
use DomainException;
use Illuminate\Support\Facades\DB;
use Modules\Campanha\Models\Campanha;
use Modules\Campanha\Models\Candidato;
use Modules\Campanha\Models\Eleitor;
use Modules\Campanha\Models\Membro;
use Modules\Campanha\Services\Concerns\RegistraMutacao;
use Modules\Campanha\Services\Referencia\ImportacaoReferenciaService;
use Modules\Campanha\Services\Referencia\UnidadesFederativas;
use Modules\Pessoas\Services\ResolucaoPessoaService;

/** Campanhas, candidato (Pessoa pelo CPF) e membros (D2, D8). */
final class CampanhaService
{
    use RegistraMutacao;

    /** UFs aceitas como área de atuação. */
    public const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

    public function __construct(
        private readonly AuditLogger $audit,
        private readonly OutboxPublisher $outbox,
        private readonly TenantContext $tenant,
        private readonly ResolucaoPessoaService $pessoas,
        private readonly ImportacaoReferenciaService $importacao,
    ) {}

    /** @param array<string, mixed> $dados */
    public function criar(array $dados): Campanha
    {
        $dados = $this->normalizarMunicipio($dados, null);

        return DB::transaction(function () use ($dados): Campanha {
            $campanha = Campanha::create($dados);
            $this->auditar('campanha', 'criada', $campanha->id, null, $campanha->toArray());
            // Mapa da UF escolhida: importa a base pública se ainda não existir (D7).
            $this->importacao->solicitarSeFaltar((string) $campanha->uf);
            if ($campanha->municipal() && $campanha->codigo_ibge !== null) {
                $this->importacao->solicitarBairrosSeFaltar($campanha->codigo_ibge);
            }

            return $campanha;
        });
    }

    /** @param array<string, mixed> $dados */
    public function atualizar(Campanha $campanha, array $dados): Campanha
    {
        // Encerrar marca a data (início do prazo de anonimização dos eleitores — D5); reabrir a limpa.
        if (($dados['status'] ?? null) === 'encerrada' && !$campanha->encerrada()) {
            $dados['encerrada_em'] = now();
        } elseif (($dados['status'] ?? null) === 'ativa') {
            $dados['encerrada_em'] = null;
        }
        // Texto do termo alterado → nova versão (cada aceite grava a versão que viu — D4).
        if (array_key_exists('lgpd_termo', $dados)) {
            $novo = trim((string) $dados['lgpd_termo']);
            $dados['lgpd_termo'] = $novo === '' ? null : $novo;
            if ($dados['lgpd_termo'] !== $campanha->lgpd_termo) {
                $dados['lgpd_termo_versao'] = $campanha->lgpd_termo_versao + 1;
            }
        }

        $dados = $this->normalizarMunicipio($dados, $campanha);

        return DB::transaction(function () use ($campanha, $dados): Campanha {
            $antes = $campanha->toArray();
            $campanha->update($dados);
            $this->auditar('campanha', 'atualizada', $campanha->id, $antes, $campanha->toArray());
            if ($campanha->wasChanged('uf')) {
                $this->importacao->solicitarSeFaltar((string) $campanha->uf);
            }
            if ($campanha->municipal() && $campanha->codigo_ibge !== null) {
                $this->importacao->solicitarBairrosSeFaltar($campanha->codigo_ibge);
            }

            return $campanha;
        });
    }

    /**
     * Prefeito/Vereador exigem o município de atuação, dentro da UF da campanha; nos demais cargos ele é limpo.
     *
     * @param array<string, mixed> $dados
     * @return array<string, mixed>
     */
    private function normalizarMunicipio(array $dados, ?Campanha $atual): array
    {
        $cargo = (string) ($dados['cargo'] ?? $atual?->cargo);
        $uf = strtoupper((string) ($dados['uf'] ?? $atual?->uf));
        if (!in_array($cargo, Campanha::CARGOS_MUNICIPAIS, true)) {
            $dados['codigo_ibge'] = null;

            return $dados;
        }
        $codigo = array_key_exists('codigo_ibge', $dados) ? $dados['codigo_ibge'] : $atual?->codigo_ibge;
        if ($codigo === null) {
            throw new DomainException("Informe o município da campanha para {$cargo}.");
        }
        if (intdiv((int) $codigo, 100000) !== UnidadesFederativas::codigo($uf)) {
            throw new DomainException("O município escolhido não pertence a {$uf}.");
        }
        $dados['codigo_ibge'] = (int) $codigo;

        return $dados;
    }

    /** A campanha sai da lista (exclusão lógica), mas os eleitores dela são apagados de vez (LGPD — D5). */
    public function excluir(Campanha $campanha): void
    {
        DB::transaction(function () use ($campanha): void {
            $antes = $campanha->toArray();
            $eleitores = Eleitor::query()->withoutGlobalScope('campanha')->where('campanha_id', $campanha->id)->delete();
            $campanha->delete();
            $this->auditar('campanha', 'excluida', $campanha->id, $antes, null, ['eleitores_apagados' => $eleitores]);
        });
    }

    /**
     * Cria ou atualiza o candidato da campanha. O CPF (obrigatório na criação) encontra ou cria a pessoa
     * no Cadastro de Pessoas do tenant; o nome completo informado só completa a pessoa, nunca sobrescreve.
     *
     * @param array<string, mixed> $dados
     */
    public function salvarCandidato(Campanha $campanha, array $dados): Candidato
    {
        return DB::transaction(function () use ($campanha, $dados): Candidato {
            $candidato = Candidato::query()->withoutGlobalScope('campanha')->where('campanha_id', $campanha->id)->first();
            $cpf = isset($dados['cpf']) ? (string) $dados['cpf'] : '';
            if ($candidato === null && $cpf === '') {
                throw new DomainException('Informe o CPF do candidato.');
            }
            $campos = array_diff_key($dados, array_flip(['cpf', 'nome_completo']));
            if ($cpf !== '') {
                $pessoa = $this->pessoas->resolverPorCpf($cpf, ['nome' => (string) ($dados['nome_completo'] ?? $dados['nome_urna'] ?? '')], 'campanha');
                $campos['pessoa_id'] = $pessoa->id;
            }

            $antes = $candidato?->toArray();
            if ($candidato === null) {
                $candidato = Candidato::create([...$campos, 'campanha_id' => $campanha->id]);
            } else {
                $candidato->update($campos);
            }
            $candidato->load('pessoa');
            $this->auditar('candidato', $antes === null ? 'criado' : 'atualizado', $candidato->id, $antes, $candidato->toArray(), ['campanha_id' => $campanha->id]);

            return $candidato;
        });
    }

    /**
     * Define os membros da campanha (substitui a lista). Só usuários do tenant.
     *
     * @param list<int> $userIds
     */
    public function definirMembros(Campanha $campanha, array $userIds): void
    {
        $userIds = array_values(array_unique(array_map('intval', $userIds)));
        $doTenant = User::query()->ofTenant($this->tenant->id())->whereIn('id', $userIds)->pluck('id')->all();
        $fora = array_diff($userIds, $doTenant);
        if ($fora !== []) {
            throw new DomainException('Há usuários que não pertencem a este órgão.');
        }

        DB::transaction(function () use ($campanha, $userIds): void {
            $antes = Membro::query()->where('campanha_id', $campanha->id)->pluck('user_id')->sort()->values()->all();
            Membro::query()->where('campanha_id', $campanha->id)->whereNotIn('user_id', $userIds)->delete();
            foreach (array_diff($userIds, $antes) as $userId) {
                Membro::create(['campanha_id' => $campanha->id, 'user_id' => $userId]);
            }
            $this->auditar('campanha', 'membros_definidos', $campanha->id, ['membros' => $antes], ['membros' => $userIds]);
        });
    }
}
