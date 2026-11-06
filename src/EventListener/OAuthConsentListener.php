<?php

namespace App\EventListener;

use League\Bundle\OAuth2ServerBundle\Event\AuthorizationRequestResolveEvent;
use League\Bundle\OAuth2ServerBundle\OAuth2Events;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Twig\Environment;

/**
 * Écran de consentement OAuth : l'utilisateur est déjà connecté (firewall main) ; on lui demande
 * d'autoriser explicitement le client (claude.ai) avant d'émettre le code d'autorisation.
 */
#[AsEventListener(event: OAuth2Events::AUTHORIZATION_REQUEST_RESOLVE)]
class OAuthConsentListener
{
    private const CSRF_ID = 'mcp_consent';

    public function __construct(
        private readonly RequestStack $requestStack,
        private readonly AuthorizationCheckerInterface $authorizationChecker,
        private readonly CsrfTokenManagerInterface $csrfTokenManager,
        private readonly Environment $twig,
    ) {
    }

    public function __invoke(AuthorizationRequestResolveEvent $event): void
    {
        if (!$this->authorizationChecker->isGranted('ROLE_RUNNING')) {
            $event->resolveAuthorization(AuthorizationRequestResolveEvent::AUTHORIZATION_DENIED);

            return;
        }

        $request = $this->requestStack->getCurrentRequest();
        $submitted = $request->isMethod('POST')
            && $this->csrfTokenManager->isTokenValid(new CsrfToken(self::CSRF_ID, (string) $request->request->get('_token')));

        if ($submitted) {
            $event->resolveAuthorization($request->request->get('decision') === 'allow'
                ? AuthorizationRequestResolveEvent::AUTHORIZATION_APPROVED
                : AuthorizationRequestResolveEvent::AUTHORIZATION_DENIED);

            return;
        }

        $event->setResponse(new Response($this->twig->render('mcp/consent.html.twig', [
            'client' => $event->getClient()->getName(),
            'scopes' => array_map('strval', $event->getScopes()),
            'csrf_token' => $this->csrfTokenManager->getToken(self::CSRF_ID)->getValue(),
            'action' => $request->getRequestUri(),
        ])));
    }
}
