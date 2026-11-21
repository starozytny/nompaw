<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261121150000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Drive: file shortcuts (dr_shortcut).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE dr_shortcut (id INT AUTO_INCREMENT NOT NULL, owner_id INT NOT NULL, file_id INT NOT NULL, album_id INT DEFAULT NULL, INDEX IDX_9F076FA17E3C61F9 (owner_id), INDEX IDX_9F076FA193CB796C (file_id), INDEX IDX_9F076FA11137ABCF (album_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE dr_shortcut ADD CONSTRAINT FK_9F076FA17E3C61F9 FOREIGN KEY (owner_id) REFERENCES user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE dr_shortcut ADD CONSTRAINT FK_9F076FA193CB796C FOREIGN KEY (file_id) REFERENCES dr_file (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE dr_shortcut ADD CONSTRAINT FK_9F076FA11137ABCF FOREIGN KEY (album_id) REFERENCES dr_album (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE dr_shortcut');
    }
}
