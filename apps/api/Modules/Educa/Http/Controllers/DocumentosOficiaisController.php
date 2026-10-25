<?php

declare(strict_types=1);

namespace Modules\Educa\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Modules\Educa\Models\EducaEnrollment;
use Modules\Educa\Models\EducaSchoolClass;
use Modules\Educa\Services\DocumentosOficiaisService;
use Modules\Pessoas\Models\Pessoa;

final class DocumentosOficiaisController extends Controller
{
    public function __construct(
        private readonly DocumentosOficiaisService $documentosService,
    ) {}

    /**
     * Download / visualização do Boletim Escolar em PDF.
     */
    public function boletimPdf(string $matriculaId, Request $request): Response
    {
        $matricula = EducaEnrollment::findOrFail($matriculaId);
        $this->authorize('view', $matricula);

        $pdf = $this->documentosService->gerarBoletim($matricula);
        $nomeArquivo = 'boletim_' . ($matricula->codigo_matricula ?? $matricula->id) . '.pdf';

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $nomeArquivo . '"',
        ]);
    }

    /**
     * Download dos boletins da turma em lote (PDF único).
     */
    public function boletinsLotePdf(string $turmaId, Request $request): Response
    {
        $turma = EducaSchoolClass::findOrFail($turmaId);
        $this->authorize('view', $turma);

        $pdf = $this->documentosService->gerarBoletinsLote($turma);
        $nomeArquivo = 'boletins_turma_' . ($turma->nome ?? $turma->id) . '.pdf';

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $nomeArquivo . '"',
        ]);
    }

    /**
     * Download do Histórico Escolar Oficial LDB do estudante em PDF.
     */
    public function historicoEscolarPdf(int $alunoId, Request $request): Response
    {
        $aluno = Pessoa::findOrFail($alunoId);

        $pdf = $this->documentosService->gerarHistoricoEscolar($aluno);
        $nomeArquivo = 'historico_escolar_' . $aluno->id . '.pdf';

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $nomeArquivo . '"',
        ]);
    }

    /**
     * Download da Declaração de Matrícula e Frequência com QR Code em PDF.
     */
    public function declaracaoMatriculaPdf(string $matriculaId, Request $request): Response
    {
        $matricula = EducaEnrollment::findOrFail($matriculaId);
        $this->authorize('view', $matricula);

        $pdf = $this->documentosService->gerarDeclaracaoMatricula($matricula);
        $nomeArquivo = 'declaracao_matricula_' . ($matricula->codigo_matricula ?? $matricula->id) . '.pdf';

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $nomeArquivo . '"',
        ]);
    }

    /**
     * Download da Ficha Individual Anual do estudante em PDF.
     */
    public function fichaIndividualPdf(string $matriculaId, Request $request): Response
    {
        $matricula = EducaEnrollment::findOrFail($matriculaId);
        $this->authorize('view', $matricula);

        $pdf = $this->documentosService->gerarFichaIndividual($matricula);
        $nomeArquivo = 'ficha_individual_' . ($matricula->codigo_matricula ?? $matricula->id) . '.pdf';

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $nomeArquivo . '"',
        ]);
    }
}
