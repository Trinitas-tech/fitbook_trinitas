<?php

namespace App\Controller\Api;

use App\Entity\Coach;
use App\Entity\User;
use App\Exception\ApiException;
use App\Repository\UserRepository;
use App\Service\MailerService;
use App\Service\Presenter;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Constraints as Assert;

/** Authentification et compte (US-01 à US-05). */
#[Route('/api/auth')]
class AuthController extends AbstractApiController
{
    private const ROLE_MAP = ['user' => 'ROLE_USER', 'coach' => 'ROLE_COACH', 'manager' => 'ROLE_MANAGER'];

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserRepository $users,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly MailerService $mailer,
        private readonly Presenter $presenter,
    ) {
    }

    #[Route('/register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $data = $this->validate($this->jsonBody($request), [
            'email' => [new Assert\NotBlank(message: 'L\'e-mail est obligatoire.'), new Assert\Email(message: 'E-mail invalide.')],
            'password' => [new Assert\NotBlank(message: 'Le mot de passe est obligatoire.'), new Assert\Length(min: 8, minMessage: 'Le mot de passe doit contenir au moins 8 caractères.')],
            'firstName' => [new Assert\NotBlank(message: 'Le prénom est obligatoire.'), new Assert\Length(max: 100)],
            'lastName' => [new Assert\NotBlank(message: 'Le nom est obligatoire.'), new Assert\Length(max: 100)],
            'role' => [new Assert\NotBlank(message: 'Le rôle est obligatoire.'), new Assert\Choice(choices: ['user', 'coach', 'manager'], message: 'Rôle invalide (user, coach ou manager).')],
        ]);

        if ($this->users->findOneBy(['email' => mb_strtolower(trim($data['email']))]) !== null) {
            throw ApiException::conflict('Un compte existe déjà avec cet e-mail.');
        }

        $user = (new User())
            ->setEmail($data['email'])
            ->setFirstName(trim($data['firstName']))
            ->setLastName(trim($data['lastName']))
            ->setRoles([self::ROLE_MAP[$data['role']]])
            ->setVerificationToken(bin2hex(random_bytes(32)), new \DateTimeImmutable('+24 hours'));
        $user->setPassword($this->hasher->hashPassword($user, $data['password']));
        if ($data['role'] === 'coach') {
            $user->setCoach(new Coach());
        }
        $this->em->persist($user);
        $this->em->flush();
        $this->mailer->sendVerification($user);
        $this->em->flush();

        return $this->ok(['message' => 'Compte créé. Un e-mail de confirmation vous a été envoyé.', 'id' => $user->getId()], 201);
    }

    #[Route('/verify-email', methods: ['GET'])]
    public function verifyEmail(Request $request): JsonResponse
    {
        $token = (string) $request->query->get('token', '');
        $user = $token !== '' ? $this->users->findOneBy(['verificationToken' => $token]) : null;
        if ($user === null) {
            throw new ApiException('Lien de confirmation invalide.', 400);
        }
        if ($user->getVerificationTokenExpiresAt() < new \DateTimeImmutable()) {
            throw new ApiException('Ce lien de confirmation a expiré (24 h). Inscrivez-vous à nouveau.', 400);
        }
        $user->setIsVerified(true)->setVerificationToken(null, null);
        $this->em->flush();

        return $this->ok(['message' => 'Adresse e-mail confirmée. Vous pouvez vous connecter.']);
    }

    /** Route déclarée pour le firewall json_login (le traitement est fait par Symfony Security). */
    #[Route('/login', methods: ['POST'])]
    public function login(): JsonResponse
    {
        throw new ApiException('Identifiants invalides.', 401);
    }

    #[Route('/me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        return $this->ok($this->presenter->user($this->currentUser()));
    }

    #[Route('/me', methods: ['PUT', 'PATCH'])]
    public function updateMe(Request $request): JsonResponse
    {
        $user = $this->currentUser();
        $data = $this->validate($this->jsonBody($request), [
            'firstName' => new Assert\Optional([new Assert\NotBlank(), new Assert\Length(max: 100)]),
            'lastName' => new Assert\Optional([new Assert\NotBlank(), new Assert\Length(max: 100)]),
            'phone' => new Assert\Optional([new Assert\Length(max: 20)]),
            'avatarUrl' => new Assert\Optional([new Assert\Length(max: 255)]),
            'currentPassword' => new Assert\Optional(),
            'newPassword' => new Assert\Optional([new Assert\Length(min: 8, minMessage: 'Le mot de passe doit contenir au moins 8 caractères.')]),
        ]);

        if (isset($data['firstName'])) { $user->setFirstName(trim($data['firstName'])); }
        if (isset($data['lastName'])) { $user->setLastName(trim($data['lastName'])); }
        if (\array_key_exists('phone', $data)) { $user->setPhone($data['phone'] ?: null); }
        if (\array_key_exists('avatarUrl', $data)) { $user->setAvatarUrl($data['avatarUrl'] ?: null); }
        if (!empty($data['newPassword'])) {
            if (empty($data['currentPassword']) || !$this->hasher->isPasswordValid($user, $data['currentPassword'])) {
                throw ApiException::validation(['currentPassword' => 'Mot de passe actuel incorrect.']);
            }
            $user->setPassword($this->hasher->hashPassword($user, $data['newPassword']));
        }
        $this->em->flush();

        return $this->ok($this->presenter->user($user));
    }

    #[Route('/forgot-password', methods: ['POST'])]
    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $this->validate($this->jsonBody($request), ['email' => [new Assert\NotBlank(), new Assert\Email()]]);
        $user = $this->users->findOneBy(['email' => mb_strtolower(trim($data['email']))]);
        if ($user !== null && $user->isActive()) {
            $user->setResetToken(bin2hex(random_bytes(32)), new \DateTimeImmutable('+1 hour'));
            $this->em->flush();
            $this->mailer->sendPasswordReset($user);
            $this->em->flush();
        }

        return $this->ok(['message' => 'Si un compte existe avec cet e-mail, un lien de réinitialisation a été envoyé.']);
    }

    #[Route('/reset-password', methods: ['POST'])]
    public function resetPassword(Request $request): JsonResponse
    {
        $data = $this->validate($this->jsonBody($request), [
            'token' => [new Assert\NotBlank()],
            'password' => [new Assert\NotBlank(), new Assert\Length(min: 8, minMessage: 'Le mot de passe doit contenir au moins 8 caractères.')],
        ]);
        $user = $this->users->findOneBy(['resetToken' => $data['token']]);
        if ($user === null || $user->getResetTokenExpiresAt() < new \DateTimeImmutable()) {
            throw new ApiException('Lien de réinitialisation invalide ou expiré.', 400);
        }
        $user->setPassword($this->hasher->hashPassword($user, $data['password']))->setResetToken(null, null);
        $this->em->flush();

        return $this->ok(['message' => 'Mot de passe modifié. Vous pouvez vous connecter.']);
    }
}
