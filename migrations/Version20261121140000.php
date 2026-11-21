<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261121140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Drive: sub-folders (dr_album.parent_id).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE dr_album ADD parent_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE dr_album ADD CONSTRAINT FK_48169356727ACA70 FOREIGN KEY (parent_id) REFERENCES dr_album (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_48169356727ACA70 ON dr_album (parent_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE dr_album DROP FOREIGN KEY FK_48169356727ACA70');
        $this->addSql('DROP INDEX IDX_48169356727ACA70 ON dr_album');
        $this->addSql('ALTER TABLE dr_album DROP parent_id');
    }
}
