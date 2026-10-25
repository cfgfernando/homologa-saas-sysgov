<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>{{ $titulo ?? 'Documento Escolar' }}</title>
    <style>
        @page {
            margin: 18mm 15mm 20mm 15mm;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10pt;
            color: #1e293b;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        .header-title-main {
            font-size: 13pt;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            margin: 0 0 2px 0;
        }
        .header-title-sub {
            font-size: 10pt;
            font-weight: bold;
            color: #334155;
            text-transform: uppercase;
            margin: 0 0 2px 0;
        }
        .header-school {
            font-size: 11pt;
            font-weight: bold;
            color: #1e3a8a;
            margin: 4px 0 2px 0;
        }
        .header-school-details {
            font-size: 8pt;
            color: #64748b;
        }
        .doc-title-box {
            background-color: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 6px 12px;
            text-align: center;
            margin: 12px 0 16px 0;
            border-radius: 4px;
        }
        .doc-title {
            font-size: 12pt;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            margin: 0;
        }
        .doc-subtitle {
            font-size: 8.5pt;
            color: #475569;
            margin: 2px 0 0 0;
        }
        .technical, .font-mono {
            font-family: 'DejaVu Sans Mono', 'Courier New', Courier, monospace;
        }
        .table-data {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }
        .table-data th, .table-data td {
            border: 1px solid #cbd5e1;
            padding: 5px 8px;
            font-size: 8.5pt;
        }
        .table-data th {
            background-color: #f8fafc;
            color: #0f172a;
            font-weight: bold;
            text-align: left;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-bold { font-weight: bold; }
        
        .box-info {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            padding: 8px 12px;
            margin-bottom: 14px;
            border-radius: 4px;
        }
        .box-info-grid {
            width: 100%;
            border-collapse: collapse;
        }
        .box-info-grid td {
            padding: 3px 6px;
            font-size: 8.5pt;
            vertical-align: top;
        }
        .label {
            font-weight: bold;
            color: #475569;
            text-transform: uppercase;
            font-size: 7.5pt;
        }
        .value {
            color: #0f172a;
            font-size: 8.5pt;
        }
        
        .footer {
            margin-top: 30px;
            font-size: 7.5pt;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
        }
        .signatures {
            width: 100%;
            margin-top: 35px;
            margin-bottom: 20px;
        }
        .signatures td {
            width: 50%;
            text-align: center;
            vertical-align: top;
            padding: 0 20px;
        }
        .signature-line {
            border-top: 1px solid #0f172a;
            padding-top: 4px;
            font-size: 8.5pt;
            font-weight: bold;
            color: #0f172a;
        }
        .signature-role {
            font-size: 7.5pt;
            color: #64748b;
        }
        
        .auth-box {
            border: 1px dashed #94a3b8;
            padding: 8px;
            margin-top: 15px;
            border-radius: 4px;
            background-color: #f8fafc;
        }
        .auth-table {
            width: 100%;
            border-collapse: collapse;
        }
        .auth-qr {
            width: 75px;
            text-align: center;
        }
        .auth-qr img {
            width: 65px;
            height: 65px;
        }
        .auth-text {
            vertical-align: middle;
            padding-left: 10px;
            font-size: 7.5pt;
            color: #475569;
        }
        .badge-status {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 7.5pt;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-aprovado { background-color: #dcfce7; color: #166534; }
        .badge-reprovado { background-color: #fee2e2; color: #991b1b; }
        .badge-recuperacao { background-color: #fef3c7; color: #92400e; }
        .badge-cursando { background-color: #e0f2fe; color: #075985; }
    </style>
</head>
<body>

    <div class="header">
        <div class="header-title-main">{{ $municipio ?? 'Prefeitura Municipal' }}</div>
        <div class="header-title-sub">{{ $secretaria ?? 'Secretaria Municipal de Educação' }}</div>
        <div class="header-school">{{ $escola->name ?? 'Unidade Escolar' }}</div>
        <div class="header-school-details">
            Código INEP: <span class="technical">{{ $escola->inep_code ?? '---' }}</span>
            @if(!empty($escola->address)) | Endereço: {{ $escola->address }} @endif
            @if(!empty($escola->phone)) | Telefone: <span class="technical">{{ $escola->phone }}</span> @endif
        </div>
    </div>

    @yield('content')

    <div class="footer">
        <table style="width: 100%;">
            <tr>
                <td style="text-align: left;">
                    SYSGOV Educação | Emitido em <span class="technical">{{ $emitido_em ?? date('d/m/Y H:i') }}</span>
                    @if(!empty($emissor)) por <span class="technical">{{ $emissor }}</span> @endif
                </td>
                <td style="text-align: right;">
                    Documento oficial expedido eletronicamente
                </td>
            </tr>
        </table>
    </div>

</body>
</html>
