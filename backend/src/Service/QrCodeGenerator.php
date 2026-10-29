<?php

namespace App\Service;

use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\Writer\SvgWriter;

/** Génère le QR code d'une réservation (US-22) sous forme de data URI SVG, directement affichable dans une balise img. */
class QrCodeGenerator
{
    /** @var array<string, string> cache par requête */
    private array $cache = [];

    public function svgDataUri(string $content): string
    {
        if (!isset($this->cache[$content])) {
            $result = (new Builder(
                writer: new SvgWriter(),
                data: $content,
                errorCorrectionLevel: ErrorCorrectionLevel::Medium,
                size: 300,
                margin: 10,
            ))->build();
            $this->cache[$content] = $result->getDataUri();
        }

        return $this->cache[$content];
    }
}
