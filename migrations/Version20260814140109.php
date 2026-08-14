<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260814140109 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE ph_access_token (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, token VARCHAR(64) NOT NULL, label VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', last_used_at DATETIME DEFAULT NULL, revoked_at DATETIME DEFAULT NULL, expires_at DATETIME DEFAULT NULL, UNIQUE INDEX UNIQ_8D86B1175F37A13B (token), INDEX IDX_8D86B117A76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE ph_album (id INT AUTO_INCREMENT NOT NULL, author_id INT NOT NULL, cover_id INT DEFAULT NULL, name VARCHAR(255) NOT NULL, description VARCHAR(1000) DEFAULT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_73496F07F675F31B (author_id), INDEX IDX_73496F07922726E9 (cover_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE ph_media (id INT AUTO_INCREMENT NOT NULL, author_id INT NOT NULL, album_id INT DEFAULT NULL, file VARCHAR(255) NOT NULL, thumbs VARCHAR(255) NOT NULL, lightbox VARCHAR(255) DEFAULT NULL, m_time INT DEFAULT NULL, type INT NOT NULL, taken_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_20FDA048F675F31B (author_id), INDEX IDX_20FDA0481137ABCF (album_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE ph_access_token ADD CONSTRAINT FK_8D86B117A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE ph_album ADD CONSTRAINT FK_73496F07F675F31B FOREIGN KEY (author_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE ph_album ADD CONSTRAINT FK_73496F07922726E9 FOREIGN KEY (cover_id) REFERENCES ph_media (id)');
        $this->addSql('ALTER TABLE ph_media ADD CONSTRAINT FK_20FDA048F675F31B FOREIGN KEY (author_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE ph_media ADD CONSTRAINT FK_20FDA0481137ABCF FOREIGN KEY (album_id) REFERENCES ph_album (id)');
        $this->addSql('ALTER TABLE user ADD photos_only TINYINT(1) NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE ph_access_token DROP FOREIGN KEY FK_8D86B117A76ED395');
        $this->addSql('ALTER TABLE ph_album DROP FOREIGN KEY FK_73496F07F675F31B');
        $this->addSql('ALTER TABLE ph_album DROP FOREIGN KEY FK_73496F07922726E9');
        $this->addSql('ALTER TABLE ph_media DROP FOREIGN KEY FK_20FDA048F675F31B');
        $this->addSql('ALTER TABLE ph_media DROP FOREIGN KEY FK_20FDA0481137ABCF');
        $this->addSql('DROP TABLE ph_access_token');
        $this->addSql('DROP TABLE ph_album');
        $this->addSql('DROP TABLE ph_media');
        $this->addSql('ALTER TABLE user DROP photos_only');
    }
}
