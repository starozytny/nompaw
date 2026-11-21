<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261121100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Adds the Drive section: dr_file table and user.drive_quota (250 Mo by default).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE dr_file (id INT AUTO_INCREMENT NOT NULL, owner_id INT NOT NULL, name VARCHAR(255) NOT NULL, file VARCHAR(255) NOT NULL, mime VARCHAR(255) DEFAULT NULL, size BIGINT NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_B3E7AA547E3C61F9 (owner_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE dr_file ADD CONSTRAINT FK_DR_FILE_OWNER FOREIGN KEY (owner_id) REFERENCES user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE user ADD drive_quota BIGINT DEFAULT 262144000 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE dr_file');
        $this->addSql('ALTER TABLE user DROP drive_quota');
    }
}
