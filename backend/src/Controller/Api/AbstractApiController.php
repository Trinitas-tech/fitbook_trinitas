<?php

namespace App\Controller\Api;

use App\Entity\User;
use App\Exception\ApiException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Contracts\Service\Attribute\Required;

abstract class AbstractApiController extends AbstractController
{
    protected ValidatorInterface $validator;

    #[Required]
    public function setValidator(ValidatorInterface $validator): void
    {
        $this->validator = $validator;
    }

    /** @return array<string, mixed> */
    protected function jsonBody(Request $request): array
    {
        $content = $request->getContent();
        if ($content === '') {
            return [];
        }
        try {
            $data = json_decode($content, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw new ApiException('Corps JSON invalide.', 400);
        }

        return \is_array($data) ? $data : [];
    }

    /**
     * Valide le corps JSON avec une Collection de contraintes ; lève une 400 avec la liste des erreurs.
     *
     * @param array<string, mixed>                       $data
     * @param array<string, Assert\Composite|Assert\Constraint|array<Assert\Constraint>> $fields
     *
     * @return array<string, mixed>
     */
    protected function validate(array $data, array $fields, bool $allowExtra = true): array
    {
        $violations = $this->validator->validate($data, new Assert\Collection(fields: $fields, allowExtraFields: $allowExtra, allowMissingFields: false));
        if (\count($violations) > 0) {
            $errors = [];
            foreach ($violations as $v) {
                $errors[trim((string) $v->getPropertyPath(), '[]')] = (string) $v->getMessage();
            }
            throw ApiException::validation($errors);
        }

        return $data;
    }

    protected function currentUser(): User
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            throw new ApiException('Authentification requise.', 401);
        }

        return $user;
    }

    /** @param array<string, mixed>|list<mixed> $data */
    protected function ok(array $data, int $status = 200): JsonResponse
    {
        return new JsonResponse($data, $status);
    }

    protected function noContent(): JsonResponse
    {
        return new JsonResponse(null, 204);
    }

    protected function page(Request $request): int { return max(1, $request->query->getInt('page', 1)); }
    protected function limit(Request $request): int { return min(100, max(1, $request->query->getInt('limit', 20))); }

    protected function dateParam(Request $request, string $name): ?\DateTimeImmutable
    {
        $v = $request->query->get($name);
        if ($v === null || $v === '') {
            return null;
        }
        try {
            return new \DateTimeImmutable($v);
        } catch (\Exception) {
            throw ApiException::validation([$name => 'Date invalide.']);
        }
    }

    /** @param array<string, mixed> $data */
    protected function parseDate(array $data, string $key): \DateTimeImmutable
    {
        try {
            return new \DateTimeImmutable((string) ($data[$key] ?? ''));
        } catch (\Exception) {
            throw ApiException::validation([$key => 'Date invalide.']);
        }
    }

    /** Heure "HH:MM" -> DateTimeImmutable (champ TIME). */
    protected function parseTime(mixed $value, string $key): \DateTimeImmutable
    {
        if (!\is_string($value) || !preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $value)) {
            throw ApiException::validation([$key => 'Heure invalide (format HH:MM).']);
        }

        return new \DateTimeImmutable('1970-01-01 '.$value);
    }
}
