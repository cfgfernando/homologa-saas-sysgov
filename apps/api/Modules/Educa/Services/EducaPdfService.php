<?php

declare(strict_types=1);

namespace Modules\Educa\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use chillerlan\QRCode\Output\QRGdImagePNG;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Illuminate\Support\Facades\View;

final class EducaPdfService
{
    /**
     * Renderiza uma view Blade para binário PDF com numeração de página via Canvas do DomPDF.
     *
     * @param string $view Nome da view (ex: 'educa::pdf.boletim')
     * @param array<string, mixed> $dados Dados injetados na view
     * @param string $orientacao 'portrait' ou 'landscape'
     * @return string Conteúdo binário do PDF
     */
    public function renderizar(string $view, array $dados, string $orientacao = 'portrait'): string
    {
        $html = View::make($view, $dados)->render();

        $pdf = Pdf::loadHTML($html)
            ->setPaper('a4', $orientacao)
            ->setOption([
                'isFontSubsettingEnabled' => true,
                'defaultFont' => 'DejaVu Sans',
                'isRemoteEnabled' => false,
            ]);

        $dompdf = $pdf->getDomPDF();
        $dompdf->render();

        // Paginação dinâmica no rodapé via Canvas
        $canvas = $dompdf->getCanvas();
        $fonte = $dompdf->getFontMetrics()->getFont('DejaVu Sans');
        $canvas->page_text(
            $canvas->get_width() - 95,
            $canvas->get_height() - 28,
            'Pág. {PAGE_NUM} de {PAGE_COUNT}',
            $fonte,
            7.5,
            [0.42, 0.45, 0.5]
        );

        return (string) $dompdf->output();
    }

    /**
     * Gera imagem PNG em formato Base64 Data URI com QR Code de validação.
     */
    public function gerarQrCodeBase64(string $url): string
    {
        $options = new QROptions([
            'outputInterface' => QRGdImagePNG::class,
            'outputBase64' => true,
            'scale' => 4,
            'imageBase64' => true,
        ]);

        return (new QRCode($options))->render($url);
    }
}
