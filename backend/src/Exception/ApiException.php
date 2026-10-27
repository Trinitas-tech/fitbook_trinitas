<?php

namespace App\Exception;

/** Exception métier convertie en réponse JSON { message, errors } par ApiExceptionListener. */
class ApiException extends \RuntimeException
{
    /** @param array<string, string> $errors */
    public function __construct(string $message, private readonly int $statusCode = 400, private readonly array $errors = [])
    {
        parent::__construct($message);
    }

    public function getStatusCode(): int { return $this->statusCode; }

    /** @return array<string, string> */
    public function getErrors(): array { return $this->errors; }

    public static function notFound(string $message = 'Ressource introuvable.'): self { return new self($message, 404); }
    public static function forbidden(string $message = 'Accès refusé.'): self { return new self($message, 403); }
    public static function conflict(string $message): self { return new self($message, 409); }

    /** @param array<string, string> $errors */
    public static function validation(array $errors, string $message = 'Données invalides.'): self { return new self($message, 400, $errors); }
}
