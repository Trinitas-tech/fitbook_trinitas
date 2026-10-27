<?php

namespace App\Enum;

enum SessionStatus: string
{
    case PLANIFIEE = 'planifiee';
    case COMPLETE = 'complete';
    case ANNULEE = 'annulee';
    case TERMINEE = 'terminee';
}
