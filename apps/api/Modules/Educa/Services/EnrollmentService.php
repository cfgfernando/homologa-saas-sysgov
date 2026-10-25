<?php

declare(strict_types=1);

namespace Modules\Educa\Services;

use App\Support\AuditLogger;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use LogicException;
use Modules\Educa\Models\EducaAcademicYear;
use Modules\Educa\Models\EducaClassEnrollment;
use Modules\Educa\Models\EducaEnrollment;
use Modules\Educa\Models\EducaEnrollmentSequence;
use Modules\Educa\Models\EducaSchoolClass;
use Modules\Pessoas\Models\Pessoa;

/**
 * Serviço de Negócio para Matrícula Acadêmica e Ciclo de Vida do Estudante.
 */
final class EnrollmentService
{
    public function __construct(
        private readonly AuditLogger $audit,
    ) {}

    /**
     * @param array{
     *     school_id?: string|null,
     *     academic_year_id?: string|null,
     *     grade_id?: string|null,
     *     status?: string|null,
     *     busca?: string|null
     * } $filtros
     * @return Collection<int, EducaEnrollment>
     */
    public function listar(array $filtros = []): Collection
    {
        $query = EducaEnrollment::query()
            ->with(['aluno', 'escola.orgUnit', 'curso', 'serie', 'anoLetivo', 'enturmacaoAtiva.turma']);

        if (!empty($filtros['school_id'])) {
            $query->where('school_id', $filtros['school_id']);
        }

        if (!empty($filtros['academic_year_id'])) {
            $val = (string) $filtros['academic_year_id'];
            if (is_numeric($val) || strlen($val) === 4) {
                $yearId = EducaAcademicYear::where('ano', (int) $val)->value('id');
                if ($yearId) {
                    $query->where('academic_year_id', $yearId);
                }
            } else {
                $query->where('academic_year_id', $val);
            }
        } elseif (!empty($filtros['ano'])) {
            $yearId = EducaAcademicYear::where('ano', (int) $filtros['ano'])->value('id');
            if ($yearId) {
                $query->where('academic_year_id', $yearId);
            }
        }

        if (!empty($filtros['grade_id'])) {
            $query->where('grade_id', $filtros['grade_id']);
        }

        if (!empty($filtros['status'])) {
            $query->where('status', $filtros['status']);
        }

        if (!empty($filtros['busca'])) {
            $busca = (string) $filtros['busca'];
            $query->where(function ($q) use ($busca): void {
                $q->where('codigo_matricula', 'like', "%{$busca}%")
                    ->orWhereHas('aluno', function ($pq) use ($busca): void {
                        $pq->where('nome', 'like', "%{$busca}%")
                            ->orWhere('cpf', 'like', "%{$busca}%");
                    });
            });
        }

        return $query->orderByDesc('created_at')->get();
    }

    /**
     * @param array{
     *     tenant_id: int,
     *     aluno_pessoa_id: int,
     *     school_id?: string,
     *     course_id?: string,
     *     grade_id?: string,
     *     academic_year_id?: string,
     *     ano?: int|string,
     *     turma_id?: string|null,
     *     data_matricula?: string,
     *     tipo_matricula?: string
     * } $dados
     */
    public function criar(array $dados): EducaEnrollment
    {
        Pessoa::findOrFail($dados['aluno_pessoa_id']);

        if (!empty($dados['turma_id'])) {
            $turma = EducaSchoolClass::findOrFail($dados['turma_id']);
            $dados['school_id'] = $dados['school_id'] ?? $turma->school_id;
            $dados['academic_year_id'] = $dados['academic_year_id'] ?? $turma->academic_year_id;
            $dados['course_id'] = $dados['course_id'] ?? $turma->course_id;
            $dados['grade_id'] = $dados['grade_id'] ?? $turma->grade_id;
        }

        if (empty($dados['academic_year_id']) && !empty($dados['ano'])) {
            $dados['academic_year_id'] = EducaAcademicYear::where('ano', (int) $dados['ano'])->value('id');
        }

        if (empty($dados['data_matricula'])) {
            $dados['data_matricula'] = now()->toDateString();
        }

        $anoLetivo = EducaAcademicYear::findOrFail($dados['academic_year_id']);

        // Trava de duplicidade: estudante não pode ter 2 matrículas ativas na mesma série e ano letivo
        $duplicada = EducaEnrollment::query()
            ->where('aluno_pessoa_id', $dados['aluno_pessoa_id'])
            ->where('grade_id', $dados['grade_id'])
            ->where('academic_year_id', $dados['academic_year_id'])
            ->where('status', EducaEnrollment::STATUS_ATIVA)
            ->exists();

        if ($duplicada) {
            throw new LogicException('O estudante já possui matrícula ativa nesta série para o ano letivo informado.');
        }

        return DB::transaction(function () use ($dados, $anoLetivo): EducaEnrollment {
            $ano = (int) $anoLetivo->ano;
            $dados['codigo_matricula'] = EducaEnrollmentSequence::nextCode($dados['tenant_id'], $ano);
            $dados['status'] = EducaEnrollment::STATUS_ATIVA;
            $dados['tipo_matricula'] = $dados['tipo_matricula'] ?? 'inicial';

            $matriculaData = $dados;
            $turmaId = $dados['turma_id'] ?? null;
            unset($matriculaData['turma_id'], $matriculaData['ano']);

            $matricula = EducaEnrollment::create($matriculaData);

            if ($turmaId) {
                app(ClassEnrollmentService::class)->enturmar($matricula, $turmaId, $dados['data_matricula']);
            }

            $matricula->load(['aluno', 'escola.orgUnit', 'curso', 'serie', 'anoLetivo', 'enturmacaoAtiva.turma']);

            $this->audit->record('educa', 'enrollment.created', "EducaEnrollment #{$matricula->id}", null, $matricula->toArray());

            return $matricula;
        });
    }

    /**
     * Cancela a matrícula e desativa qualquer enturmação ativa com liberação de vaga.
     */
    public function cancelar(EducaEnrollment $matricula, string $dataCancelamento, string $justificativa): EducaEnrollment
    {
        return DB::transaction(function () use ($matricula, $dataCancelamento, $justificativa): EducaEnrollment {
            $old = $matricula->toArray();

            $matricula->update([
                'status' => EducaEnrollment::STATUS_CANCELADA,
                'data_cancelamento' => $dataCancelamento,
                'justificativa_cancelamento' => $justificativa,
            ]);

            // Encerra enturmações ativas
            $enturmacoesAtivas = EducaClassEnrollment::where('enrollment_id', $matricula->id)
                ->where('status', EducaClassEnrollment::STATUS_ATIVA)
                ->get();

            foreach ($enturmacoesAtivas as $enturmacao) {
                $enturmacao->update([
                    'status' => EducaClassEnrollment::STATUS_ENCERRADA,
                    'data_saida' => $dataCancelamento,
                ]);

                // Libera vaga na turma
                $turma = EducaSchoolClass::find($enturmacao->school_class_id);
                if ($turma !== null && $turma->lotacao_efetiva > 0) {
                    $turma->decrement('lotacao_efetiva');
                }
            }

            $this->audit->record('educa', 'enrollment.cancelled', "EducaEnrollment #{$matricula->id}", $old, $matricula->fresh()->toArray());

            return $matricula->fresh(['aluno', 'escola.orgUnit', 'curso', 'serie', 'anoLetivo']);
        });
    }
}
