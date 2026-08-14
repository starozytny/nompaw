<?php

namespace App\Security;

use App\Repository\Photo\PhAccessTokenRepository;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\RouterInterface;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\RememberMeBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

class PhotosMagicLinkAuthenticator extends AbstractAuthenticator
{
    public function __construct(
        private readonly PhAccessTokenRepository $tokenRepository,
        private readonly RouterInterface $router,
    ) {}

    public function supports(Request $request): ?bool
    {
        return $request->attributes->get('_route') === 'app_photos_magic_link';
    }

    public function authenticate(Request $request): Passport
    {
        $token = $request->attributes->get('token');

        return new SelfValidatingPassport(
            new UserBadge($token, function () use ($token) {
                $accessToken = $this->tokenRepository->findOneBy(['token' => $token]);

                if (!$accessToken || !$accessToken->isActive() || $accessToken->getUser()->isIsBlocked()) {
                    throw new UserNotFoundException('Lien invalide ou révoqué.');
                }

                $accessToken->setLastUsedAt(new \DateTime());
                $this->tokenRepository->save($accessToken, true);

                return $accessToken->getUser();
            }),
            [new RememberMeBadge()]
        );
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return new RedirectResponse($this->router->generate('user_photos_index'));
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new RedirectResponse($this->router->generate('app_photos_link_invalid'));
    }
}
