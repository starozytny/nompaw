<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Creates cr_foreign_account, backing the 3916-BIS account declaration (separate from the 2086
 * capital-gains report): one row per foreign crypto platform the user holds, auto-seeded from
 * cr_trade.imported_from by CrForeignAccountService::sync() and then freely editable.
 */
final class Version20260825150000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create cr_foreign_account table for the 3916-BIS account declaration.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            CREATE TABLE cr_foreign_account (
                id INT AUTO_INCREMENT NOT NULL,
                user_id INT NOT NULL,
                platform VARCHAR(255) NOT NULL,
                source_imported_from VARCHAR(255) DEFAULT NULL,
                account_identifier VARCHAR(255) DEFAULT NULL,
                address VARCHAR(500) DEFAULT NULL,
                opened_at DATE DEFAULT NULL,
                closed_at DATE DEFAULT NULL,
                notes LONGTEXT DEFAULT NULL,
                UNIQUE INDEX uniq_cr_foreign_account_user_source (user_id, source_imported_from),
                INDEX IDX_CR_FOREIGN_ACCOUNT_USER (user_id),
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);

        $this->addSql('ALTER TABLE cr_foreign_account ADD CONSTRAINT FK_CR_FOREIGN_ACCOUNT_USER FOREIGN KEY (user_id) REFERENCES user (id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE cr_foreign_account');
    }
}
