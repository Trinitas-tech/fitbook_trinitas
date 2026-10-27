<?php

namespace App\Enum;

enum ReviewStatus: string
{
    case EN_ATTENTE = 'en_attente';
    case APPROUVE = 'approuve';
    case MASQUE = 'masque';
}
