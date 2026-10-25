@extends('educa::pdf.layout')

@section('content')

    <div class="doc-title-box" style="margin-top: 25px; margin-bottom: 30px;">
        <h1 class="doc-title" style="font-size: 14pt;">Declaração de Matrícula e Frequência</h1>
        <div class="doc-subtitle">Documento de Comprovação Escolar com Fé Pública</div>
    </div>

    <div style="font-size: 11pt; line-height: 1.8; text-align: justify; margin: 30px 10px; color: #0f172a;">
        Declaramos, para os devidos fins de direito e comprovação escolar junto a órgãos públicos, instituições financeiras, previdenciárias e programas sociais governamentais, que o(a) estudante:
        <br><br>
        <strong>Nome:</strong> <span style="font-size: 12pt; text-transform: uppercase;">{{ $aluno->nome ?? 'Nome do Estudante' }}</span><br>
        <strong>CPF:</strong> <span class="technical text-bold">{{ !empty($aluno->cpf) ? preg_replace('/(\d{3})(\d{3})(\d{3})(\d{2})/', '$1.$2.$3-$4', $aluno->cpf) : 'Não informado' }}</span><br>
        <strong>Data de Nascimento:</strong> <span class="technical">{{ !empty($aluno->data_nascimento) ? \Carbon\Carbon::parse($aluno->data_nascimento)->format('d/m/Y') : '---' }}</span><br>
        <strong>Filiação:</strong> {{ $aluno->filiacao ?? ($aluno->nome_mae ?? 'Não informada') }}<br>
        <br>
        Encontra-se regularmente matriculado(a) e com frequência ativa nesta unidade de ensino, sob o número de matrícula <span class="technical text-bold">{{ $matricula->enrollment_number ?? '---' }}</span>, no Ano Letivo de <span class="technical text-bold">{{ $ano_letivo ?? date('Y') }}</span>, cursando o <span class="text-bold">{{ $serie->name ?? 'Ano/Série Regular' }}</span> do <span class="text-bold">{{ $curso->name ?? 'Ensino Fundamental' }}</span>, Turma <span class="text-bold">{{ $turma->name ?? 'A' }}</span>, no turno <span class="text-bold">{{ ucfirst($turma->shift ?? 'Matutino') }}</span>.
        <br><br>
        A presente declaração é expedida eletronicamente em conformidade com as normas educacionais e os registros constantes na Secretaria Escolar.
    </div>

    <div style="margin: 40px 10px 20px 10px; text-align: right; font-size: 10pt;">
        {{ $municipio ?? 'Município' }}, {{ date('d') }} de {{ \Carbon\Carbon::now()->translatedFormat('F') }} de {{ date('Y') }}.
    </div>

    <table class="signatures" style="margin-top: 50px;">
        <tr>
            <td>
                <div class="signature-line">Secretário(a) Escolar</div>
                <div class="signature-role">Secretaria da Unidade Escolar</div>
            </td>
            <td>
                <div class="signature-line">Diretor(a) Escolar</div>
                <div class="signature-role">Direção da Unidade Escolar</div>
            </td>
        </tr>
    </table>

    @if(!empty($codigo_autenticacao))
        <div class="auth-box" style="margin-top: 40px;">
            <table class="auth-table">
                <tr>
                    @if(!empty($qr_code))
                        <td class="auth-qr">
                            <img src="{{ $qr_code }}" alt="QR Code">
                        </td>
                    @endif
                    <td class="auth-text">
                        <strong>Autenticidade e Verificação da Declaração:</strong><br>
                        Código Verificador: <span class="technical text-bold" style="font-size: 8.5pt;">{{ $codigo_autenticacao }}</span><br>
                        A autenticidade deste documento pode ser confirmada publicamente a qualquer momento apontando a câmera do celular para o QR Code ao lado ou acessando: <span class="technical">{{ $url_verificacao }}</span>
                    </td>
                </tr>
            </table>
        </div>
    @endif

@endsection
