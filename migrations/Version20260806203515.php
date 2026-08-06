<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260806203515 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add composite indexes (user_id, year) and (user_id, type) on bu_item to speed up the budget planner queries.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE INDEX idx_bu_item_user_year ON bu_item (user_id, year)');
        $this->addSql('CREATE INDEX idx_bu_item_user_type ON bu_item (user_id, type)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX idx_bu_item_user_year ON bu_item');
        $this->addSql('DROP INDEX idx_bu_item_user_type ON bu_item');
    }
}
