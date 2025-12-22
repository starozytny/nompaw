<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251210100511 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE ag_event (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, type INT NOT NULL, start_at DATETIME NOT NULL, end_at DATETIME DEFAULT NULL, all_day TINYINT(1) NOT NULL, localisation VARCHAR(255) DEFAULT NULL, content LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE bi_birthday (id INT AUTO_INCREMENT NOT NULL, author_id INT NOT NULL, name VARCHAR(255) NOT NULL, image VARCHAR(255) DEFAULT NULL, start_at DATETIME DEFAULT NULL, time_at DATETIME DEFAULT NULL, description LONGTEXT DEFAULT NULL, slug VARCHAR(255) NOT NULL, code VARCHAR(255) NOT NULL, iframe_route LONGTEXT DEFAULT NULL, INDEX IDX_C10D5453F675F31B (author_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE bi_present (id INT AUTO_INCREMENT NOT NULL, author_id INT NOT NULL, birthday_id INT NOT NULL, guest_id INT DEFAULT NULL, name VARCHAR(255) NOT NULL, price DOUBLE PRECISION DEFAULT NULL, is_selected TINYINT(1) NOT NULL, image VARCHAR(255) DEFAULT NULL, url VARCHAR(255) DEFAULT NULL, guest_name VARCHAR(255) DEFAULT NULL, price_max DOUBLE PRECISION DEFAULT NULL, description LONGTEXT DEFAULT NULL, INDEX IDX_2A8E1BC7F675F31B (author_id), INDEX IDX_2A8E1BC7B8DB2791 (birthday_id), INDEX IDX_2A8E1BC79A4AA658 (guest_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE bu_category (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, type INT NOT NULL, name VARCHAR(255) NOT NULL, goal DOUBLE PRECISION DEFAULT NULL, INDEX IDX_BDDA98C6A76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE bu_item (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, category_id INT DEFAULT NULL, year INT NOT NULL, month INT NOT NULL, type INT NOT NULL, price DOUBLE PRECISION NOT NULL, name VARCHAR(255) NOT NULL, is_active TINYINT(1) NOT NULL, date_at DATETIME NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, recurrence_id INT DEFAULT NULL, recurrence_price DOUBLE PRECISION DEFAULT NULL, last_type INT NOT NULL, INDEX IDX_5EB6BCD8A76ED395 (user_id), INDEX IDX_5EB6BCD812469DE2 (category_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE bu_recurrent (id INT AUTO_INCREMENT NOT NULL, category_id INT DEFAULT NULL, user_id INT NOT NULL, type INT NOT NULL, price DOUBLE PRECISION NOT NULL, name VARCHAR(255) NOT NULL, months JSON NOT NULL COMMENT \'(DC2Type:json)\', init_year INT NOT NULL, init_month INT NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', updated_at DATETIME DEFAULT NULL, INDEX IDX_7F17B97512469DE2 (category_id), INDEX IDX_7F17B975A76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE changelog (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, type INT NOT NULL, is_published TINYINT(1) NOT NULL, content LONGTEXT NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE co_commentary (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, recipe_id INT NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', message LONGTEXT NOT NULL, answer_to INT DEFAULT NULL, rate INT NOT NULL, INDEX IDX_F2EB5035A76ED395 (user_id), INDEX IDX_F2EB503559D8A214 (recipe_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE co_favorite (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, identifiant INT NOT NULL, INDEX IDX_2251C13FA76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE co_ingredient (id INT AUTO_INCREMENT NOT NULL, recipe_id INT NOT NULL, nombre DOUBLE PRECISION DEFAULT NULL, unit VARCHAR(255) DEFAULT NULL, name VARCHAR(255) NOT NULL, INDEX IDX_85E83A8F59D8A214 (recipe_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE co_recipe (id INT AUTO_INCREMENT NOT NULL, author_id INT NOT NULL, name VARCHAR(255) NOT NULL, status INT NOT NULL, content LONGTEXT DEFAULT NULL, duration_prepare DATETIME DEFAULT NULL, duration_cooking DATETIME DEFAULT NULL, difficulty INT NOT NULL, nb_person INT DEFAULT NULL, slug VARCHAR(255) NOT NULL, image VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', updated_at DATETIME DEFAULT NULL, INDEX IDX_34FB9212F675F31B (author_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE co_step (id INT AUTO_INCREMENT NOT NULL, recipe_id INT NOT NULL, position INT NOT NULL, content LONGTEXT NOT NULL, image0 VARCHAR(255) DEFAULT NULL, image1 VARCHAR(255) DEFAULT NULL, image2 VARCHAR(255) DEFAULT NULL, INDEX IDX_62E4DB359D8A214 (recipe_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE contact (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, message LONGTEXT NOT NULL, created_at DATETIME NOT NULL, seen TINYINT(1) NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE cr_trade (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, trade_at DATETIME NOT NULL, type INT NOT NULL, from_coin VARCHAR(10) NOT NULL, to_coin VARCHAR(10) NOT NULL, from_price DOUBLE PRECISION NOT NULL, to_price DOUBLE PRECISION DEFAULT NULL, cost_price DOUBLE PRECISION NOT NULL, cost_coin VARCHAR(10) NOT NULL, from_nb_token DOUBLE PRECISION NOT NULL, to_nb_token DOUBLE PRECISION DEFAULT NULL, total_real DOUBLE PRECISION NOT NULL, total DOUBLE PRECISION NOT NULL, is_imported TINYINT(1) NOT NULL, imported_from VARCHAR(255) DEFAULT NULL, imported_id VARCHAR(255) DEFAULT NULL, INDEX IDX_551B76AA76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE ho_lifestyle (id INT AUTO_INCREMENT NOT NULL, project_id INT NOT NULL, name VARCHAR(255) NOT NULL, unit VARCHAR(255) DEFAULT NULL, price DOUBLE PRECISION DEFAULT NULL, price_type INT NOT NULL, INDEX IDX_EE8B02C3166D1F9C (project_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE ho_project (id INT AUTO_INCREMENT NOT NULL, author_id INT NOT NULL, propal_date_id INT DEFAULT NULL, propal_house_id INT DEFAULT NULL, name VARCHAR(255) NOT NULL, image VARCHAR(255) DEFAULT NULL, start_at DATETIME DEFAULT NULL, end_at DATETIME DEFAULT NULL, description LONGTEXT DEFAULT NULL, slug VARCHAR(255) NOT NULL, code VARCHAR(255) NOT NULL, text_route LONGTEXT DEFAULT NULL, iframe_route LONGTEXT DEFAULT NULL, price_route DOUBLE PRECISION DEFAULT NULL, text_house LONGTEXT DEFAULT NULL, text_lifestyle LONGTEXT DEFAULT NULL, text_activities LONGTEXT DEFAULT NULL, text_todos LONGTEXT DEFAULT NULL, INDEX IDX_9CB98C7DF675F31B (author_id), UNIQUE INDEX UNIQ_9CB98C7D6817B746 (propal_date_id), UNIQUE INDEX UNIQ_9CB98C7D2EB899E1 (propal_house_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE ho_propal_activity (id INT AUTO_INCREMENT NOT NULL, project_id INT NOT NULL, author_id INT NOT NULL, name VARCHAR(255) NOT NULL, votes LONGTEXT NOT NULL COMMENT \'(DC2Type:array)\', url LONGTEXT DEFAULT NULL, price DOUBLE PRECISION DEFAULT NULL, image VARCHAR(255) DEFAULT NULL, is_selected TINYINT(1) NOT NULL, price_type INT NOT NULL, description LONGTEXT DEFAULT NULL, INDEX IDX_5AFDB4DD166D1F9C (project_id), INDEX IDX_5AFDB4DDF675F31B (author_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE ho_propal_date (id INT AUTO_INCREMENT NOT NULL, project_id INT NOT NULL, author_id INT NOT NULL, start_at DATETIME NOT NULL, end_at DATETIME DEFAULT NULL, votes LONGTEXT NOT NULL COMMENT \'(DC2Type:array)\', INDEX IDX_4929C271166D1F9C (project_id), INDEX IDX_4929C271F675F31B (author_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE ho_propal_house (id INT AUTO_INCREMENT NOT NULL, project_id INT NOT NULL, author_id INT NOT NULL, name VARCHAR(255) NOT NULL, votes LONGTEXT NOT NULL COMMENT \'(DC2Type:array)\', url LONGTEXT DEFAULT NULL, price DOUBLE PRECISION DEFAULT NULL, INDEX IDX_F0E457E0166D1F9C (project_id), INDEX IDX_F0E457E0F675F31B (author_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE ho_todo (id INT AUTO_INCREMENT NOT NULL, project_id INT NOT NULL, name VARCHAR(255) NOT NULL, INDEX IDX_1D9E51D5166D1F9C (project_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE image (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, type INT NOT NULL, identifiant INT DEFAULT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE mail (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, expeditor VARCHAR(255) NOT NULL, subject VARCHAR(255) NOT NULL, destinators JSON NOT NULL COMMENT \'(DC2Type:json)\', cc JSON NOT NULL COMMENT \'(DC2Type:json)\', bcc JSON NOT NULL COMMENT \'(DC2Type:json)\', files JSON NOT NULL COMMENT \'(DC2Type:json)\', theme INT NOT NULL, is_trash TINYINT(1) NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', message LONGTEXT NOT NULL, INDEX IDX_5126AC48A76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE notification (id INT AUTO_INCREMENT NOT NULL, user_id INT DEFAULT NULL, name VARCHAR(255) NOT NULL, icon VARCHAR(40) NOT NULL, created_at DATETIME NOT NULL, is_seen TINYINT(1) NOT NULL, url VARCHAR(255) DEFAULT NULL, INDEX IDX_BF5476CAA76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE ra_groupe (id INT AUTO_INCREMENT NOT NULL, author_id INT NOT NULL, name VARCHAR(255) NOT NULL, is_visible TINYINT(1) NOT NULL, level INT NOT NULL, description LONGTEXT DEFAULT NULL, slug VARCHAR(255) NOT NULL, image VARCHAR(255) DEFAULT NULL, INDEX IDX_44FBEB04F675F31B (author_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE ra_image (id INT AUTO_INCREMENT NOT NULL, author_id INT NOT NULL, rando_id INT NOT NULL, file VARCHAR(255) NOT NULL, thumbs VARCHAR(255) NOT NULL, lightbox VARCHAR(255) DEFAULT NULL, m_time INT DEFAULT NULL, type INT NOT NULL, taken_at DATETIME DEFAULT NULL, INDEX IDX_585147B5F675F31B (author_id), INDEX IDX_585147B529F4A05 (rando_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE ra_link (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, groupe_id INT NOT NULL, INDEX IDX_8898DC74A76ED395 (user_id), INDEX IDX_8898DC747A45358C (groupe_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE ra_propal_adventure (id INT AUTO_INCREMENT NOT NULL, rando_id INT NOT NULL, author_id INT NOT NULL, name VARCHAR(255) NOT NULL, votes LONGTEXT NOT NULL COMMENT \'(DC2Type:array)\', duration DATETIME DEFAULT NULL, url VARCHAR(255) DEFAULT NULL, INDEX IDX_9AD523C629F4A05 (rando_id), INDEX IDX_9AD523C6F675F31B (author_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE ra_propal_date (id INT AUTO_INCREMENT NOT NULL, rando_id INT NOT NULL, author_id INT NOT NULL, date_at DATETIME NOT NULL, votes LONGTEXT NOT NULL COMMENT \'(DC2Type:array)\', INDEX IDX_74A283629F4A05 (rando_id), INDEX IDX_74A2836F675F31B (author_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE ra_rando (id INT AUTO_INCREMENT NOT NULL, groupe_id INT NOT NULL, author_id INT NOT NULL, adventure_id INT DEFAULT NULL, adventure_date_id INT DEFAULT NULL, name VARCHAR(255) NOT NULL, start_at DATETIME DEFAULT NULL, end_at DATETIME DEFAULT NULL, status INT NOT NULL, description LONGTEXT DEFAULT NULL, is_next TINYINT(1) NOT NULL, slug VARCHAR(255) NOT NULL, level INT DEFAULT NULL, altitude INT DEFAULT NULL, dev_plus INT DEFAULT NULL, distance DOUBLE PRECISION DEFAULT NULL, cover VARCHAR(255) DEFAULT NULL, google_photos VARCHAR(255) DEFAULT NULL, story VARCHAR(255) DEFAULT NULL, INDEX IDX_C513A37E7A45358C (groupe_id), INDEX IDX_C513A37EF675F31B (author_id), UNIQUE INDEX UNIQ_C513A37E55CF40F9 (adventure_id), UNIQUE INDEX UNIQ_C513A37EED9D480F (adventure_date_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE settings (id INT AUTO_INCREMENT NOT NULL, code INT NOT NULL, website_name VARCHAR(255) NOT NULL, url_homepage VARCHAR(255) NOT NULL, email_global VARCHAR(255) NOT NULL, email_contact VARCHAR(255) NOT NULL, email_rgpd VARCHAR(255) NOT NULL, logo_mail LONGTEXT NOT NULL, multiple_database TINYINT(1) NOT NULL, prefix_database VARCHAR(255) DEFAULT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE society (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, manager VARCHAR(255) NOT NULL, dirname VARCHAR(255) NOT NULL, code VARCHAR(20) NOT NULL, is_activated TINYINT(1) NOT NULL, is_generated TINYINT(1) NOT NULL, is_blocked TINYINT(1) NOT NULL, logo VARCHAR(255) DEFAULT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE user (id INT AUTO_INCREMENT NOT NULL, society_id INT NOT NULL, username VARCHAR(180) NOT NULL, display_name VARCHAR(180) NOT NULL, roles JSON NOT NULL COMMENT \'(DC2Type:json)\', password VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, lastname VARCHAR(255) NOT NULL, firstname VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', updated_at DATETIME DEFAULT NULL, last_login_at DATETIME DEFAULT NULL, lost_code VARCHAR(255) DEFAULT NULL, lost_at DATETIME DEFAULT NULL, token VARCHAR(255) NOT NULL, avatar VARCHAR(255) DEFAULT NULL, manager VARCHAR(40) NOT NULL, is_blocked TINYINT(1) NOT NULL, google_id VARCHAR(255) DEFAULT NULL, facebook_id VARCHAR(255) DEFAULT NULL, google_access_token VARCHAR(255) DEFAULT NULL, google_refresh_token VARCHAR(255) DEFAULT NULL, google_token_expires_at DATETIME DEFAULT NULL, budget_year INT DEFAULT NULL, budget_init DOUBLE PRECISION DEFAULT NULL, UNIQUE INDEX UNIQ_8D93D649F85E0677 (username), INDEX IDX_8D93D649E6389D24 (society_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE messenger_messages (id BIGINT AUTO_INCREMENT NOT NULL, body LONGTEXT NOT NULL, headers LONGTEXT NOT NULL, queue_name VARCHAR(190) NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', available_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', delivered_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_75EA56E0FB7336F0 (queue_name), INDEX IDX_75EA56E0E3BD61CE (available_at), INDEX IDX_75EA56E016BA31DB (delivered_at), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE bi_birthday ADD CONSTRAINT FK_C10D5453F675F31B FOREIGN KEY (author_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE bi_present ADD CONSTRAINT FK_2A8E1BC7F675F31B FOREIGN KEY (author_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE bi_present ADD CONSTRAINT FK_2A8E1BC7B8DB2791 FOREIGN KEY (birthday_id) REFERENCES bi_birthday (id)');
        $this->addSql('ALTER TABLE bi_present ADD CONSTRAINT FK_2A8E1BC79A4AA658 FOREIGN KEY (guest_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE bu_category ADD CONSTRAINT FK_BDDA98C6A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE bu_item ADD CONSTRAINT FK_5EB6BCD8A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE bu_item ADD CONSTRAINT FK_5EB6BCD812469DE2 FOREIGN KEY (category_id) REFERENCES bu_category (id)');
        $this->addSql('ALTER TABLE bu_recurrent ADD CONSTRAINT FK_7F17B97512469DE2 FOREIGN KEY (category_id) REFERENCES bu_category (id)');
        $this->addSql('ALTER TABLE bu_recurrent ADD CONSTRAINT FK_7F17B975A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE co_commentary ADD CONSTRAINT FK_F2EB5035A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE co_commentary ADD CONSTRAINT FK_F2EB503559D8A214 FOREIGN KEY (recipe_id) REFERENCES co_recipe (id)');
        $this->addSql('ALTER TABLE co_favorite ADD CONSTRAINT FK_2251C13FA76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE co_ingredient ADD CONSTRAINT FK_85E83A8F59D8A214 FOREIGN KEY (recipe_id) REFERENCES co_recipe (id)');
        $this->addSql('ALTER TABLE co_recipe ADD CONSTRAINT FK_34FB9212F675F31B FOREIGN KEY (author_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE co_step ADD CONSTRAINT FK_62E4DB359D8A214 FOREIGN KEY (recipe_id) REFERENCES co_recipe (id)');
        $this->addSql('ALTER TABLE cr_trade ADD CONSTRAINT FK_551B76AA76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE ho_lifestyle ADD CONSTRAINT FK_EE8B02C3166D1F9C FOREIGN KEY (project_id) REFERENCES ho_project (id)');
        $this->addSql('ALTER TABLE ho_project ADD CONSTRAINT FK_9CB98C7DF675F31B FOREIGN KEY (author_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE ho_project ADD CONSTRAINT FK_9CB98C7D6817B746 FOREIGN KEY (propal_date_id) REFERENCES ho_propal_date (id)');
        $this->addSql('ALTER TABLE ho_project ADD CONSTRAINT FK_9CB98C7D2EB899E1 FOREIGN KEY (propal_house_id) REFERENCES ho_propal_house (id)');
        $this->addSql('ALTER TABLE ho_propal_activity ADD CONSTRAINT FK_5AFDB4DD166D1F9C FOREIGN KEY (project_id) REFERENCES ho_project (id)');
        $this->addSql('ALTER TABLE ho_propal_activity ADD CONSTRAINT FK_5AFDB4DDF675F31B FOREIGN KEY (author_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE ho_propal_date ADD CONSTRAINT FK_4929C271166D1F9C FOREIGN KEY (project_id) REFERENCES ho_project (id)');
        $this->addSql('ALTER TABLE ho_propal_date ADD CONSTRAINT FK_4929C271F675F31B FOREIGN KEY (author_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE ho_propal_house ADD CONSTRAINT FK_F0E457E0166D1F9C FOREIGN KEY (project_id) REFERENCES ho_project (id)');
        $this->addSql('ALTER TABLE ho_propal_house ADD CONSTRAINT FK_F0E457E0F675F31B FOREIGN KEY (author_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE ho_todo ADD CONSTRAINT FK_1D9E51D5166D1F9C FOREIGN KEY (project_id) REFERENCES ho_project (id)');
        $this->addSql('ALTER TABLE mail ADD CONSTRAINT FK_5126AC48A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE notification ADD CONSTRAINT FK_BF5476CAA76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE ra_groupe ADD CONSTRAINT FK_44FBEB04F675F31B FOREIGN KEY (author_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE ra_image ADD CONSTRAINT FK_585147B5F675F31B FOREIGN KEY (author_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE ra_image ADD CONSTRAINT FK_585147B529F4A05 FOREIGN KEY (rando_id) REFERENCES ra_rando (id)');
        $this->addSql('ALTER TABLE ra_link ADD CONSTRAINT FK_8898DC74A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE ra_link ADD CONSTRAINT FK_8898DC747A45358C FOREIGN KEY (groupe_id) REFERENCES ra_groupe (id)');
        $this->addSql('ALTER TABLE ra_propal_adventure ADD CONSTRAINT FK_9AD523C629F4A05 FOREIGN KEY (rando_id) REFERENCES ra_rando (id)');
        $this->addSql('ALTER TABLE ra_propal_adventure ADD CONSTRAINT FK_9AD523C6F675F31B FOREIGN KEY (author_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE ra_propal_date ADD CONSTRAINT FK_74A283629F4A05 FOREIGN KEY (rando_id) REFERENCES ra_rando (id)');
        $this->addSql('ALTER TABLE ra_propal_date ADD CONSTRAINT FK_74A2836F675F31B FOREIGN KEY (author_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE ra_rando ADD CONSTRAINT FK_C513A37E7A45358C FOREIGN KEY (groupe_id) REFERENCES ra_groupe (id)');
        $this->addSql('ALTER TABLE ra_rando ADD CONSTRAINT FK_C513A37EF675F31B FOREIGN KEY (author_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE ra_rando ADD CONSTRAINT FK_C513A37E55CF40F9 FOREIGN KEY (adventure_id) REFERENCES ra_propal_adventure (id)');
        $this->addSql('ALTER TABLE ra_rando ADD CONSTRAINT FK_C513A37EED9D480F FOREIGN KEY (adventure_date_id) REFERENCES ra_propal_date (id)');
        $this->addSql('ALTER TABLE user ADD CONSTRAINT FK_8D93D649E6389D24 FOREIGN KEY (society_id) REFERENCES society (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE bi_birthday DROP FOREIGN KEY FK_C10D5453F675F31B');
        $this->addSql('ALTER TABLE bi_present DROP FOREIGN KEY FK_2A8E1BC7F675F31B');
        $this->addSql('ALTER TABLE bi_present DROP FOREIGN KEY FK_2A8E1BC7B8DB2791');
        $this->addSql('ALTER TABLE bi_present DROP FOREIGN KEY FK_2A8E1BC79A4AA658');
        $this->addSql('ALTER TABLE bu_category DROP FOREIGN KEY FK_BDDA98C6A76ED395');
        $this->addSql('ALTER TABLE bu_item DROP FOREIGN KEY FK_5EB6BCD8A76ED395');
        $this->addSql('ALTER TABLE bu_item DROP FOREIGN KEY FK_5EB6BCD812469DE2');
        $this->addSql('ALTER TABLE bu_recurrent DROP FOREIGN KEY FK_7F17B97512469DE2');
        $this->addSql('ALTER TABLE bu_recurrent DROP FOREIGN KEY FK_7F17B975A76ED395');
        $this->addSql('ALTER TABLE co_commentary DROP FOREIGN KEY FK_F2EB5035A76ED395');
        $this->addSql('ALTER TABLE co_commentary DROP FOREIGN KEY FK_F2EB503559D8A214');
        $this->addSql('ALTER TABLE co_favorite DROP FOREIGN KEY FK_2251C13FA76ED395');
        $this->addSql('ALTER TABLE co_ingredient DROP FOREIGN KEY FK_85E83A8F59D8A214');
        $this->addSql('ALTER TABLE co_recipe DROP FOREIGN KEY FK_34FB9212F675F31B');
        $this->addSql('ALTER TABLE co_step DROP FOREIGN KEY FK_62E4DB359D8A214');
        $this->addSql('ALTER TABLE cr_trade DROP FOREIGN KEY FK_551B76AA76ED395');
        $this->addSql('ALTER TABLE ho_lifestyle DROP FOREIGN KEY FK_EE8B02C3166D1F9C');
        $this->addSql('ALTER TABLE ho_project DROP FOREIGN KEY FK_9CB98C7DF675F31B');
        $this->addSql('ALTER TABLE ho_project DROP FOREIGN KEY FK_9CB98C7D6817B746');
        $this->addSql('ALTER TABLE ho_project DROP FOREIGN KEY FK_9CB98C7D2EB899E1');
        $this->addSql('ALTER TABLE ho_propal_activity DROP FOREIGN KEY FK_5AFDB4DD166D1F9C');
        $this->addSql('ALTER TABLE ho_propal_activity DROP FOREIGN KEY FK_5AFDB4DDF675F31B');
        $this->addSql('ALTER TABLE ho_propal_date DROP FOREIGN KEY FK_4929C271166D1F9C');
        $this->addSql('ALTER TABLE ho_propal_date DROP FOREIGN KEY FK_4929C271F675F31B');
        $this->addSql('ALTER TABLE ho_propal_house DROP FOREIGN KEY FK_F0E457E0166D1F9C');
        $this->addSql('ALTER TABLE ho_propal_house DROP FOREIGN KEY FK_F0E457E0F675F31B');
        $this->addSql('ALTER TABLE ho_todo DROP FOREIGN KEY FK_1D9E51D5166D1F9C');
        $this->addSql('ALTER TABLE mail DROP FOREIGN KEY FK_5126AC48A76ED395');
        $this->addSql('ALTER TABLE notification DROP FOREIGN KEY FK_BF5476CAA76ED395');
        $this->addSql('ALTER TABLE ra_groupe DROP FOREIGN KEY FK_44FBEB04F675F31B');
        $this->addSql('ALTER TABLE ra_image DROP FOREIGN KEY FK_585147B5F675F31B');
        $this->addSql('ALTER TABLE ra_image DROP FOREIGN KEY FK_585147B529F4A05');
        $this->addSql('ALTER TABLE ra_link DROP FOREIGN KEY FK_8898DC74A76ED395');
        $this->addSql('ALTER TABLE ra_link DROP FOREIGN KEY FK_8898DC747A45358C');
        $this->addSql('ALTER TABLE ra_propal_adventure DROP FOREIGN KEY FK_9AD523C629F4A05');
        $this->addSql('ALTER TABLE ra_propal_adventure DROP FOREIGN KEY FK_9AD523C6F675F31B');
        $this->addSql('ALTER TABLE ra_propal_date DROP FOREIGN KEY FK_74A283629F4A05');
        $this->addSql('ALTER TABLE ra_propal_date DROP FOREIGN KEY FK_74A2836F675F31B');
        $this->addSql('ALTER TABLE ra_rando DROP FOREIGN KEY FK_C513A37E7A45358C');
        $this->addSql('ALTER TABLE ra_rando DROP FOREIGN KEY FK_C513A37EF675F31B');
        $this->addSql('ALTER TABLE ra_rando DROP FOREIGN KEY FK_C513A37E55CF40F9');
        $this->addSql('ALTER TABLE ra_rando DROP FOREIGN KEY FK_C513A37EED9D480F');
        $this->addSql('ALTER TABLE user DROP FOREIGN KEY FK_8D93D649E6389D24');
        $this->addSql('DROP TABLE ag_event');
        $this->addSql('DROP TABLE bi_birthday');
        $this->addSql('DROP TABLE bi_present');
        $this->addSql('DROP TABLE bu_category');
        $this->addSql('DROP TABLE bu_item');
        $this->addSql('DROP TABLE bu_recurrent');
        $this->addSql('DROP TABLE changelog');
        $this->addSql('DROP TABLE co_commentary');
        $this->addSql('DROP TABLE co_favorite');
        $this->addSql('DROP TABLE co_ingredient');
        $this->addSql('DROP TABLE co_recipe');
        $this->addSql('DROP TABLE co_step');
        $this->addSql('DROP TABLE contact');
        $this->addSql('DROP TABLE cr_trade');
        $this->addSql('DROP TABLE ho_lifestyle');
        $this->addSql('DROP TABLE ho_project');
        $this->addSql('DROP TABLE ho_propal_activity');
        $this->addSql('DROP TABLE ho_propal_date');
        $this->addSql('DROP TABLE ho_propal_house');
        $this->addSql('DROP TABLE ho_todo');
        $this->addSql('DROP TABLE image');
        $this->addSql('DROP TABLE mail');
        $this->addSql('DROP TABLE notification');
        $this->addSql('DROP TABLE ra_groupe');
        $this->addSql('DROP TABLE ra_image');
        $this->addSql('DROP TABLE ra_link');
        $this->addSql('DROP TABLE ra_propal_adventure');
        $this->addSql('DROP TABLE ra_propal_date');
        $this->addSql('DROP TABLE ra_rando');
        $this->addSql('DROP TABLE settings');
        $this->addSql('DROP TABLE society');
        $this->addSql('DROP TABLE user');
        $this->addSql('DROP TABLE messenger_messages');
    }
}
