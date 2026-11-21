<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261121160000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Drive: shared folders (dr_album_member: viewer/editor).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE dr_album_member (id INT AUTO_INCREMENT NOT NULL, album_id INT NOT NULL, user_id INT NOT NULL, role VARCHAR(10) NOT NULL, INDEX IDX_E320B76B1137ABCF (album_id), INDEX IDX_E320B76BA76ED395 (user_id), UNIQUE INDEX UNIQ_E320B76B1137ABCFA76ED395 (album_id, user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE dr_album_member ADD CONSTRAINT FK_E320B76B1137ABCF FOREIGN KEY (album_id) REFERENCES dr_album (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE dr_album_member ADD CONSTRAINT FK_E320B76BA76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE dr_album_member');
    }
}
