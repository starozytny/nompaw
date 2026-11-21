<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261121110000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Drive: public share token on dr_file.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE dr_file ADD share_token VARCHAR(64) DEFAULT NULL');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_B3E7AA54D6594DD6 ON dr_file (share_token)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX UNIQ_B3E7AA54D6594DD6 ON dr_file');
        $this->addSql('ALTER TABLE dr_file DROP share_token');
    }
}
