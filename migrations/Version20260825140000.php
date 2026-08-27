<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Fixes cr_trade.total_real/total for Coinbase Pro-imported Vente (sell) rows. The import formula
 * computed total_real by subtracting cost_price from Coinbase's raw CSV "Total" column — but for a
 * sell, that raw column is already the real fee-affected amount received (Size*Price - Fee), so
 * subtracting the fee a second time under-reported total_real by exactly the fee. Since
 * CrTaxReportService::getTotalReal() feeds "Prix de cession", this under-reported capital gains on
 * every affected sale. See CoinbaseProFillsParser.php for the corrected forward-import logic.
 *
 * NB: the Achat side of the same formula turned out to have the same bug in the opposite direction
 * (total_real/total simply swapped relative to the rule established here) — fixed separately by
 * Version20260825160000, not by this migration.
 *
 *   total_real (old, wrong) = raw_total - fee        total (old) = raw_total
 *   total_real (new)        = raw_total = total (old) total (new) = total_real (new) + fee
 */
final class Version20260825140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Fix cr_trade totalReal/total for Coinbase Pro Vente imports (fee was subtracted twice).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(
            'UPDATE cr_trade
             SET total_real = total,
                 total = total + ROUND(cost_price * 100)
             WHERE imported_from = :source AND type = :vente AND cost_coin = :eur',
            ['source' => 'Coinbase Pro', 'vente' => 1, 'eur' => 'EUR']
        );
    }

    public function down(Schema $schema): void
    {
        $this->addSql(
            'UPDATE cr_trade
             SET total = total_real,
                 total_real = total_real - ROUND(cost_price * 100)
             WHERE imported_from = :source AND type = :vente AND cost_coin = :eur',
            ['source' => 'Coinbase Pro', 'vente' => 1, 'eur' => 'EUR']
        );
    }
}
