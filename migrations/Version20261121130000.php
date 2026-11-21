<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261121130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Drive: folders (dr_album) and dr_file.album_id (ON DELETE SET NULL: deleting a folder keeps its files).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE dr_album (id INT AUTO_INCREMENT NOT NULL, owner_id INT NOT NULL, name VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_481693567E3C61F9 (owner_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE dr_album ADD CONSTRAINT FK_481693567E3C61F9 FOREIGN KEY (owner_id) REFERENCES user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE dr_file ADD album_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE dr_file ADD CONSTRAINT FK_B3E7AA541137ABCF FOREIGN KEY (album_id) REFERENCES dr_album (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_B3E7AA541137ABCF ON dr_file (album_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE dr_file DROP FOREIGN KEY FK_B3E7AA541137ABCF');
        $this->addSql('DROP INDEX IDX_B3E7AA541137ABCF ON dr_file');
        $this->addSql('ALTER TABLE dr_file DROP album_id');
        $this->addSql('DROP TABLE dr_album');
    }
}
