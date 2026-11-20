<?php

namespace App\Controller\Mcp;

use App\Entity\Main\User;
use App\Service\Mcp\McpOauthService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/**
 * The thin "authorization server" half of the MCP OAuth flow — authorize (behind the normal
 * session login) and token (public, client-authenticated). See App\Service\Mcp\McpOauthService
 * for the actual code/token logic; this controller only wires HTTP in and out.
 */
#[Route('/mcp/oauth', name: 'mcp_oauth_')]
class OauthController extends AbstractController
{
    #[Route('/authorize', name: 'authorize', methods: ['GET', 'POST'])]
    public function authorize(Request $request, McpOauthService $oauthService): Response
    {
        $clientId = $request->get('client_id', '');
        $redirectUri = $request->get('redirect_uri', '');
        $state = $request->get('state', '');
        $codeChallenge = $request->get('code_challenge', '');
        $codeChallengeMethod = $request->get('code_challenge_method', '');

        if (!$oauthService->isValidClient($clientId) || !$oauthService->isValidRedirectUri($redirectUri)) {
            return new Response('Client ou redirect_uri inconnu.', 400);
        }
        if ($codeChallengeMethod !== 'S256' || $codeChallenge === '') {
            return new Response('PKCE (S256) est requis.', 400);
        }

        if ($request->isMethod('POST')) {
            if (!$this->isCsrfTokenValid('mcp_authorize', $request->get('_csrf_token'))) {
                return new Response('Jeton CSRF invalide.', 400);
            }

            if ($request->get('decision') !== 'allow') {
                return new RedirectResponse($this->buildRedirect($redirectUri, ['error' => 'access_denied', 'state' => $state]));
            }

            /** @var User $user */
            $user = $this->getUser();
            $code = $oauthService->createAuthorizationCode($user, $redirectUri, $codeChallenge, $codeChallengeMethod);

            return new RedirectResponse($this->buildRedirect($redirectUri, ['code' => $code, 'state' => $state]));
        }

        return $this->render('mcp/authorize.html.twig', [
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'state' => $state,
            'code_challenge' => $codeChallenge,
            'code_challenge_method' => $codeChallengeMethod,
        ]);
    }

    #[Route('/token', name: 'token', methods: 'POST')]
    public function token(Request $request, McpOauthService $oauthService): JsonResponse
    {
        $grantType = $request->get('grant_type', '');
        $clientId = $request->get('client_id', '');
        $clientSecret = $request->get('client_secret', '');

        if (!$oauthService->isValidClient($clientId) || !$oauthService->isValidClientSecret($clientSecret)) {
            return new JsonResponse(['error' => 'invalid_client'], 401);
        }

        if (!in_array($grantType, ['authorization_code', 'refresh_token'], true)) {
            return new JsonResponse(['error' => 'unsupported_grant_type'], 400);
        }

        $tokens = $grantType === 'authorization_code'
            ? $oauthService->exchangeAuthorizationCode(
                $request->get('code', ''),
                $request->get('redirect_uri', ''),
                $request->get('code_verifier', ''),
            )
            : $oauthService->refreshTokenPair($request->get('refresh_token', ''));

        if ($tokens === null) {
            return new JsonResponse(['error' => 'invalid_grant'], 400);
        }

        return new JsonResponse($tokens);
    }

    private function buildRedirect(string $redirectUri, array $params): string
    {
        $separator = str_contains($redirectUri, '?') ? '&' : '?';

        return $redirectUri . $separator . http_build_query($params);
    }
}
