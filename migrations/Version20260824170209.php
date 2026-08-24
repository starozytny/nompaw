<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Makes cr_trade.total_real/total nullable: they're required for every trade type except Transfert,
 * whose validation is now enforced conditionally by CrTrade::validateAmounts() instead of a DB-level
 * NOT NULL. Doesn't touch the unrelated ph_share_link index-name drift make:migration also detected
 * (pre-existing, not caused by this change).
 */
final class Version20260824170209 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Make cr_trade.total_real/total nullable (optional for Transfert trades).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE cr_trade CHANGE total_real total_real INT DEFAULT NULL, CHANGE total total INT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('UPDATE cr_trade SET total_real = 0 WHERE total_real IS NULL');
        $this->addSql('UPDATE cr_trade SET total = 0 WHERE total IS NULL');
        $this->addSql('ALTER TABLE cr_trade CHANGE total_real total_real INT NOT NULL, CHANGE total total INT NOT NULL');
    }
}
