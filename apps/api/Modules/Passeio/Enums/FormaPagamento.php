<?php

declare(strict_types=1);

namespace Modules\Passeio\Enums;

enum FormaPagamento: string
{
    case Dinheiro = 'dinheiro';
    case Pix = 'pix';
    case Cartao = 'cartao';
    case Transferencia = 'transferencia';
    case Outro = 'outro';
}
