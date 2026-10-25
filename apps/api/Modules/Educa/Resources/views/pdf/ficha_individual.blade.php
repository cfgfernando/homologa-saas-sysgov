@extends('educa::pdf.layout')

@section('content')

    <div class="doc-title-box">
        <h1 class="doc-title">Ficha Individual do Estudante</h1>
        <div class="doc-subtitle">Registro Geral Anual de Rendimento, Assiduidade e Ocorrências Pedagógicas</div>
    </div>

    <div class="box-info">
        <div class="label" style="margin-bottom: 4px;">1. Dados Cadastrais e Civis</div>
        <table class="box-info-grid">
            <tr>
                <td style="width: 50%;">
                    <div class="label">Estudante:</div>
                    <div class="value text-bold">{{ $aluno->nome ?? 'Nome do Estudante' }}</div>
                </td>
                <td style="width: 25%;">
                    <div class="label">Matrícula:</div>
                    <div class="value technical text-bold">{{ $matricula->enrollment_number ?? '---' }}</div>
                </td>
                <td style="width: 25%;">
                    <div class="label">CPF:</div>
                    <div class="value technical">{{ !empty($aluno->cpf) ? preg_replace('/(\d{3})(\d{3})(\d{3})(\d{2})/', '$1.$2.$3-$4', $aluno->cpf) : '---' }}</div>
                </td>
            </tr>
            <tr>
                <td>
                    <div class="label">Mãe / Responsável:</div>
                    <div class="value">{{ $aluno->filiacao ?? ($aluno->nome_mae ?? 'Não informada') }}</div>
                </td>
                <td>
                    <div class="label">Nascimento:</div>
                    <div class="value technical">{{ !empty($aluno->data_nascimento) ? \Carbon\Carbon::parse($aluno->data_nascimento)->format('d/m/Y') : '---' }}</div>
                </td>
                <td>
                    <div class="label">Situação da Matrícula:</div>
                    <div class="value text-bold" style="color: #166534;">{{ ucfirst($matricula->status ?? 'Ativa') }}</div>
                </td>
            </tr>
            <tr>
                <td>
                    <div class="label">Turma Atual:</div>
                    <div class="value text-bold">{{ $turma->name ?? 'Turma' }} ({{ $curso->name ?? 'Fundamental' }})</div>
                </td>
                <td>
                    <div class="label">Ano Letivo:</div>
                    <div class="value technical">{{ $ano_letivo ?? date('Y') }}</div>
                </td>
                <td>
                    <div class="label">Turno:</div>
                    <div class="value">{{ ucfirst($turma->shift ?? 'Matutino') }}</div>
                </td>
            </tr>
        </table>
    </div>

    <div style="font-size: 8.5pt; font-weight: bold; margin-bottom: 6px; text-transform: uppercase; color: #0f172a;">
        2. Desempenho Curricular e Notas por Período
    </div>

    <table class="table-data">
        <thead>
            <tr>
                <th style="width: 32%;">Componente Curricular</th>
                <th class="text-center" style="width: 9%;">1º Bim</th>
                <th class="text-center" style="width: 9%;">2º Bim</th>
                <th class="text-center" style="width: 9%;">3º Bim</th>
                <th class="text-center" style="width: 9%;">4º Bim</th>
                <th class="text-center" style="width: 10%;">Média Final</th>
                <th class="text-center" style="width: 10%;">Faltas</th>
                <th class="text-center" style="width: 12%;">Resultado</th>
            </tr>
        </thead>
        <tbody>
            @forelse($disciplinas as $d)
                <tr>
                    <td class="text-bold">{{ $d['nome'] }}</td>
                    <td class="text-center technical">{{ isset($d['b1']) && $d['b1'] !== null ? number_format((float)$d['b1'], 1, ',', '') : '-' }}</td>
                    <td class="text-center technical">{{ isset($d['b2']) && $d['b2'] !== null ? number_format((float)$d['b2'], 1, ',', '') : '-' }}</td>
                    <td class="text-center technical">{{ isset($d['b3']) && $d['b3'] !== null ? number_format((float)$d['b3'], 1, ',', '') : '-' }}</td>
                    <td class="text-center technical">{{ isset($d['b4']) && $d['b4'] !== null ? number_format((float)$d['b4'], 1, ',', '') : '-' }}</td>
                    <td class="text-center technical text-bold" style="background-color: #f8fafc;">
                        {{ isset($d['media_final']) && $d['media_final'] !== null ? number_format((float)$d['media_final'], 1, ',', '') : '-' }}
                    </td>
                    <td class="text-center technical">{{ $d['faltas'] ?? 0 }}</td>
                    <td class="text-center">
                        <span class="badge-status {{ ($d['situacao'] ?? 'Cursando') === 'Aprovado' ? 'badge-aprovado' : (($d['situacao'] ?? '') === 'Reprovado' ? 'badge-reprovado' : 'badge-cursando') }}">
                            {{ $d['situacao'] ?? 'Cursando' }}
                        </span>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="8" class="text-center" style="padding: 10px; color: #64748b;">Nenhuma nota lançada.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="box-info" style="margin-top: 10px;">
        <div class="label" style="margin-bottom: 4px;">3. Assiduidade Global e Parecer Final</div>
        <table class="box-info-grid">
            <tr>
                <td style="width: 33%;">
                    <div class="label">Total Geral de Aulas:</div>
                    <div class="value technical">{{ $total_aulas ?? 800 }}</div>
                </td>
                <td style="width: 33%;">
                    <div class="label">Total de Presenças:</div>
                    <div class="value technical">{{ ($total_aulas ?? 800) - ($total_faltas ?? 0) }}</div>
                </td>
                <td style="width: 34%;">
                    <div class="label">Percentual de Frequência:</div>
                    <div class="value technical text-bold" style="color: {{ ($frequencia_percentual ?? 100) >= 75 ? '#166534' : '#991b1b' }};">
                        {{ number_format($frequencia_percentual ?? 100, 1, ',', '') }}%
                    </div>
                </td>
            </tr>
            <tr>
                <td colspan="3">
                    <div class="label">Parecer Descritivo do Conselho de Classe / Direção:</div>
                    <div class="value" style="font-size: 8pt; color: #334155; padding-top: 2px;">
                        {{ $parecer_descritivo ?? 'O(A) estudante demonstrou rendimento e frequência compatíveis com os objetivos de aprendizagem do ano letivo, estando apto(a) para a progressão para a etapa seguinte.' }}
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <table class="signatures" style="margin-top: 25px;">
        <tr>
            <td>
                <div class="signature-line">Secretário(a) Escolar</div>
                <div class="signature-role">Carimbo e Assinatura</div>
            </td>
            <td>
                <div class="signature-line">Diretor(a) Escolar</div>
                <div class="signature-role">Carimbo e Assinatura</div>
            </td>
        </tr>
    </table>

@endsection
