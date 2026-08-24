<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Adds a composite index on cr_trade(user_id, trade_at): every query CrTradeReplayService/
 * CrTradeRepository now runs filters by user and orders by trade_at, and the table was growing
 * unbounded with only the FK's own index on user_id. Doesn't touch the unrelated ph_share_link
 * index-name drift make:migration also detected (pre-existing, not caused by this change).
 */
final class Version20260824173451 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add cr_trade(user_id, trade_at) composite index.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE INDEX idx_cr_trade_user_trade_at ON cr_trade (user_id, trade_at)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX idx_cr_trade_user_trade_at ON cr_trade');
    }
}
