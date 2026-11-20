<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261120100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Adds ra_suggestion_trace (GPX routes of a suggestion).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE ra_suggestion_trace (id INT AUTO_INCREMENT NOT NULL, suggestion_id INT NOT NULL, name VARCHAR(255) NOT NULL, file_name VARCHAR(255) NOT NULL, distance_km DOUBLE PRECISION DEFAULT NULL, elevation_gain_m INT DEFAULT NULL, altitude_max_m INT DEFAULT NULL, source VARCHAR(10) NOT NULL, created_at DATETIME NOT NULL, INDEX IDX_B2B65A0A41BB822 (suggestion_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE ra_suggestion_trace ADD CONSTRAINT FK_RA_SUGG_TRACE_SUGG FOREIGN KEY (suggestion_id) REFERENCES ra_suggestion (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE ra_suggestion_trace');
    }
}
