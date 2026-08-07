<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Stores budget money amounts as integer cents instead of DOUBLE, to remove float rounding drift
 * from storage and from BudgetService's monthly/yearly summation.
 *
 * Each column is converted via a temporary column rather than a plain type change, because MySQL's
 * implicit DOUBLE -> INT cast truncates the value (19.99 -> 19) instead of multiplying by 100.
 */
final class Version20260807180439 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Convert bu_item.price/recurrence_price, bu_category.goal, bu_recurrent.price and user.budget_init from DOUBLE (euros) to INT (cents).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE bu_item ADD price_cents INT DEFAULT NULL');
        $this->addSql('UPDATE bu_item SET price_cents = ROUND(price * 100)');
        $this->addSql('ALTER TABLE bu_item DROP price');
        $this->addSql('ALTER TABLE bu_item CHANGE price_cents price INT NOT NULL');

        $this->addSql('ALTER TABLE bu_item ADD recurrence_price_cents INT DEFAULT NULL');
        $this->addSql('UPDATE bu_item SET recurrence_price_cents = ROUND(recurrence_price * 100) WHERE recurrence_price IS NOT NULL');
        $this->addSql('ALTER TABLE bu_item DROP recurrence_price');
        $this->addSql('ALTER TABLE bu_item CHANGE recurrence_price_cents recurrence_price INT DEFAULT NULL');

        $this->addSql('ALTER TABLE bu_category ADD goal_cents INT DEFAULT NULL');
        $this->addSql('UPDATE bu_category SET goal_cents = ROUND(goal * 100) WHERE goal IS NOT NULL');
        $this->addSql('ALTER TABLE bu_category DROP goal');
        $this->addSql('ALTER TABLE bu_category CHANGE goal_cents goal INT DEFAULT NULL');

        $this->addSql('ALTER TABLE bu_recurrent ADD price_cents INT DEFAULT NULL');
        $this->addSql('UPDATE bu_recurrent SET price_cents = ROUND(price * 100)');
        $this->addSql('ALTER TABLE bu_recurrent DROP price');
        $this->addSql('ALTER TABLE bu_recurrent CHANGE price_cents price INT NOT NULL');

        $this->addSql('ALTER TABLE user ADD budget_init_cents INT DEFAULT NULL');
        $this->addSql('UPDATE user SET budget_init_cents = ROUND(budget_init * 100) WHERE budget_init IS NOT NULL');
        $this->addSql('ALTER TABLE user DROP budget_init');
        $this->addSql('ALTER TABLE user CHANGE budget_init_cents budget_init INT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE bu_item ADD price_euros DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('UPDATE bu_item SET price_euros = price / 100');
        $this->addSql('ALTER TABLE bu_item DROP price');
        $this->addSql('ALTER TABLE bu_item CHANGE price_euros price DOUBLE PRECISION NOT NULL');

        $this->addSql('ALTER TABLE bu_item ADD recurrence_price_euros DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('UPDATE bu_item SET recurrence_price_euros = recurrence_price / 100 WHERE recurrence_price IS NOT NULL');
        $this->addSql('ALTER TABLE bu_item DROP recurrence_price');
        $this->addSql('ALTER TABLE bu_item CHANGE recurrence_price_euros recurrence_price DOUBLE PRECISION DEFAULT NULL');

        $this->addSql('ALTER TABLE bu_category ADD goal_euros DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('UPDATE bu_category SET goal_euros = goal / 100 WHERE goal IS NOT NULL');
        $this->addSql('ALTER TABLE bu_category DROP goal');
        $this->addSql('ALTER TABLE bu_category CHANGE goal_euros goal DOUBLE PRECISION DEFAULT NULL');

        $this->addSql('ALTER TABLE bu_recurrent ADD price_euros DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('UPDATE bu_recurrent SET price_euros = price / 100');
        $this->addSql('ALTER TABLE bu_recurrent DROP price');
        $this->addSql('ALTER TABLE bu_recurrent CHANGE price_euros price DOUBLE PRECISION NOT NULL');

        $this->addSql('ALTER TABLE user ADD budget_init_euros DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('UPDATE user SET budget_init_euros = budget_init / 100 WHERE budget_init IS NOT NULL');
        $this->addSql('ALTER TABLE user DROP budget_init');
        $this->addSql('ALTER TABLE user CHANGE budget_init_euros budget_init DOUBLE PRECISION DEFAULT NULL');
    }
}
