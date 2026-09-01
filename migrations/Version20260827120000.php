<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Adds cr_trade.manual_coin_prices: per-coin EUR unit prices entered by hand for a single disposal
 * (cession), so two disposals sharing a date can be valued independently instead of sharing the same
 * CrPriceHistory (coin, date) cache row. See CrTaxReportService / TaxReportPriceDialog.
 */
final class Version20260827120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add cr_trade.manual_coin_prices (per-cession manual token prices for the crypto tax report).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE cr_trade ADD manual_coin_prices JSON DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE cr_trade DROP manual_coin_prices');
    }
}
