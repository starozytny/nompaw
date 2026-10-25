<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261025145036 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Supprime le module Changelogs (table changelog).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('DROP TABLE changelog');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('CREATE TABLE changelog (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) CHARACTER SET utf8mb4 NOT NULL COLLATE `utf8mb4_unicode_ci`, type INT NOT NULL, is_published TINYINT(1) NOT NULL, content LONGTEXT CHARACTER SET utf8mb4 NOT NULL COLLATE `utf8mb4_unicode_ci`, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = \'\' ');
    }
}
