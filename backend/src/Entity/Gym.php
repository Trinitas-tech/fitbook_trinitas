<?php

namespace App\Entity;

use App\Enum\ReviewStatus;
use App\Repository\GymRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/** Table MLD : salle. */
#[ORM\Entity(repositoryClass: GymRepository::class)]
#[ORM\Table(name: 'salle')]
class Gym
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'nom', length: 150)]
    private string $name;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(name: 'adresse', length: 255)]
    private string $address;

    #[ORM\Column(name: 'ville', length: 100)]
    private string $city;

    #[ORM\Column(name: 'code_postal', length: 10)]
    private string $postalCode;

    #[ORM\Column(type: Types::DECIMAL, precision: 9, scale: 6, nullable: true)]
    private ?string $latitude = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 9, scale: 6, nullable: true)]
    private ?string $longitude = null;

    #[ORM\Column(name: 'telephone', length: 20, nullable: true)]
    private ?string $phone = null;

    #[ORM\Column(name: 'image_url', length: 255, nullable: true)]
    private ?string $imageUrl = null;

    #[ORM\Column(name: 'capacite_totale')]
    private int $totalCapacity = 0;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'gyms')]
    #[ORM\JoinColumn(name: 'gestionnaire_id', nullable: false)]
    private User $manager;

    /** @var Collection<int, OpeningHour> */
    #[ORM\OneToMany(mappedBy: 'gym', targetEntity: OpeningHour::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['dayOfWeek' => 'ASC'])]
    private Collection $openingHours;

    /** @var Collection<int, Course> */
    #[ORM\OneToMany(mappedBy: 'gym', targetEntity: Course::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $courses;

    /** @var Collection<int, Review> */
    #[ORM\OneToMany(mappedBy: 'gym', targetEntity: Review::class)]
    private Collection $reviews;

    public function __construct()
    {
        $this->openingHours = new ArrayCollection();
        $this->courses = new ArrayCollection();
        $this->reviews = new ArrayCollection();
    }

    public function getId(): ?int { return $this->id; }

    public function getName(): string { return $this->name; }
    public function setName(string $name): static { $this->name = $name; return $this; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): static { $this->description = $description; return $this; }

    public function getAddress(): string { return $this->address; }
    public function setAddress(string $address): static { $this->address = $address; return $this; }

    public function getCity(): string { return $this->city; }
    public function setCity(string $city): static { $this->city = $city; return $this; }

    public function getPostalCode(): string { return $this->postalCode; }
    public function setPostalCode(string $postalCode): static { $this->postalCode = $postalCode; return $this; }

    public function getLatitude(): ?string { return $this->latitude; }
    public function setLatitude(?string $latitude): static { $this->latitude = $latitude; return $this; }

    public function getLongitude(): ?string { return $this->longitude; }
    public function setLongitude(?string $longitude): static { $this->longitude = $longitude; return $this; }

    public function getPhone(): ?string { return $this->phone; }
    public function setPhone(?string $phone): static { $this->phone = $phone; return $this; }

    public function getImageUrl(): ?string { return $this->imageUrl; }
    public function setImageUrl(?string $imageUrl): static { $this->imageUrl = $imageUrl; return $this; }

    public function getTotalCapacity(): int { return $this->totalCapacity; }
    public function setTotalCapacity(int $totalCapacity): static { $this->totalCapacity = $totalCapacity; return $this; }

    public function getManager(): User { return $this->manager; }
    public function setManager(User $manager): static { $this->manager = $manager; return $this; }

    /** @return Collection<int, OpeningHour> */
    public function getOpeningHours(): Collection { return $this->openingHours; }
    public function addOpeningHour(OpeningHour $hour): static
    {
        if (!$this->openingHours->contains($hour)) {
            $this->openingHours->add($hour);
            $hour->setGym($this);
        }

        return $this;
    }
    public function clearOpeningHours(): static { $this->openingHours->clear(); return $this; }

    /** @return Collection<int, Course> */
    public function getCourses(): Collection { return $this->courses; }

    /** @return Collection<int, Review> */
    public function getReviews(): Collection { return $this->reviews; }

    /** @return Review[] */
    public function getApprovedReviews(): array
    {
        return array_values(array_filter($this->reviews->toArray(), static fn (Review $r) => $r->getStatus() === ReviewStatus::APPROUVE));
    }

    /** Note moyenne sur les avis approuvés, arrondie à 1 décimale (US-62). */
    public function getAverageRating(): ?float
    {
        $reviews = $this->getApprovedReviews();
        if ($reviews === []) {
            return null;
        }

        return round(array_sum(array_map(static fn (Review $r) => $r->getRating(), $reviews)) / \count($reviews), 1);
    }
}
