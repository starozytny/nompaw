<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260814170000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute la taille du fichier (en octets) sur ph_media pour les compteurs de stockage.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE ph_media ADD file_size INT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE ph_media DROP file_size');
    }
}
