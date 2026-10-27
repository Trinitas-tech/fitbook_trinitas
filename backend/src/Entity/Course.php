<?php

namespace App\Entity;

use App\Enum\Level;
use App\Repository\CourseRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/** Table MLD : cours (l'offre, ex. « Yoga débutant, 60 min, 12 places »). */
#[ORM\Entity(repositoryClass: CourseRepository::class)]
#[ORM\Table(name: 'cours')]
class Course
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'titre', length: 150)]
    private string $title;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(name: 'niveau', length: 20, enumType: Level::class)]
    private Level $level = Level::TOUS_NIVEAUX;

    #[ORM\Column(name: 'duree_minutes')]
    private int $durationMinutes = 60;

    #[ORM\Column(name: 'prix', type: Types::DECIMAL, precision: 8, scale: 2)]
    private string $price = '0.00';

    #[ORM\Column(name: 'capacite')]
    private int $capacity = 10;

    #[ORM\Column(name: 'image_url', length: 255, nullable: true)]
    private ?string $imageUrl = null;

    #[ORM\ManyToOne(targetEntity: Gym::class, inversedBy: 'courses')]
    #[ORM\JoinColumn(name: 'salle_id', nullable: false, onDelete: 'CASCADE')]
    private Gym $gym;

    #[ORM\ManyToOne(targetEntity: Activity::class, inversedBy: 'courses')]
    #[ORM\JoinColumn(name: 'activite_id', nullable: false)]
    private Activity $activity;

    #[ORM\ManyToOne(targetEntity: Coach::class, inversedBy: 'courses')]
    #[ORM\JoinColumn(name: 'coach_id', nullable: true, onDelete: 'SET NULL')]
    private ?Coach $coach = null;

    /** @var Collection<int, Session> */
    #[ORM\OneToMany(mappedBy: 'course', targetEntity: Session::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['startAt' => 'ASC'])]
    private Collection $sessions;

    public function __construct()
    {
        $this->sessions = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }

    public function getTitle(): string { return $this->title; }
    public function setTitle(string $title): static { $this->title = $title; return $this; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): static { $this->description = $description; return $this; }

    public function getLevel(): Level { return $this->level; }
    public function setLevel(Level $level): static { $this->level = $level; return $this; }

    public function getDurationMinutes(): int { return $this->durationMinutes; }
    public function setDurationMinutes(int $durationMinutes): static { $this->durationMinutes = $durationMinutes; return $this; }

    public function getPrice(): string { return $this->price; }
    public function setPrice(string $price): static { $this->price = $price; return $this; }

    public function getCapacity(): int { return $this->capacity; }
    public function setCapacity(int $capacity): static { $this->capacity = $capacity; return $this; }

    public function getImageUrl(): ?string { return $this->imageUrl; }
    public function setImageUrl(?string $imageUrl): static { $this->imageUrl = $imageUrl; return $this; }

    public function getGym(): Gym { return $this->gym; }
    public function setGym(Gym $gym): static { $this->gym = $gym; return $this; }

    public function getActivity(): Activity { return $this->activity; }
    public function setActivity(Activity $activity): static { $this->activity = $activity; return $this; }

    public function getCoach(): ?Coach { return $this->coach; }
    public function setCoach(?Coach $coach): static { $this->coach = $coach; return $this; }

    /** @return Collection<int, Session> */
    public function getSessions(): Collection { return $this->sessions; }

    /** @return Session[] séances à venir, non annulées, triées par date */
    public function getUpcomingSessions(): array
    {
        $now = new \DateTimeImmutable();
        $list = array_filter($this->sessions->toArray(), static fn (Session $s) => $s->getStartAt() >= $now && !$s->isCancelled());
        usort($list, static fn (Session $a, Session $b) => $a->getStartAt() <=> $b->getStartAt());

        return array_values($list);
    }
}
