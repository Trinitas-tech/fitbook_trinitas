<?php

namespace App\Command;

use App\Enum\BookingStatus;
use App\Enum\SessionStatus;
use App\Repository\SessionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Passe en « terminée » les séances dont la date de fin est dépassée, ainsi que leurs
 * réservations confirmées (US-63). À planifier (cron / tâche planifiée) toutes les heures.
 */
#[AsCommand(name: 'app:sessions:close', description: 'Clôture les séances passées et leurs réservations.')]
class CloseSessionsCommand extends Command
{
    public function __construct(private readonly SessionRepository $sessions, private readonly EntityManagerInterface $em)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $count = 0;
        foreach ($this->sessions->findToClose() as $session) {
            $session->setStatus(SessionStatus::TERMINEE);
            foreach ($session->getBookings() as $b) {
                if ($b->getStatus() === BookingStatus::CONFIRMEE) {
                    $b->setStatus(BookingStatus::TERMINEE);
                }
            }
            ++$count;
        }
        $this->em->flush();
        $io->success(sprintf('%d séance(s) clôturée(s).', $count));

        return Command::SUCCESS;
    }
}
