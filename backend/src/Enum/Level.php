<?php

namespace App\Enum;

enum Level: string
{
    case DEBUTANT = 'debutant';
    case INTERMEDIAIRE = 'intermediaire';
    case AVANCE = 'avance';
    case TOUS_NIVEAUX = 'tous_niveaux';

    /** @return string[] */
    public static function values(): array
    {
        return array_map(static fn (self $c) => $c->value, self::cases());
    }
}
