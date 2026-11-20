<?php

namespace App\Controller\Mcp;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/**
 * OAuth discovery documents the MCP spec requires so claude.ai can find this app's authorization
 * server (RFC 8414) and know it protects /mcp (RFC 9728), without any manual configuration on
 * their side beyond the server URL.
 */
class WellKnownController extends AbstractController
{
    #[Route('/.well-known/oauth-authorization-server', name: 'mcp_well_known_authorization_server', methods: 'GET')]
    public function authorizationServer(Request $request): JsonResponse
    {
        $base = $request->getSchemeAndHttpHost();

        return new JsonResponse([
            'issuer' => $base,
            'authorization_endpoint' => $base . '/mcp/oauth/authorize',
            'token_endpoint' => $base . '/mcp/oauth/token',
            'response_types_supported' => ['code'],
            'grant_types_supported' => ['authorization_code', 'refresh_token'],
            'code_challenge_methods_supported' => ['S256'],
            'token_endpoint_auth_methods_supported' => ['client_secret_post'],
        ]);
    }

    #[Route('/.well-known/oauth-protected-resource', name: 'mcp_well_known_protected_resource', methods: 'GET')]
    public function protectedResource(Request $request): JsonResponse
    {
        $base = $request->getSchemeAndHttpHost();

        return new JsonResponse([
            'resource' => $base . '/mcp',
            'authorization_servers' => [$base],
        ]);
    }
}
