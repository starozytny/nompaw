<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260815102602 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute ph_share_link pour les liens de partage publics scopés à une photo ou un album.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE ph_share_link (id INT AUTO_INCREMENT NOT NULL, media_id INT DEFAULT NULL, album_id INT DEFAULT NULL, created_by_id INT NOT NULL, token VARCHAR(64) NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', expires_at DATETIME NOT NULL, revoked_at DATETIME DEFAULT NULL, last_viewed_at DATETIME DEFAULT NULL, view_count INT NOT NULL, UNIQUE INDEX UNIQ_ph_share_link_token (token), INDEX IDX_ph_share_link_media (media_id), INDEX IDX_ph_share_link_album (album_id), INDEX IDX_ph_share_link_created_by (created_by_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE ph_share_link ADD CONSTRAINT FK_ph_share_link_media FOREIGN KEY (media_id) REFERENCES ph_media (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE ph_share_link ADD CONSTRAINT FK_ph_share_link_album FOREIGN KEY (album_id) REFERENCES ph_album (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE ph_share_link ADD CONSTRAINT FK_ph_share_link_created_by FOREIGN KEY (created_by_id) REFERENCES user (id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE ph_share_link DROP FOREIGN KEY FK_ph_share_link_media');
        $this->addSql('ALTER TABLE ph_share_link DROP FOREIGN KEY FK_ph_share_link_album');
        $this->addSql('ALTER TABLE ph_share_link DROP FOREIGN KEY FK_ph_share_link_created_by');
        $this->addSql('DROP TABLE ph_share_link');
    }
}
