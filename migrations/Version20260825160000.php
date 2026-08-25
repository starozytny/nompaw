<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Fixes cr_trade.total_real/total for Coinbase Pro-imported Achat (buy) rows, mirroring
 * Version20260825140000's fix for Vente. That migration established the rule that totalReal must always
 * hold Coinbase's raw "Total" figure (the real fee-affected cash movement) and total must always hold the
 * fee-free reference (Size*Price), for every type consistently — but its own docblock still assumed the
 * pre-existing Achat formula was correct, so only Vente rows got swapped. They weren't: the old Achat
 * formula stored total_real = raw_total - fee (the fee-free reference, wrong field) and total = raw_total
 * (the real amount, wrong field) — the two fields were simply swapped relative to the now-established rule.
 *
 *   total_real (old, wrong) = raw_total - fee   total (old, wrong) = raw_total
 *   total_real (new)        = raw_total = total (old)   total (new) = total_real (new) - fee
 */
final class Version20260825160000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Fix cr_trade totalReal/total for Coinbase Pro Achat imports (fields were swapped).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(
            'UPDATE cr_trade
             SET total_real = total,
                 total = total - ROUND(cost_price * 100)
             WHERE imported_from = :source AND type = :achat AND cost_coin = :eur',
            ['source' => 'Coinbase Pro', 'achat' => 0, 'eur' => 'EUR']
        );
    }

    public function down(Schema $schema): void
    {
        $this->addSql(
            'UPDATE cr_trade
             SET total_real = total,
                 total = total + ROUND(cost_price * 100)
             WHERE imported_from = :source AND type = :achat AND cost_coin = :eur',
            ['source' => 'Coinbase Pro', 'achat' => 0, 'eur' => 'EUR']
        );
    }
}
