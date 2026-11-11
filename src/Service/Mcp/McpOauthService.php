<?php

namespace App\Service\Mcp;

use App\Entity\Main\McpAuthCode;
use App\Entity\Main\McpRefreshToken;
use App\Entity\Main\User;
use App\Repository\Main\McpAuthCodeRepository;
use App\Repository\Main\McpRefreshTokenRepository;
use DateInterval;
use DateTime;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;

/**
 * The OAuth "authorization server" half of the MCP bridge: a single static client (claude.ai,
 * configured via MCP_OAUTH_CLIENT_ID/SECRET/REDIRECT_URI), authorization_code + PKCE, and rotating
 * refresh tokens. mcp/sdk only acts as a *resource server* (it validates a bearer token, see its
 * ADR 0001/0002) so this app has to issue the tokens itself — reusing Lexik's JWT manager to mint
 * them, with a `mcp: true` claim that App\EventListener\McpTokenScopeListener uses to keep this
 * token confined to /mcp.
 */
class McpOauthService
{
    private const AUTH_CODE_TTL_SECONDS = 120;
    private const ACCESS_TOKEN_TTL_SECONDS = 3600;
    private const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 180;

    public function __construct(
        private readonly McpAuthCodeRepository $authCodeRepository,
        private readonly McpRefreshTokenRepository $refreshTokenRepository,
        private readonly JWTTokenManagerInterface $jwtManager,
        private readonly string $mcpOauthClientId,
        private readonly string $mcpOauthClientSecret,
        private readonly string $mcpOauthRedirectUri,
    ) {}

    public function isValidClient(string $clientId): bool
    {
        return $this->mcpOauthClientId !== '' && hash_equals($this->mcpOauthClientId, $clientId);
    }

    public function isValidClientSecret(string $clientSecret): bool
    {
        return $this->mcpOauthClientSecret !== '' && hash_equals($this->mcpOauthClientSecret, $clientSecret);
    }

    public function isValidRedirectUri(string $redirectUri): bool
    {
        return $this->mcpOauthRedirectUri !== '' && hash_equals($this->mcpOauthRedirectUri, $redirectUri);
    }

    public function createAuthorizationCode(User $user, string $redirectUri, string $codeChallenge, string $codeChallengeMethod): string
    {
        $code = bin2hex(random_bytes(32));

        $authCode = (new McpAuthCode())
            ->setUser($user)
            ->setCodeHash($this->hash($code))
            ->setRedirectUri($redirectUri)
            ->setCodeChallenge($codeChallenge)
            ->setCodeChallengeMethod($codeChallengeMethod)
            ->setExpiresAt((new DateTime())->add(new DateInterval('PT' . self::AUTH_CODE_TTL_SECONDS . 'S')));

        $this->authCodeRepository->save($authCode, true);

        return $code;
    }

    /**
     * Validates and consumes a single-use authorization code, returning the token pair for its
     * user, or null if the code/redirect_uri/PKCE verifier don't check out.
     */
    public function exchangeAuthorizationCode(string $code, string $redirectUri, string $codeVerifier): ?array
    {
        $authCode = $this->authCodeRepository->findOneByCodeHash($this->hash($code));
        $now = new DateTime();

        if ($authCode === null || !$authCode->isUsable($now)) {
            return null;
        }
        if (!hash_equals($authCode->getRedirectUri(), $redirectUri)) {
            return null;
        }
        if (!$this->verifyPkce($codeVerifier, $authCode->getCodeChallenge(), $authCode->getCodeChallengeMethod())) {
            return null;
        }

        $authCode->setUsedAt($now);
        $this->authCodeRepository->save($authCode, true);

        return $this->issueTokenPair($authCode->getUser());
    }

    /**
     * Rotates a refresh token: the presented one is revoked whether or not it was still valid, and
     * a fresh pair is returned only if it was. Reusing an already-revoked token is a sign of theft,
     * so it never succeeds twice.
     */
    public function refreshTokenPair(string $refreshToken): ?array
    {
        $existing = $this->refreshTokenRepository->findOneByTokenHash($this->hash($refreshToken));
        if ($existing === null) {
            return null;
        }

        $usable = $existing->isUsable(new DateTime());
        if ($existing->getRevokedAt() === null) {
            $existing->setRevokedAt(new DateTime());
            $this->refreshTokenRepository->save($existing, true);
        }

        return $usable ? $this->issueTokenPair($existing->getUser()) : null;
    }

    private function issueTokenPair(User $user): array
    {
        $accessToken = $this->jwtManager->createFromPayload($user, ['mcp' => true, 'scope' => 'bilans:read']);

        $refreshToken = bin2hex(random_bytes(32));
        $this->refreshTokenRepository->save(
            (new McpRefreshToken())
                ->setUser($user)
                ->setTokenHash($this->hash($refreshToken))
                ->setClientId($this->mcpOauthClientId)
                ->setExpiresAt((new DateTime())->add(new DateInterval('PT' . self::REFRESH_TOKEN_TTL_SECONDS . 'S'))),
            true
        );

        return [
            'access_token' => $accessToken,
            'token_type' => 'Bearer',
            'expires_in' => self::ACCESS_TOKEN_TTL_SECONDS,
            'refresh_token' => $refreshToken,
        ];
    }

    private function verifyPkce(string $codeVerifier, string $codeChallenge, string $codeChallengeMethod): bool
    {
        if ($codeChallengeMethod !== 'S256') {
            return false;
        }

        $computed = rtrim(strtr(base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'), '=');

        return hash_equals($codeChallenge, $computed);
    }

    private function hash(string $value): string
    {
        return hash('sha256', $value);
    }
}
