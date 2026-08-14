<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Stores cr_trade.total_real/total (the EUR amounts) as integer cents instead of DOUBLE, to remove
 * float rounding drift, following the same convention as bu_item/bu_category/bu_recurrent (see
 * Version20260807180439). fromNbToken/toNbToken/fromPrice/toPrice/costPrice are intentionally left
 * as DOUBLE: they hold crypto token quantities and unit prices that need more than 2 decimal places
 * of precision, so the cents scheme does not apply to them.
 *
 * Each column is converted via a temporary column rather than a plain type change, because MySQL's
 * implicit DOUBLE -> INT cast truncates the value (19.99 -> 19) instead of multiplying by 100.
 */
final class Version20260809190125 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Convert cr_trade.total_real/total from DOUBLE (euros) to INT (cents).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE cr_trade ADD total_real_cents INT DEFAULT NULL');
        $this->addSql('UPDATE cr_trade SET total_real_cents = ROUND(total_real * 100)');
        $this->addSql('ALTER TABLE cr_trade DROP total_real');
        $this->addSql('ALTER TABLE cr_trade CHANGE total_real_cents total_real INT NOT NULL');

        $this->addSql('ALTER TABLE cr_trade ADD total_cents INT DEFAULT NULL');
        $this->addSql('UPDATE cr_trade SET total_cents = ROUND(total * 100)');
        $this->addSql('ALTER TABLE cr_trade DROP total');
        $this->addSql('ALTER TABLE cr_trade CHANGE total_cents total INT NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE cr_trade ADD total_real_euros DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('UPDATE cr_trade SET total_real_euros = total_real / 100');
        $this->addSql('ALTER TABLE cr_trade DROP total_real');
        $this->addSql('ALTER TABLE cr_trade CHANGE total_real_euros total_real DOUBLE PRECISION NOT NULL');

        $this->addSql('ALTER TABLE cr_trade ADD total_euros DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('UPDATE cr_trade SET total_euros = total / 100');
        $this->addSql('ALTER TABLE cr_trade DROP total');
        $this->addSql('ALTER TABLE cr_trade CHANGE total_euros total DOUBLE PRECISION NOT NULL');
    }
}
