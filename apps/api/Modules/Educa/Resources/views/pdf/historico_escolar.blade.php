@extends('educa::pdf.layout')

@section('content')

    <div class="doc-title-box">
        <h1 class="doc-title">Histórico Escolar — Educação Básica</h1>
        <div class="doc-subtitle">Conforme Lei Federal de Diretrizes e Bases da Educação Nacional (LDB nº 9.394/1996)</div>
    </div>

    <div class="box-info">
        <div class="label" style="margin-bottom: 4px;">1. Identificação do Estudante</div>
        <table class="box-info-grid">
            <tr>
                <td style="width: 50%;">
                    <div class="label">Nome Completo:</div>
                    <div class="value text-bold">{{ $aluno->nome ?? 'Nome do Estudante' }}</div>
                </td>
                <td style="width: 25%;">
                    <div class="label">CPF:</div>
                    <div class="value technical">{{ !empty($aluno->cpf) ? preg_replace('/(\d{3})(\d{3})(\d{3})(\d{2})/', '$1.$2.$3-$4', $aluno->cpf) : '---' }}</div>
                </td>
                <td style="width: 25%;">
                    <div class="label">Nascimento:</div>
                    <div class="value technical">{{ !empty($aluno->data_nascimento) ? \Carbon\Carbon::parse($aluno->data_nascimento)->format('d/m/Y') : '---' }}</div>
                </td>
            </tr>
            <tr>
                <td>
                    <div class="label">Filiação:</div>
                    <div class="value">{{ $aluno->filiacao ?? ($aluno->nome_mae ?? 'Não informada') }}</div>
                </td>
                <td>
                    <div class="label">Naturalidade / UF:</div>
                    <div class="value">{{ $aluno->naturalidade ?? '---' }} / {{ $aluno->uf_naturalidade ?? '---' }}</div>
                </td>
                <td>
                    <div class="label">Nacionalidade:</div>
                    <div class="value">{{ $aluno->nacionalidade ?? 'Brasileira' }}</div>
                </td>
            </tr>
        </table>
    </div>

    <div style="font-size: 8.5pt; font-weight: bold; margin-bottom: 6px; text-transform: uppercase; color: #0f172a;">
        2. Registro das Etapas Cursadas e Rendimento Escolar
    </div>

    @foreach($etapas_cursadas as $etapa)
        <div style="margin-bottom: 12px; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden;">
            <div style="background-color: #f1f5f9; padding: 4px 8px; font-size: 8pt; font-weight: bold; color: #1e3a8a; border-bottom: 1px solid #cbd5e1;">
                {{ $etapa['ano_letivo'] }} — {{ $etapa['serie_ano'] }} | Escola: {{ $etapa['escola_nome'] }} ({{ $etapa['municipio_uf'] }})
            </div>
            <table class="table-data" style="margin-bottom: 0; border: none;">
                <thead>
                    <tr style="background-color: #ffffff;">
                        <th style="width: 55%; border-top: none;">Componente Curricular (Base Nacional e Diversificada)</th>
                        <th class="text-center" style="width: 15%; border-top: none;">Carga Horária (h)</th>
                        <th class="text-center" style="width: 15%; border-top: none;">Nota / Conceito</th>
                        <th class="text-center" style="width: 15%; border-top: none;">Resultado</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($etapa['disciplinas'] as $disc)
                        <tr>
                            <td>{{ $disc['nome'] }}</td>
                            <td class="text-center technical">{{ $disc['carga_horaria'] ?? '80' }}h</td>
                            <td class="text-center technical text-bold">{{ isset($disc['nota']) ? number_format((float)$disc['nota'], 1, ',', '') : ($disc['conceito'] ?? '-') }}</td>
                            <td class="text-center">
                                <span class="badge-status {{ ($disc['situacao'] ?? 'Aprovado') === 'Aprovado' ? 'badge-aprovado' : 'badge-reprovado' }}">
                                    {{ $disc['situacao'] ?? 'Aprovado' }}
                                </span>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
                <tfoot>
                    <tr style="background-color: #f8fafc; font-size: 8pt;">
                        <td class="text-bold">Carga Horária Total: <span class="technical">{{ $etapa['total_horas'] ?? '800' }}h</span> | Dias Letivos: <span class="technical">{{ $etapa['dias_letivos'] ?? '200' }}</span></td>
                        <td colspan="2" class="text-right text-bold">Frequência Global: <span class="technical">{{ $etapa['frequencia'] ?? '100' }}%</span></td>
                        <td class="text-center text-bold">{{ $etapa['resultado_final'] ?? 'Aprovado' }}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    @endforeach

    <div class="box-info" style="margin-top: 10px;">
        <div class="label" style="margin-bottom: 4px;">3. Assentamento e Escrituração Escolar</div>
        <table class="box-info-grid">
            <tr>
                <td style="width: 33%;">
                    <div class="label">Livro de Registro:</div>
                    <div class="value technical text-bold">{{ $livro ?? 'L-01' }}</div>
                </td>
                <td style="width: 33%;">
                    <div class="label">Folha:</div>
                    <div class="value technical text-bold">{{ $folha ?? 'F-042' }}</div>
                </td>
                <td style="width: 34%;">
                    <div class="label">Termo / Registro Nº:</div>
                    <div class="value technical text-bold">{{ $termo ?? 'REG-2026-001' }}</div>
                </td>
            </tr>
            <tr>
                <td colspan="3">
                    <div class="label">Observações e Certificação:</div>
                    <div class="value" style="font-size: 8pt; color: #475569;">
                        Certificamos que o(a) estudante acima identificado(a) cumpriu as exigências curriculares estabelecidas na legislação vigente, tendo integralizado a carga horária e os componentes previstos pela Base Nacional Comum Curricular (BNCC).
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <table class="signatures" style="margin-top: 25px;">
        <tr>
            <td>
                <div class="signature-line">Secretário(a) Escolar</div>
                <div class="signature-role">Registro Funcional / Assinatura</div>
            </td>
            <td>
                <div class="signature-line">Diretor(a) Escolar</div>
                <div class="signature-role">Portaria de Designação / Assinatura</div>
            </td>
        </tr>
    </table>

    @if(!empty($codigo_autenticacao))
        <div class="auth-box">
            <table class="auth-table">
                <tr>
                    @if(!empty($qr_code))
                        <td class="auth-qr">
                            <img src="{{ $qr_code }}" alt="QR Code">
                        </td>
                    @endif
                    <td class="auth-text">
                        <strong>Autenticidade do Histórico Escolar Oficial:</strong><br>
                        Código Verificador: <span class="technical text-bold">{{ $codigo_autenticacao }}</span><br>
                        Validação de fé pública através do endereço: <span class="technical">{{ $url_verificacao }}</span>
                    </td>
                </tr>
            </table>
        </div>
    @endif

@endsection
