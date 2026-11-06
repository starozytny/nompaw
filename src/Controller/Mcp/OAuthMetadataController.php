<?php

namespace App\Controller\Mcp;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Métadonnées de découverte OAuth lues par le client MCP (claude.ai) :
 *  - RFC 9728 : ressource protégée (/mcp/running) et son serveur d'autorisation ;
 *  - RFC 8414 : endpoints /authorize et /token du serveur d'autorisation.
 */
class OAuthMetadataController extends AbstractController
{
    public function __construct(#[Autowire(env: 'MCP_PUBLIC_URL')] private readonly string $publicUrl)
    {
    }

    #[Route('/.well-known/oauth-protected-resource/mcp/running', name: 'mcp_oauth_protected_resource', methods: ['GET'])]
    public function protectedResource(Request $request): JsonResponse
    {
        $origin = $this->publicUrl !== '' ? rtrim($this->publicUrl, '/') : $request->getSchemeAndHttpHost();

        return new JsonResponse([
            'resource' => $origin . '/mcp/running',
            'authorization_servers' => [$origin],
            'scopes_supported' => ['running:read'],
            'bearer_methods_supported' => ['header'],
        ]);
    }

    #[Route('/.well-known/oauth-authorization-server', name: 'mcp_oauth_authorization_server', methods: ['GET'])]
    public function authorizationServer(Request $request): JsonResponse
    {
        $origin = $this->publicUrl !== '' ? rtrim($this->publicUrl, '/') : $request->getSchemeAndHttpHost();

        return new JsonResponse([
            'issuer' => $origin,
            'authorization_endpoint' => $origin . '/authorize',
            'token_endpoint' => $origin . '/token',
            'response_types_supported' => ['code'],
            'grant_types_supported' => ['authorization_code', 'refresh_token'],
            'code_challenge_methods_supported' => ['S256'],
            'token_endpoint_auth_methods_supported' => ['client_secret_basic', 'client_secret_post'],
            'scopes_supported' => ['running:read'],
        ]);
    }
}
