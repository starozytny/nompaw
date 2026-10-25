<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261025114048 extends AbstractMigration
{
    public function getDescription(): string
    {
        return "Ajoute l'échéance (date cible) optionnelle sur bu_category.";
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE bu_category ADD goal_date DATETIME DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE bu_category DROP goal_date');
    }
}
