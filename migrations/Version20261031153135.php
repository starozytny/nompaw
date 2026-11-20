<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261031153135 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE ru_activity (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, date DATE NOT NULL, km DOUBLE PRECISION NOT NULL, duration_sec INT NOT NULL, hr INT DEFAULT NULL, hr_max INT DEFAULT NULL, title VARCHAR(120) DEFAULT NULL, INDEX IDX_B9144C96A76ED395 (user_id), INDEX idx_ru_activity_user_date (user_id, date), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE ru_log (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, date DATE NOT NULL, km DOUBLE PRECISION DEFAULT NULL, duration_sec INT DEFAULT NULL, hr INT DEFAULT NULL, hr_max INT DEFAULT NULL, rpe INT DEFAULT NULL, note LONGTEXT DEFAULT NULL, done TINYINT(1) NOT NULL, source VARCHAR(10) DEFAULT NULL, title VARCHAR(120) DEFAULT NULL, INDEX IDX_250ACCF5A76ED395 (user_id), UNIQUE INDEX uniq_ru_log_user_date (user_id, date), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE ru_weight (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, date DATE NOT NULL, kg DOUBLE PRECISION NOT NULL, INDEX IDX_BF7E0DB5A76ED395 (user_id), UNIQUE INDEX uniq_ru_weight_user_date (user_id, date), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE ru_activity ADD CONSTRAINT FK_B9144C96A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE ru_log ADD CONSTRAINT FK_250ACCF5A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE ru_weight ADD CONSTRAINT FK_BF7E0DB5A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE cr_foreign_account RENAME INDEX idx_cr_foreign_account_user TO IDX_ACE6D6BEA76ED395');
        $this->addSql('ALTER TABLE ph_share_link RENAME INDEX uniq_ph_share_link_token TO UNIQ_1879F50C5F37A13B');
        $this->addSql('ALTER TABLE ph_share_link RENAME INDEX idx_ph_share_link_media TO IDX_1879F50CEA9FDD75');
        $this->addSql('ALTER TABLE ph_share_link RENAME INDEX idx_ph_share_link_album TO IDX_1879F50C1137ABCF');
        $this->addSql('ALTER TABLE ph_share_link RENAME INDEX idx_ph_share_link_created_by TO IDX_1879F50CB03A8386');
        $this->addSql('ALTER TABLE user ADD running_notes LONGTEXT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE ru_activity DROP FOREIGN KEY FK_B9144C96A76ED395');
        $this->addSql('ALTER TABLE ru_log DROP FOREIGN KEY FK_250ACCF5A76ED395');
        $this->addSql('ALTER TABLE ru_weight DROP FOREIGN KEY FK_BF7E0DB5A76ED395');
        $this->addSql('DROP TABLE ru_activity');
        $this->addSql('DROP TABLE ru_log');
        $this->addSql('DROP TABLE ru_weight');
        $this->addSql('ALTER TABLE user DROP running_notes');
        $this->addSql('ALTER TABLE cr_foreign_account RENAME INDEX idx_ace6d6bea76ed395 TO IDX_CR_FOREIGN_ACCOUNT_USER');
        $this->addSql('ALTER TABLE ph_share_link RENAME INDEX idx_1879f50cb03a8386 TO IDX_ph_share_link_created_by');
        $this->addSql('ALTER TABLE ph_share_link RENAME INDEX uniq_1879f50c5f37a13b TO UNIQ_ph_share_link_token');
        $this->addSql('ALTER TABLE ph_share_link RENAME INDEX idx_1879f50cea9fdd75 TO IDX_ph_share_link_media');
        $this->addSql('ALTER TABLE ph_share_link RENAME INDEX idx_1879f50c1137abcf TO IDX_ph_share_link_album');
    }
}
