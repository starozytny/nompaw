<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260819144527 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE cr_kraken_credential (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, api_key VARCHAR(255) NOT NULL, api_secret_encrypted LONGTEXT NOT NULL, connected_at DATETIME NOT NULL, last_synced_at DATETIME DEFAULT NULL, last_sync_error VARCHAR(255) DEFAULT NULL, UNIQUE INDEX UNIQ_98D67CA8A76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE cr_kraken_credential ADD CONSTRAINT FK_98D67CA8A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE cr_kraken_credential DROP FOREIGN KEY FK_98D67CA8A76ED395');
        $this->addSql('DROP TABLE cr_kraken_credential');
    }
}
