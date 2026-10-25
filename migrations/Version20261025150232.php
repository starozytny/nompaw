<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261025150232 extends AbstractMigration
{
    public function getDescription(): string
    {
        return "Supprime les modules Agenda (ag_event) et Boite d'envois (mail).";
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE mail DROP FOREIGN KEY FK_5126AC48A76ED395');
        $this->addSql('DROP TABLE ag_event');
        $this->addSql('DROP TABLE mail');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('CREATE TABLE ag_event (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) CHARACTER SET utf8mb4 NOT NULL COLLATE `utf8mb4_unicode_ci`, type INT NOT NULL, start_at DATETIME NOT NULL, end_at DATETIME DEFAULT NULL, all_day TINYINT(1) NOT NULL, localisation VARCHAR(255) CHARACTER SET utf8mb4 DEFAULT NULL COLLATE `utf8mb4_unicode_ci`, content LONGTEXT CHARACTER SET utf8mb4 DEFAULT NULL COLLATE `utf8mb4_unicode_ci`, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = \'\' ');
        $this->addSql('CREATE TABLE mail (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, expeditor VARCHAR(255) CHARACTER SET utf8mb4 NOT NULL COLLATE `utf8mb4_unicode_ci`, subject VARCHAR(255) CHARACTER SET utf8mb4 NOT NULL COLLATE `utf8mb4_unicode_ci`, destinators JSON NOT NULL COMMENT \'(DC2Type:json)\', cc JSON NOT NULL COMMENT \'(DC2Type:json)\', bcc JSON NOT NULL COMMENT \'(DC2Type:json)\', files JSON NOT NULL COMMENT \'(DC2Type:json)\', theme INT NOT NULL, is_trash TINYINT(1) NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', message LONGTEXT CHARACTER SET utf8mb4 NOT NULL COLLATE `utf8mb4_unicode_ci`, INDEX IDX_5126AC48A76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = \'\' ');
        $this->addSql('ALTER TABLE mail ADD CONSTRAINT FK_5126AC48A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
    }
}
