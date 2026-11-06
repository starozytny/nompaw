<?php

namespace App\Security;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\EntryPoint\AuthenticationEntryPointInterface;

/**
 * 401 des routes /mcp : indique au client MCP où trouver les métadonnées OAuth (RFC 9728)
 * pour qu'il lance le flux d'autorisation.
 */
class McpEntryPoint implements AuthenticationEntryPointInterface
{
    public function __construct(#[Autowire(env: 'MCP_PUBLIC_URL')] private readonly string $publicUrl)
    {
    }

    public function start(Request $request, ?AuthenticationException $authException = null): Response
    {
        $origin = $this->publicUrl !== '' ? rtrim($this->publicUrl, '/') : $request->getSchemeAndHttpHost();
        $metadata = $origin . '/.well-known/oauth-protected-resource/mcp/running';

        return new JsonResponse(
            ['error' => 'unauthorized'],
            Response::HTTP_UNAUTHORIZED,
            ['WWW-Authenticate' => sprintf('Bearer resource_metadata="%s"', $metadata)]
        );
    }
}
