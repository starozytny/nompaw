<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260814180000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute date et location (facultatifs) sur ph_album.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE ph_album ADD date DATETIME DEFAULT NULL, ADD location VARCHAR(255) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE ph_album DROP date, DROP location');
    }
}
