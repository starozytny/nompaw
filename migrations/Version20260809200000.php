<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Adds the tables/columns needed for the crypto tax report (CrTaxReportService): a persistent
 * coin/date price cache (cr_price_history) and two nullable columns on cr_trade for the manual
 * portfolio-value override. Unlike Version20260809190125, this is a plain additive migration
 * (new nullable columns / new table) — no existing data is reinterpreted, so no temp-column dance.
 */
final class Version20260809200000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add cr_price_history table and cr_trade manual_portfolio_value_total/portfolio_value_source columns for the crypto tax report.';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE cr_price_history (id INT AUTO_INCREMENT NOT NULL, coin VARCHAR(10) NOT NULL, price_date DATE NOT NULL, price_eur DOUBLE PRECISION NOT NULL, source VARCHAR(20) NOT NULL, fetched_at DATETIME NOT NULL, UNIQUE INDEX uniq_cr_price_history_coin_date (coin, price_date), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE cr_trade ADD manual_portfolio_value_total INT DEFAULT NULL, ADD portfolio_value_source VARCHAR(20) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE cr_price_history');
        $this->addSql('ALTER TABLE cr_trade DROP manual_portfolio_value_total, DROP portfolio_value_source');
    }
}
