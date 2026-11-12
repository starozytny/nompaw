<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261111160000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Adds mcp_auth_code and mcp_refresh_token tables for the MCP OAuth bridge.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE mcp_auth_code (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, code_hash VARCHAR(64) NOT NULL, redirect_uri VARCHAR(2048) NOT NULL, code_challenge VARCHAR(255) NOT NULL, code_challenge_method VARCHAR(16) NOT NULL, expires_at DATETIME NOT NULL, used_at DATETIME DEFAULT NULL, UNIQUE INDEX UNIQ_MCP_AUTH_CODE_HASH (code_hash), INDEX IDX_MCP_AUTH_CODE_USER (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE mcp_refresh_token (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, token_hash VARCHAR(64) NOT NULL, client_id VARCHAR(255) NOT NULL, expires_at DATETIME NOT NULL, revoked_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_MCP_REFRESH_TOKEN_HASH (token_hash), INDEX IDX_MCP_REFRESH_TOKEN_USER (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE mcp_auth_code ADD CONSTRAINT FK_MCP_AUTH_CODE_USER FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE mcp_refresh_token ADD CONSTRAINT FK_MCP_REFRESH_TOKEN_USER FOREIGN KEY (user_id) REFERENCES user (id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE mcp_auth_code DROP FOREIGN KEY FK_MCP_AUTH_CODE_USER');
        $this->addSql('ALTER TABLE mcp_refresh_token DROP FOREIGN KEY FK_MCP_REFRESH_TOKEN_USER');
        $this->addSql('DROP TABLE mcp_auth_code');
        $this->addSql('DROP TABLE mcp_refresh_token');
    }
}
