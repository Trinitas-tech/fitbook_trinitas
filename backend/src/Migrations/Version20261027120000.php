<?php

declare(strict_types=1);

namespace App\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Contraintes XOR du MCD (SEANCE : cours OU coach ; AVIS : salle OU coach) et moteur InnoDB
 * pour la table interne des migrations.
 */
final class Version20261027120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Contraintes CHECK XOR (seance, avis) + InnoDB sur doctrine_migration_versions';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE seance ADD CONSTRAINT chk_seance_cours_xor_coach CHECK ((cours_id IS NULL) <> (coach_id IS NULL))');
        $this->addSql('ALTER TABLE avis ADD CONSTRAINT chk_avis_salle_xor_coach CHECK ((salle_id IS NULL) <> (coach_id IS NULL))');
        $this->addSql('ALTER TABLE avis ADD CONSTRAINT chk_avis_note CHECK (rating BETWEEN 1 AND 5)');
        $this->addSql('ALTER TABLE doctrine_migration_versions ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE seance DROP CONSTRAINT chk_seance_cours_xor_coach');
        $this->addSql('ALTER TABLE avis DROP CONSTRAINT chk_avis_salle_xor_coach');
        $this->addSql('ALTER TABLE avis DROP CONSTRAINT chk_avis_note');
    }
}
