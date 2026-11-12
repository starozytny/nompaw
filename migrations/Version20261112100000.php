<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261112100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Adds latitude/longitude to ra_suggestion.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE ra_suggestion ADD latitude DOUBLE PRECISION DEFAULT NULL, ADD longitude DOUBLE PRECISION DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE ra_suggestion DROP latitude, DROP longitude');
    }
}
