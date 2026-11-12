<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Dépôt & consultation publics d'un album d'aventure (mot de passe par rando).
 * - ra_rando : jeton d'URL + hash du mot de passe + activation
 * - ra_image : auteur nullable (dépôts invités) + nom de l'invité
 */
final class Version20260901190622 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Aventures: public deposit/share album (deposit token + password on ra_rando, guest author on ra_image)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE ra_image ADD guest_name VARCHAR(255) DEFAULT NULL, CHANGE author_id author_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE ra_rando ADD deposit_token VARCHAR(64) DEFAULT NULL, ADD deposit_password VARCHAR(255) DEFAULT NULL, ADD deposit_enabled TINYINT(1) NOT NULL DEFAULT 0');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_C513A37ED561BCE0 ON ra_rando (deposit_token)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX UNIQ_C513A37ED561BCE0 ON ra_rando');
        $this->addSql('ALTER TABLE ra_rando DROP deposit_token, DROP deposit_password, DROP deposit_enabled');
        $this->addSql('ALTER TABLE ra_image DROP guest_name, CHANGE author_id author_id INT NOT NULL');
    }
}
