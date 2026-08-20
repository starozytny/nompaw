<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Drops 8 orphaned tables with no corresponding entity anywhere in src/: the recipes module
 * (co_recipe, co_step, co_ingredient, co_commentary, co_favorite), a FAQ module (he_question,
 * he_category) and a Firebase push-token table (fi_token) tied to birthdays.
 *
 * down() only recreates the schema, not the deleted rows — this is not a data-preserving rollback.
 */
final class Version20260807184931 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Drop the orphaned co_*/he_*/fi_token tables (removed recipes, FAQ and birthday push-token features with no remaining code).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE co_commentary DROP FOREIGN KEY FK_F2EB5035A76ED395');
        $this->addSql('ALTER TABLE co_commentary DROP FOREIGN KEY FK_F2EB503559D8A214');
        $this->addSql('ALTER TABLE co_favorite DROP FOREIGN KEY FK_2251C13FA76ED395');
        $this->addSql('ALTER TABLE co_ingredient DROP FOREIGN KEY FK_85E83A8F59D8A214');
        $this->addSql('ALTER TABLE co_recipe DROP FOREIGN KEY FK_34FB9212F675F31B');
        $this->addSql('ALTER TABLE co_step DROP FOREIGN KEY FK_62E4DB359D8A214');
        $this->addSql('ALTER TABLE he_question DROP FOREIGN KEY FK_C860112512469DE2');

        $this->addSql('DROP TABLE co_commentary');
        $this->addSql('DROP TABLE co_favorite');
        $this->addSql('DROP TABLE co_ingredient');
        $this->addSql('DROP TABLE co_step');
        $this->addSql('DROP TABLE co_recipe');
        $this->addSql('DROP TABLE he_question');
        $this->addSql('DROP TABLE he_category');
        $this->addSql('DROP TABLE fi_token');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('CREATE TABLE co_recipe (id INT AUTO_INCREMENT NOT NULL, author_id INT NOT NULL, name VARCHAR(255) NOT NULL, status INT NOT NULL, content LONGTEXT DEFAULT NULL, duration_prepare DATETIME DEFAULT NULL, duration_cooking DATETIME DEFAULT NULL, difficulty INT NOT NULL, nb_person INT DEFAULT NULL, slug VARCHAR(255) NOT NULL, image VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', updated_at DATETIME DEFAULT NULL, INDEX IDX_34FB9212F675F31B (author_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE co_step (id INT AUTO_INCREMENT NOT NULL, recipe_id INT NOT NULL, position INT NOT NULL, content LONGTEXT NOT NULL, image0 VARCHAR(255) DEFAULT NULL, image1 VARCHAR(255) DEFAULT NULL, image2 VARCHAR(255) DEFAULT NULL, INDEX IDX_62E4DB359D8A214 (recipe_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE co_ingredient (id INT AUTO_INCREMENT NOT NULL, recipe_id INT NOT NULL, nombre DOUBLE PRECISION DEFAULT NULL, unit VARCHAR(255) DEFAULT NULL, name VARCHAR(255) NOT NULL, INDEX IDX_85E83A8F59D8A214 (recipe_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE co_commentary (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, recipe_id INT NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', message LONGTEXT NOT NULL, answer_to INT DEFAULT NULL, rate INT NOT NULL, INDEX IDX_F2EB5035A76ED395 (user_id), INDEX IDX_F2EB503559D8A214 (recipe_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE co_favorite (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, identifiant INT NOT NULL, INDEX IDX_2251C13FA76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE he_category (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, icon VARCHAR(255) NOT NULL, visibility INT NOT NULL, subtitle VARCHAR(255) DEFAULT NULL, rank INT NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE he_question (id INT AUTO_INCREMENT NOT NULL, category_id INT NOT NULL, name VARCHAR(255) NOT NULL, content LONGTEXT NOT NULL, INDEX IDX_C860112512469DE2 (category_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE fi_token (id INT AUTO_INCREMENT NOT NULL, token VARCHAR(255) NOT NULL, birthday_id INT DEFAULT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('ALTER TABLE co_step ADD CONSTRAINT FK_62E4DB359D8A214 FOREIGN KEY (recipe_id) REFERENCES co_recipe (id)');
        $this->addSql('ALTER TABLE co_ingredient ADD CONSTRAINT FK_85E83A8F59D8A214 FOREIGN KEY (recipe_id) REFERENCES co_recipe (id)');
        $this->addSql('ALTER TABLE co_commentary ADD CONSTRAINT FK_F2EB5035A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE co_commentary ADD CONSTRAINT FK_F2EB503559D8A214 FOREIGN KEY (recipe_id) REFERENCES co_recipe (id)');
        $this->addSql('ALTER TABLE co_favorite ADD CONSTRAINT FK_2251C13FA76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE co_recipe ADD CONSTRAINT FK_34FB9212F675F31B FOREIGN KEY (author_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE he_question ADD CONSTRAINT FK_C860112512469DE2 FOREIGN KEY (category_id) REFERENCES he_category (id)');
    }
}
