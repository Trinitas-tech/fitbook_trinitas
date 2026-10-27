<?php

namespace App\Enum;

enum BookingStatus: string
{
    case CONFIRMEE = 'confirmee';
    case ANNULEE = 'annulee';
    case TERMINEE = 'terminee';
}
