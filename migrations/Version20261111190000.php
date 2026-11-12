<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261111190000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Adds ra_suggestion table for hiking/bivouac suggestions (hand-written or proposed via the MCP tool).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE ra_suggestion (id INT AUTO_INCREMENT NOT NULL, author_id INT NOT NULL, name VARCHAR(255) NOT NULL, type INT NOT NULL, difficulty INT NOT NULL, description LONGTEXT DEFAULT NULL, location VARCHAR(255) DEFAULT NULL, distance_km DOUBLE PRECISION DEFAULT NULL, elevation_gain_m INT DEFAULT NULL, altitude_max_m INT DEFAULT NULL, duration_minutes INT DEFAULT NULL, points_of_interest JSON NOT NULL COMMENT \'(DC2Type:json)\', photo_urls JSON NOT NULL COMMENT \'(DC2Type:json)\', source_url VARCHAR(2048) DEFAULT NULL, park_rules LONGTEXT DEFAULT NULL, travel_time_from_peyrolles_minutes INT DEFAULT NULL, travel_budget INT DEFAULT NULL, rando_budget INT DEFAULT NULL, created_at DATETIME NOT NULL, INDEX IDX_RA_SUGGESTION_AUTHOR (author_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE ra_suggestion ADD CONSTRAINT FK_RA_SUGGESTION_AUTHOR FOREIGN KEY (author_id) REFERENCES user (id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE ra_suggestion DROP FOREIGN KEY FK_RA_SUGGESTION_AUTHOR');
        $this->addSql('DROP TABLE ra_suggestion');
    }
}
