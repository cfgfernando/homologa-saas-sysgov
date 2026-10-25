@extends('educa::pdf.layout')

@section('content')

    <div class="doc-title-box">
        <h1 class="doc-title">Boletim Escolar de Rendimento e Assiduidade</h1>
        <div class="doc-subtitle">Ano Letivo: <span class="technical text-bold">{{ $ano_letivo ?? date('Y') }}</span></div>
    </div>

    <div class="box-info">
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
                    <div class="label">Data de Nascimento:</div>
                    <div class="value technical">{{ !empty($aluno->data_nascimento) ? \Carbon\Carbon::parse($aluno->data_nascimento)->format('d/m/Y') : '---' }}</div>
                </td>
            </tr>
            <tr>
                <td>
                    <div class="label">Curso / Etapa:</div>
                    <div class="value">{{ $curso->name ?? 'Ensino Fundamental' }} - {{ $serie->name ?? 'Ano Regular' }}</div>
                </td>
                <td>
                    <div class="label">Turma:</div>
                    <div class="value text-bold">{{ $turma->name ?? 'Turma Única' }}</div>
                </td>
                <td>
                    <div class="label">Turno:</div>
                    <div class="value">{{ ucfirst($turma->shift ?? 'Matutino') }}</div>
                </td>
            </tr>
        </table>
    </div>

    <table class="table-data">
        <thead>
            <tr>
                <th style="width: 35%;">Componente Curricular</th>
                <th class="text-center" style="width: 9%;">1º Bim</th>
                <th class="text-center" style="width: 9%;">2º Bim</th>
                <th class="text-center" style="width: 9%;">3º Bim</th>
                <th class="text-center" style="width: 9%;">4º Bim</th>
                <th class="text-center" style="width: 10%;">Média Final</th>
                <th class="text-center" style="width: 9%;">Faltas</th>
                <th class="text-center" style="width: 10%;">Situação</th>
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
                        @php
                            $sit = $d['situacao'] ?? 'Cursando';
                            $classBadge = match(strtolower($sit)) {
                                'aprovado' => 'badge-aprovado',
                                'reprovado' => 'badge-reprovado',
                                'recuperação', 'recuperacao' => 'badge-recuperacao',
                                default => 'badge-cursando'
                            };
                        @endphp
                        <span class="badge-status {{ $classBadge }}">{{ $sit }}</span>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="8" class="text-center" style="padding: 15px; color: #64748b;">Nenhuma disciplina vinculada à matriz da turma.</td>
                </tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr style="background-color: #f8fafc; font-weight: bold;">
                <td>Total Geral de Faltas e Frequência Global</td>
                <td colspan="4" class="text-right">Frequência: <span class="technical">{{ number_format($frequencia_percentual ?? 100, 1, ',', '') }}%</span></td>
                <td class="text-center technical">{{ number_format($media_global ?? 0, 1, ',', '') }}</td>
                <td class="text-center technical">{{ $total_faltas ?? 0 }}</td>
                <td class="text-center">
                    <span class="badge-status {{ ($situacao_global ?? 'Cursando') === 'Aprovado' ? 'badge-aprovado' : (($situacao_global ?? '') === 'Reprovado' ? 'badge-reprovado' : 'badge-cursando') }}">
                        {{ $situacao_global ?? 'Cursando' }}
                    </span>
                </td>
            </tr>
        </tfoot>
    </table>

    <table class="signatures">
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
                        <strong>Autenticidade do Boletim Escolar:</strong><br>
                        Código Verificador: <span class="technical text-bold">{{ $codigo_autenticacao }}</span><br>
                        Verifique a veracidade deste documento em: <span class="technical">{{ $url_verificacao }}</span>
                    </td>
                </tr>
            </table>
        </div>
    @endif

@endsection
