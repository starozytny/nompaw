<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260815103842 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE ph_share_link (id INT AUTO_INCREMENT NOT NULL, media_id INT DEFAULT NULL, album_id INT DEFAULT NULL, created_by_id INT NOT NULL, token VARCHAR(64) NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', expires_at DATETIME NOT NULL, revoked_at DATETIME DEFAULT NULL, last_viewed_at DATETIME DEFAULT NULL, view_count INT NOT NULL, UNIQUE INDEX UNIQ_1879F50C5F37A13B (token), INDEX IDX_1879F50CEA9FDD75 (media_id), INDEX IDX_1879F50C1137ABCF (album_id), INDEX IDX_1879F50CB03A8386 (created_by_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE ph_share_link ADD CONSTRAINT FK_1879F50CEA9FDD75 FOREIGN KEY (media_id) REFERENCES ph_media (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE ph_share_link ADD CONSTRAINT FK_1879F50C1137ABCF FOREIGN KEY (album_id) REFERENCES ph_album (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE ph_share_link ADD CONSTRAINT FK_1879F50CB03A8386 FOREIGN KEY (created_by_id) REFERENCES user (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE ph_share_link DROP FOREIGN KEY FK_1879F50CEA9FDD75');
        $this->addSql('ALTER TABLE ph_share_link DROP FOREIGN KEY FK_1879F50C1137ABCF');
        $this->addSql('ALTER TABLE ph_share_link DROP FOREIGN KEY FK_1879F50CB03A8386');
        $this->addSql('DROP TABLE ph_share_link');
    }
}
