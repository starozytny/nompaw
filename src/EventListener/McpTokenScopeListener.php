<?php

namespace App\EventListener;

use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTAuthenticatedEvent;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Keeps the MCP access token (claim `mcp: true`, see McpOauthService) and the regular Nompaw API
 * token in their own lanes: an MCP token only works on /mcp, a regular one never works there.
 * This way a token stored by the MCP client (claude.ai) is useless against the rest of the API
 * even if it leaks, and a regular API token can't be replayed against the MCP tools.
 */
class McpTokenScopeListener
{
    public function __construct(private readonly RequestStack $requestStack) {}

    public function onJwtAuthenticated(JWTAuthenticatedEvent $event): void
    {
        $request = $this->requestStack->getCurrentRequest();
        if ($request === null) {
            return;
        }

        $isMcpToken = !empty($event->getPayload()['mcp']);
        $isMcpEndpoint = $request->getPathInfo() === '/mcp';

        if ($isMcpToken !== $isMcpEndpoint) {
            throw new AccessDeniedHttpException('Ce token n\'est pas valide pour cette route.');
        }
    }
}
