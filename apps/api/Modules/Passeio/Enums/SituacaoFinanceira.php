<?php

declare(strict_types=1);

namespace Modules\Passeio\Enums;

/** quitado: pago ≥ devido e devido > 0; parcial: 0 < pago < devido; pendente: nada pago (mesma regra da Formatura). */
enum SituacaoFinanceira: string
{
    case Quitado = 'quitado';
    case Parcial = 'parcial';
    case Pendente = 'pendente';

    public static function de(int $devidoCentavos, int $pagoCentavos): self
    {
        return match (true) {
            $pagoCentavos <= 0 => self::Pendente,
            $devidoCentavos > 0 && $pagoCentavos >= $devidoCentavos => self::Quitado,
            default => self::Parcial,
        };
    }
}
