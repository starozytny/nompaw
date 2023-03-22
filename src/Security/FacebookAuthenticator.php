<?php

namespace App\Security;

use App\Entity\Main\Society;
use App\Entity\Main\User;
use App\Service\FileUploader;
use Doctrine\ORM\EntityManagerInterface;
use KnpU\OAuth2ClientBundle\Client\ClientRegistry;
use KnpU\OAuth2ClientBundle\Security\Authenticator\OAuth2Authenticator;
use League\OAuth2\Client\Provider\FacebookUser;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\RouterInterface;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

class FacebookAuthenticator extends OAuth2Authenticator
{
    private ClientRegistry $clientRegistry;
    private EntityManagerInterface $entityManager;
    private RouterInterface $router;
    private UserPasswordHasherInterface $passwordHasher;
    private FileUploader $fileUploader;

    public function __construct(ClientRegistry $clientRegistry, EntityManagerInterface $entityManager,
                                RouterInterface $router, UserPasswordHasherInterface $passwordHasher, FileUploader $fileUploader)
    {
        $this->clientRegistry = $clientRegistry;
        $this->entityManager = $entityManager;
        $this->router = $router;
        $this->passwordHasher = $passwordHasher;
        $this->fileUploader = $fileUploader;
    }

    public function supports(Request $request): ?bool
    {
        // continue ONLY if the current ROUTE matches the check ROUTE
        return $request->attributes->get('_route') === 'connect_facebook_check';
    }

    public function authenticate(Request $request): SelfValidatingPassport
    {
        $client = $this->clientRegistry->getClient('facebook');
        $accessToken = $this->fetchAccessToken($client);

        return new SelfValidatingPassport(
            new UserBadge($accessToken->getToken(), function () use ($accessToken, $client) {
                /** @var FacebookUser $user */
                $user = $client->fetchUserFromToken($accessToken);

                $username = $user->getEmail();
                $id = $user->getId();

                $society = $this->entityManager->getRepository(Society::class)->findOneBy(['code' => 999]);

                // have they logged in with Google before? Easy!
                $existingUser = $this->entityManager->getRepository(User::class)->findOneBy(['facebookId' => $id]);
                $oldAvatar = $existingUser ? $existingUser->getAvatar() : null;
                //User doesnt exist, we create it !
                if (!$existingUser) {
                    $existingUser = (new User())
                        ->setUsername($user->getName() ?: ($user->getLastName() ?: $username))
                        ->setEmail($username)
                        ->setFacebookId($id)
                        ->setFirstname($user->getFirstName() ?: 'Facebook')
                        ->setLastname($user->getLastName() ?: ($user->getName() ?: 'Facebook'))
                        ->setSociety($society)
                    ;
                    $existingUser->setPassword($this->passwordHasher->hashPassword($existingUser, uniqid()));
                    $this->entityManager->persist($existingUser);
                }
                if($user->getPictureUrl()){
                    $fileName = $this->fileUploader->downloadImgURL($user->getPictureUrl().'/picture', User::FOLDER, $oldAvatar);
                    if($fileName){
                        $existingUser->setAvatar($fileName);
                    }
                }
                $existingUser->setLastLoginAt(new \DateTime());
                $this->entityManager->flush();

                return $existingUser;
            })
        );
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): RedirectResponse
    {
        return new RedirectResponse(
            $this->router->generate('app_login')
        );
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        $message = strtr($exception->getMessageKey(), $exception->getMessageData());

        return new Response($message, Response::HTTP_FORBIDDEN);
    }
}
