<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260819191305 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE cr_import_log (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, source VARCHAR(100) NOT NULL, via VARCHAR(10) NOT NULL, file_name VARCHAR(255) DEFAULT NULL, imported_count INT NOT NULL, duplicates_count INT NOT NULL, errors_count INT NOT NULL, errors JSON DEFAULT NULL COMMENT \'(DC2Type:json)\', created_at DATETIME NOT NULL, INDEX IDX_67A266A8A76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE cr_import_log ADD CONSTRAINT FK_67A266A8A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE cr_import_log DROP FOREIGN KEY FK_67A266A8A76ED395');
        $this->addSql('DROP TABLE cr_import_log');
    }
}
