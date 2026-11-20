<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261104190915 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE in_enveloppe (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, name VARCHAR(255) NOT NULL, type INT NOT NULL, bu_category_id INT DEFAULT NULL, tax_exempt_date DATE DEFAULT NULL, notes LONGTEXT DEFAULT NULL, position INT NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_F91604FFA76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE in_line (id INT AUTO_INCREMENT NOT NULL, enveloppe_id INT NOT NULL, name VARCHAR(255) NOT NULL, isin VARCHAR(20) DEFAULT NULL, target_allocation_pct DOUBLE PRECISION DEFAULT NULL, position INT NOT NULL, notes LONGTEXT DEFAULT NULL, INDEX IDX_FBAF8B92B9972E98 (enveloppe_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE in_snapshot (id INT AUTO_INCREMENT NOT NULL, line_id INT NOT NULL, date DATE NOT NULL, value INT NOT NULL, INDEX IDX_6BB469694D7B7542 (line_id), UNIQUE INDEX uniq_in_snapshot_line_date (line_id, date), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE in_enveloppe ADD CONSTRAINT FK_F91604FFA76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE in_line ADD CONSTRAINT FK_FBAF8B92B9972E98 FOREIGN KEY (enveloppe_id) REFERENCES in_enveloppe (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE in_snapshot ADD CONSTRAINT FK_6BB469694D7B7542 FOREIGN KEY (line_id) REFERENCES in_line (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE in_enveloppe DROP FOREIGN KEY FK_F91604FFA76ED395');
        $this->addSql('ALTER TABLE in_line DROP FOREIGN KEY FK_FBAF8B92B9972E98');
        $this->addSql('ALTER TABLE in_snapshot DROP FOREIGN KEY FK_6BB469694D7B7542');
        $this->addSql('DROP TABLE in_enveloppe');
        $this->addSql('DROP TABLE in_line');
        $this->addSql('DROP TABLE in_snapshot');
    }
}
