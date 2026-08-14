<?php

namespace App\Controller\Admin;

use App\Entity\Main\User;
use App\Entity\Photo\PhAccessToken;
use App\Repository\Main\SocietyRepository;
use App\Repository\Main\UserRepository;
use App\Repository\Photo\PhAccessTokenRepository;
use App\Service\Api\ApiResponse;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

#[Route('/admin/photos/acces', name: 'admin_photos_access_')]
class PhotosAccessController extends AbstractController
{
    #[Route('/', name: 'index', options: ['expose' => true])]
    public function index(): Response
    {
        return $this->render('admin/pages/photos_access/index.html.twig');
    }

    #[Route('/liste', name: 'list', options: ['expose' => true], methods: 'GET')]
    public function list(UserRepository $userRepository, ApiResponse $apiResponse): Response
    {
        $guests = $userRepository->findBy(['photosOnly' => true], ['displayName' => 'ASC']);

        $data = array_map(fn (User $guest) => $this->serializeGuest($guest), $guests);

        return $apiResponse->apiJsonResponseData($data);
    }

    #[Route('/membre/creer', name: 'create', options: ['expose' => true], methods: 'POST')]
    public function create(Request $request, UserRepository $userRepository, SocietyRepository $societyRepository,
                           PhAccessTokenRepository $tokenRepository, UserPasswordHasherInterface $passwordHasher,
                           ApiResponse $apiResponse): Response
    {
        $data = json_decode($request->getContent());

        if (!$data || empty(trim((string) ($data->displayName ?? '')))) {
            return $apiResponse->apiJsonResponseBadRequest('Le nom du membre est obligatoire.');
        }

        $society = $societyRepository->findOneBy(['code' => 999]);
        $uniqueId = uniqid('', true);

        $guest = (new User())
            ->setPhotosOnly(true)
            ->setSociety($society)
            ->setUsername('family-guest-' . $uniqueId)
            ->setEmail('family-guest-' . $uniqueId . '@nompaw.local')
            ->setDisplayName(trim($data->displayName))
            ->setLastname(trim($data->displayName))
        ;
        $guest->setPassword($passwordHasher->hashPassword($guest, bin2hex(random_bytes(16))));

        $userRepository->save($guest);

        $token = (new PhAccessToken())
            ->setUser($guest)
            ->setLabel($data->label ?? null)
        ;
        $tokenRepository->save($token, true);

        return $apiResponse->apiJsonResponseData($this->serializeGuest($guest));
    }

    #[Route('/membre/{id}/lien/nouveau', name: 'generate_token', options: ['expose' => true], methods: 'POST')]
    public function generateToken(User $guest, Request $request, PhAccessTokenRepository $tokenRepository,
                                  ApiResponse $apiResponse): Response
    {
        if (!$guest->isPhotosOnly()) {
            return $apiResponse->apiJsonResponseBadRequest("Ce membre n'est pas un compte photos.");
        }

        $data = json_decode($request->getContent());

        $token = (new PhAccessToken())
            ->setUser($guest)
            ->setLabel($data->label ?? null)
        ;
        $tokenRepository->save($token, true);

        return $apiResponse->apiJsonResponseData($this->serializeGuest($guest));
    }

    #[Route('/lien/{id}/revoquer', name: 'revoke_token', options: ['expose' => true], methods: 'PUT')]
    public function revokeToken(PhAccessToken $token, PhAccessTokenRepository $tokenRepository, ApiResponse $apiResponse): Response
    {
        $token->setRevokedAt(new \DateTime());
        $tokenRepository->save($token, true);

        return $apiResponse->apiJsonResponseData($this->serializeGuest($token->getUser()));
    }

    #[Route('/membre/{id}/bloquer', name: 'toggle_blocked', options: ['expose' => true], methods: 'PUT')]
    public function toggleBlocked(User $guest, UserRepository $userRepository, ApiResponse $apiResponse): Response
    {
        if (!$guest->isPhotosOnly()) {
            return $apiResponse->apiJsonResponseBadRequest("Ce membre n'est pas un compte photos.");
        }

        $guest->setIsBlocked(!$guest->isIsBlocked());
        $userRepository->save($guest, true);

        return $apiResponse->apiJsonResponseData($this->serializeGuest($guest));
    }

    #[Route('/membre/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(User $guest, UserRepository $userRepository, ApiResponse $apiResponse): Response
    {
        if (!$guest->isPhotosOnly()) {
            return $apiResponse->apiJsonResponseBadRequest("Ce membre n'est pas un compte photos.");
        }

        if (!$guest->getPhMedia()->isEmpty()) {
            return $apiResponse->apiJsonResponseBadRequest(
                'Ce membre a déjà déposé des photos, révoquez ses liens plutôt que de le supprimer.'
            );
        }

        $userRepository->remove($guest, true);

        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    private function serializeGuest(User $guest): array
    {
        return [
            'id' => $guest->getId(),
            'displayName' => $guest->getDisplayName(),
            'isBlocked' => $guest->isIsBlocked(),
            'mediaCount' => $guest->getPhMedia()->count(),
            'tokens' => array_map(fn (PhAccessToken $token) => [
                'id' => $token->getId(),
                'label' => $token->getLabel(),
                'link' => $this->generateUrl('app_photos_magic_link', ['token' => $token->getToken()], UrlGeneratorInterface::ABSOLUTE_URL),
                'createdAt' => $token->getCreatedAt()->format('c'),
                'lastUsedAt' => $token->getLastUsedAt()?->format('c'),
                'revokedAt' => $token->getRevokedAt()?->format('c'),
                'isActive' => $token->isActive(),
            ], $guest->getPhAccessTokens()->toArray()),
        ];
    }
}
