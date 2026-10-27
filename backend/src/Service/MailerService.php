<?php

namespace App\Service;

use App\Entity\Booking;
use App\Entity\Notification;
use App\Entity\Session;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

/**
 * E-mails HTML en français (US-61) + trace en table notification.
 */
class MailerService
{
    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly EntityManagerInterface $em,
        private readonly LoggerInterface $logger,
        #[Autowire('%app.frontend_url%')] private readonly string $frontendUrl,
        #[Autowire('%app.mailer_from%')] private readonly string $mailerFrom,
    ) {
    }

    public function sendVerification(User $user): void
    {
        $url = $this->frontendUrl.'/verification-email?token='.$user->getVerificationToken();
        $this->send($user, 'Confirmez votre adresse e-mail – FitBook', 'emails/verification.html.twig', ['user' => $user, 'url' => $url], Notification::TYPE_INFO);
    }

    public function sendPasswordReset(User $user): void
    {
        $url = $this->frontendUrl.'/reinitialiser-mot-de-passe?token='.$user->getResetToken();
        $this->send($user, 'Réinitialisation de votre mot de passe – FitBook', 'emails/reset_password.html.twig', ['user' => $user, 'url' => $url], Notification::TYPE_INFO);
    }

    public function sendBookingConfirmation(Booking $booking): void
    {
        $this->send($booking->getUser(), 'Réservation confirmée – '.$booking->getSession()->getTitle(), 'emails/booking_confirmation.html.twig', ['booking' => $booking, 'session' => $booking->getSession()], Notification::TYPE_CONFIRMATION, $booking);
    }

    public function sendBookingCancellation(Booking $booking, bool $bySystem = false): void
    {
        $this->send($booking->getUser(), 'Réservation annulée – '.$booking->getSession()->getTitle(), 'emails/booking_cancellation.html.twig', ['booking' => $booking, 'session' => $booking->getSession(), 'bySystem' => $bySystem], Notification::TYPE_ANNULATION, $booking);
    }

    public function sendSessionCancelled(Booking $booking, Session $session): void
    {
        $this->send($booking->getUser(), 'Séance annulée – '.$session->getTitle(), 'emails/session_cancelled.html.twig', ['booking' => $booking, 'session' => $session], Notification::TYPE_ANNULATION, $booking);
    }

    /** @param array<string, mixed> $context */
    private function send(User $to, string $subject, string $template, array $context, string $type, ?Booking $booking = null): void
    {
        $email = (new TemplatedEmail())
            ->from(new Address($this->mailerFrom, 'FitBook'))
            ->to(new Address($to->getEmail(), $to->getFullName()))
            ->subject($subject)
            ->htmlTemplate($template)
            ->context($context + ['frontendUrl' => $this->frontendUrl]);
        try {
            $this->mailer->send($email);
        } catch (\Throwable $e) {
            // L'échec d'envoi ne doit pas bloquer l'action métier.
            $this->logger->error('Échec envoi e-mail : '.$e->getMessage(), ['to' => $to->getEmail(), 'subject' => $subject]);
        }
        $this->em->persist(new Notification($to, $type, $subject, $template, $booking));
    }
}
