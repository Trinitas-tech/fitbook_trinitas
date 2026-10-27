<?php

namespace App\DataFixtures;

use App\Entity\Activity;
use App\Entity\Availability;
use App\Entity\Booking;
use App\Entity\Coach;
use App\Entity\Course;
use App\Entity\FavoriteCoach;
use App\Entity\FavoriteGym;
use App\Entity\Gym;
use App\Entity\OpeningHour;
use App\Entity\Review;
use App\Entity\Session;
use App\Entity\User;
use App\Enum\BookingStatus;
use App\Enum\Level;
use App\Enum\ReviewStatus;
use App\Enum\SessionStatus;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Jeu de données de démonstration. Mot de passe de tous les comptes : Password123!
 *
 *  admin@fitbook.fr (admin) · manager@fitbook.fr, manager2@fitbook.fr (gestionnaires)
 *  coach1@fitbook.fr … coach3@fitbook.fr (coachs validés), coach4@fitbook.fr (en attente)
 *  user1@fitbook.fr … user5@fitbook.fr (sportifs)
 */
class AppFixtures extends Fixture
{
    public const PASSWORD = 'Password123!';

    public function __construct(private readonly UserPasswordHasherInterface $hasher)
    {
    }

    public function load(ObjectManager $em): void
    {
        $t = static fn (string $h) => new \DateTimeImmutable('1970-01-01 '.$h);

        // ----- Utilisateurs -----
        $admin = $this->user($em, 'admin@fitbook.fr', 'Admin', 'FitBook', ['ROLE_ADMIN']);
        $manager1 = $this->user($em, 'manager@fitbook.fr', 'Sophie', 'Martin', ['ROLE_MANAGER']);
        $manager2 = $this->user($em, 'manager2@fitbook.fr', 'Karim', 'Benali', ['ROLE_MANAGER']);

        $coachSpecs = [
            ['coach1@fitbook.fr', 'Léa', 'Dubois', 'Yoga & Pilates', 'Professeure de yoga certifiée, 8 ans d\'expérience. Séances douces et accessibles.', '45.00', 'Lyon', true],
            ['coach2@fitbook.fr', 'Thomas', 'Moreau', 'Musculation & CrossFit', 'Ancien athlète, coach diplômé BPJEPS. Programmes personnalisés force et conditionnement.', '55.00', 'Lyon', true],
            ['coach3@fitbook.fr', 'Inès', 'Garcia', 'Running & Cardio', 'Préparatrice physique, spécialiste endurance et perte de poids.', '40.00', 'Paris', true],
            ['coach4@fitbook.fr', 'Hugo', 'Petit', 'Boxe', 'Boxeur amateur, coach en cours de validation.', '35.00', 'Paris', false],
        ];
        /** @var Coach[] $coaches */
        $coaches = [];
        foreach ($coachSpecs as [$email, $first, $last, $spec, $bio, $rate, $city, $validated]) {
            $u = $this->user($em, $email, $first, $last, ['ROLE_COACH']);
            $c = (new Coach())->setSpecialty($spec)->setBio($bio)->setHourlyRate($rate)->setCity($city)->setIsValidated($validated);
            $u->setCoach($c);
            foreach ([1, 2, 3, 4, 5] as $day) {
                $c->addAvailability(new Availability($day, $t('08:00'), $t('12:00')));
                $c->addAvailability(new Availability($day, $t('14:00'), $t('20:00')));
            }
            $c->addAvailability(new Availability(6, $t('09:00'), $t('13:00')));
            $em->persist($c);
            $coaches[] = $c;
        }

        /** @var User[] $users */
        $users = [];
        foreach ([['Emma', 'Leroy'], ['Lucas', 'Roux'], ['Chloé', 'Fournier'], ['Nathan', 'Girard'], ['Manon', 'Lambert']] as $i => [$first, $last]) {
            $users[] = $this->user($em, sprintf('user%d@fitbook.fr', $i + 1), $first, $last, ['ROLE_USER']);
        }

        // ----- Activités -----
        $activityNames = ['Yoga' => 'self_improvement', 'Pilates' => 'accessibility_new', 'Musculation' => 'fitness_center', 'CrossFit' => 'sports_gymnastics', 'Cardio' => 'directions_run', 'Boxe' => 'sports_mma', 'Natation' => 'pool', 'Danse' => 'music_note', 'Cyclisme' => 'directions_bike', 'Zumba' => 'celebration'];
        /** @var Activity[] $activities */
        $activities = [];
        foreach ($activityNames as $name => $icon) {
            $a = (new Activity())->setName($name)->setIcon($icon)->setDescription("Cours de $name encadrés par des professionnels.");
            $em->persist($a);
            $activities[$name] = $a;
        }

        // ----- Salles -----
        $gymSpecs = [
            [$manager1, 'FitZone Lyon Part-Dieu', 'Salle moderne de 800 m² au cœur de Lyon : plateau musculation, studios de cours collectifs, sauna.', '12 rue Servient', 'Lyon', '69003', '0472000001', 45.760, 4.857, 120, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'],
            [$manager1, 'Yoga Loft Croix-Rousse', 'Studio chaleureux dédié au yoga, au pilates et à la méditation.', '5 place de la Croix-Rousse', 'Lyon', '69004', '0472000002', 45.774, 4.832, 25, 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800'],
            [$manager2, 'Urban Fitness Bastille', 'Club 24h/24 avec coachs sur place, espace cross-training et piscine.', '30 boulevard Richard-Lenoir', 'Paris', '75011', '0143000003', 48.856, 2.370, 200, 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800'],
            [$manager2, 'Boxing Club République', 'Salle de boxe anglaise et pieds-poings, cours tous niveaux.', '8 rue du Temple', 'Paris', '75003', '0143000004', 48.864, 2.355, 40, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800'],
        ];
        /** @var Gym[] $gyms */
        $gyms = [];
        foreach ($gymSpecs as [$mgr, $name, $desc, $addr, $city, $cp, $phone, $lat, $lng, $cap, $img]) {
            $g = (new Gym())->setManager($mgr)->setName($name)->setDescription($desc)->setAddress($addr)->setCity($city)->setPostalCode($cp)
                ->setPhone($phone)->setLatitude((string) $lat)->setLongitude((string) $lng)->setTotalCapacity($cap)->setImageUrl($img);
            foreach ([1, 2, 3, 4, 5] as $day) {
                $g->addOpeningHour(new OpeningHour($day, $t('07:00'), $t('22:00')));
            }
            $g->addOpeningHour(new OpeningHour(6, $t('09:00'), $t('19:00')));
            $em->persist($g);
            $gyms[] = $g;
        }

        // ----- Cours -----
        $courseSpecs = [
            [0, 'Musculation', 'Full Body débutant', Level::DEBUTANT, 60, '12.00', 15, $coaches[1]],
            [0, 'CrossFit', 'WOD du soir', Level::INTERMEDIAIRE, 60, '15.00', 12, $coaches[1]],
            [0, 'Cardio', 'HIIT express', Level::TOUS_NIVEAUX, 45, '10.00', 20, $coaches[2]],
            [0, 'Zumba', 'Zumba party', Level::TOUS_NIVEAUX, 60, '9.00', 25, null],
            [1, 'Yoga', 'Yoga Vinyasa matin', Level::TOUS_NIVEAUX, 75, '18.00', 12, $coaches[0]],
            [1, 'Pilates', 'Pilates renforcement', Level::INTERMEDIAIRE, 60, '16.00', 10, $coaches[0]],
            [1, 'Yoga', 'Yin Yoga & relaxation', Level::DEBUTANT, 60, '15.00', 12, null],
            [2, 'Musculation', 'Haltérophilie technique', Level::AVANCE, 90, '20.00', 8, null],
            [2, 'Natation', 'Aquagym', Level::TOUS_NIVEAUX, 45, '11.00', 15, null],
            [2, 'Cardio', 'Running club', Level::TOUS_NIVEAUX, 60, '8.00', 30, $coaches[2]],
            [3, 'Boxe', 'Boxe anglaise initiation', Level::DEBUTANT, 60, '14.00', 16, null],
            [3, 'Boxe', 'Cardio boxing', Level::INTERMEDIAIRE, 45, '12.00', 16, null],
        ];
        /** @var Course[] $courses */
        $courses = [];
        foreach ($courseSpecs as [$gi, $act, $title, $level, $dur, $price, $cap, $coach]) {
            $c = (new Course())->setGym($gyms[$gi])->setActivity($activities[$act])->setTitle($title)->setLevel($level)
                ->setDurationMinutes($dur)->setPrice($price)->setCapacity($cap)->setCoach($coach)
                ->setDescription("Séance de $title ($act) encadrée dans la salle {$gyms[$gi]->getName()}.");
            $gyms[$gi]->getCourses()->add($c);
            $em->persist($c);
            $courses[] = $c;
        }

        // ----- Séances : 2 semaines passées + 4 semaines à venir, par cours -----
        $now = new \DateTimeImmutable();
        $monday = $now->modify('monday this week')->setTime(0, 0);
        $hours = ['07:30', '09:00', '12:15', '18:00', '19:30'];
        /** @var Session[] $pastSessions */
        $pastSessions = [];
        /** @var Session[] $futureSessions */
        $futureSessions = [];
        foreach ($courses as $ci => $course) {
            $slots = [[1 + ($ci % 5), $hours[$ci % 5]], [3 + ($ci % 3), $hours[($ci + 2) % 5]]];
            for ($week = -2; $week < 4; ++$week) {
                foreach ($slots as [$day, $hour]) {
                    $start = $monday->modify(sprintf('+%d days +%d weeks', $day - 1, $week))->setTime((int) substr($hour, 0, 2), (int) substr($hour, 3, 2));
                    $s = (new Session())->setCourse($course)->setStartAt($start)
                        ->setEndAt($start->modify('+'.$course->getDurationMinutes().' minutes'))
                        ->setCapacity($course->getCapacity())->setPrice($course->getPrice());
                    if ($start < $now) {
                        $s->setStatus(SessionStatus::TERMINEE);
                        $pastSessions[] = $s;
                    } else {
                        $futureSessions[] = $s;
                    }
                    $course->getSessions()->add($s);
                    $em->persist($s);
                }
            }
        }
        // Séances privées des coachs validés (à venir)
        foreach (array_slice($coaches, 0, 3) as $ci => $coach) {
            for ($week = 0; $week < 3; ++$week) {
                $start = $monday->modify(sprintf('+%d days +%d weeks', 1 + $ci, $week))->setTime(10, 0);
                if ($start < $now) {
                    $start = $start->modify('+1 week');
                }
                $s = (new Session())->setCoach($coach)->setStartAt($start)->setEndAt($start->modify('+60 minutes'))
                    ->setCapacity(1)->setPrice($coach->getHourlyRate() ?? '40.00')->setLocation('Parc de la Tête d\'Or, '.$coach->getCity());
                $em->persist($s);
                $futureSessions[] = $s;
            }
            // Une séance privée passée (pour autoriser un avis sur le coach)
            $past = $monday->modify('-1 week +2 days')->setTime(10, 0);
            $s = (new Session())->setCoach($coach)->setStartAt($past)->setEndAt($past->modify('+60 minutes'))
                ->setCapacity(1)->setPrice($coach->getHourlyRate() ?? '40.00')->setStatus(SessionStatus::TERMINEE)->setLocation('Parc, '.$coach->getCity());
            $em->persist($s);
            $pastSessions[] = $s;
        }

        // ----- Réservations -----
        $i = 0;
        foreach ($pastSessions as $s) {
            $u = $users[$i % \count($users)];
            $b = new Booking($u, $s, 1);
            $b->setStatus(BookingStatus::TERMINEE);
            $s->getBookings()->add($b);
            $em->persist($b);
            if ($i % 3 === 0) {
                $u2 = $users[($i + 1) % \count($users)];
                $b2 = new Booking($u2, $s, 1);
                $b2->setStatus(BookingStatus::TERMINEE);
                $s->getBookings()->add($b2);
                $em->persist($b2);
            }
            ++$i;
        }
        foreach ($futureSessions as $k => $s) {
            if ($k % 2 === 0) {
                $u = $users[$k % \count($users)];
                $b = new Booking($u, $s, 1);
                $s->getBookings()->add($b);
                $em->persist($b);
            }
            if ($k % 7 === 0) {
                $u = $users[($k + 2) % \count($users)];
                $b = new Booking($u, $s, 1);
                $b->setStatus(BookingStatus::ANNULEE);
                $s->getBookings()->add($b);
                $em->persist($b);
            }
            $s->refreshStatus();
        }

        // ----- Avis -----
        $comments = ['Excellente salle, matériel récent et coachs à l\'écoute.', 'Très bonne ambiance, je recommande !', 'Un peu cher mais la qualité est au rendez-vous.', 'Cours dynamiques, on ne s\'ennuie jamais.', 'Vestiaires un peu petits, sinon parfait.'];
        foreach ($gyms as $gi => $g) {
            foreach (array_slice($users, 0, 3) as $ui => $u) {
                $r = new Review($u, 3 + (($gi + $ui) % 3), $comments[($gi + $ui) % 5], $g, null);
                if ($gi === 0 && $ui === 2) {
                    $r->setStatus(ReviewStatus::EN_ATTENTE);
                }
                $g->getReviews()->add($r);
                $em->persist($r);
            }
        }
        foreach (array_slice($coaches, 0, 3) as $ci => $c) {
            foreach (array_slice($users, 0, 2) as $ui => $u) {
                $r = new Review($u, 4 + (($ci + $ui) % 2), $comments[($ci + $ui + 2) % 5], null, $c);
                $c->getReviews()->add($r);
                $em->persist($r);
            }
        }

        // ----- Favoris -----
        $users[0]->getFavoriteGyms()->add(new FavoriteGym($users[0], $gyms[0]));
        $users[0]->getFavoriteGyms()->add(new FavoriteGym($users[0], $gyms[1]));
        $users[0]->getFavoriteCoaches()->add(new FavoriteCoach($users[0], $coaches[0]));
        $users[1]->getFavoriteGyms()->add(new FavoriteGym($users[1], $gyms[2]));

        $em->flush();
    }

    /** @param string[] $roles */
    private function user(ObjectManager $em, string $email, string $first, string $last, array $roles): User
    {
        $u = (new User())->setEmail($email)->setFirstName($first)->setLastName($last)->setRoles($roles)->setIsVerified(true)->setPhone('06'.str_pad((string) crc32($email) % 100000000, 8, '0', STR_PAD_LEFT));
        $u->setPassword($this->hasher->hashPassword($u, self::PASSWORD));
        $em->persist($u);

        return $u;
    }
}
