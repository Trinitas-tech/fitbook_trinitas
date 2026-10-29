<?php

namespace App\Command;

use App\Repository\BookingRepository;
use App\Service\MailerService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Rappel par e-mail 24 h avant la séance (US-20). À planifier toutes les heures :
 * envoie un rappel pour chaque réservation confirmée dont la séance commence dans 23 à 25 h
 * et qui n'a pas encore reçu de notification de type « rappel ».
 */
#[AsCommand(name: 'app:bookings:remind', description: 'Envoie les rappels e-mail 24 h avant les séances.')]
class RemindBookingsCommand extends Command
{
    public function __construct(
        private readonly BookingRepository $bookings,
        private readonly MailerService $mailer,
        private readonly EntityManagerInterface $em,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('hours', null, InputOption::VALUE_REQUIRED, 'Délai du rappel en heures avant la séance', '24')
            ->addOption('window', null, InputOption::VALUE_REQUIRED, 'Largeur de la fenêtre en heures (± autour du délai)', '1');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $hours = max(1, (int) $input->getOption('hours'));
        $window = max(0.25, (float) $input->getOption('window'));
        $now = new \DateTimeImmutable();
        $from = $now->modify(sprintf('+%d minutes', (int) (($hours - $window) * 60)));
        $to = $now->modify(sprintf('+%d minutes', (int) (($hours + $window) * 60)));

        $count = 0;
        foreach ($this->bookings->findToRemind($from, $to) as $booking) {
            $this->mailer->sendReminder($booking);
            ++$count;
        }
        $this->em->flush();
        $io->success(sprintf('%d rappel(s) envoyé(s) pour les séances entre %s et %s.', $count, $from->format('d/m H:i'), $to->format('d/m H:i')));

        return Command::SUCCESS;
    }
}
