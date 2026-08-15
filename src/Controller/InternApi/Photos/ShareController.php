<?php

namespace App\Controller\InternApi\Photos;

use App\Entity\Main\User;
use App\Entity\Photo\PhAlbum;
use App\Entity\Photo\PhMedia;
use App\Entity\Photo\PhShareLink;
use App\Repository\Photo\PhShareLinkRepository;
use App\Service\Api\ApiResponse;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

#[Route('/intern/api/photos/share', name: 'intern_api_photos_share_')]
class ShareController extends AbstractController
{
    // Presets fixes plutôt qu'une date libre : évite les liens permanents créés par erreur.
    private const DURATIONS = ['1d' => 1, '7d' => 7, '30d' => 30];

    #[Route('/mine', name: 'mine', options: ['expose' => true], methods: 'GET')]
    public function mine(PhShareLinkRepository $repository, ApiResponse $apiResponse): Response
    {
        /** @var User $user */
        $user = $this->getUser();

        $links = $repository->findActiveByAuthor($user);

        return $apiResponse->apiJsonResponseData(array_map(fn (PhShareLink $l) => $this->serializeLink($l), $links));
    }

    #[Route('/media/{id}', name: 'get_media', options: ['expose' => true], methods: 'GET')]
    public function getForMedia(PhMedia $media, PhShareLinkRepository $repository, ApiResponse $apiResponse): Response
    {
        $link = $repository->findActiveForMedia($media);

        return $apiResponse->apiJsonResponseData($link ? $this->serializeLink($link) : null);
    }

    #[Route('/media/{id}', name: 'create_media', options: ['expose' => true], methods: 'POST')]
    public function createForMedia(PhMedia $media, Request $request, PhShareLinkRepository $repository, ApiResponse $apiResponse): Response
    {
        /** @var User $user */
        $user = $this->getUser();

        if ($media->getAuthor() !== $user && !$user->getIsAdmin()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $days = $this->resolveDuration($request);
        if ($days === null) {
            return $apiResponse->apiJsonResponseBadRequest('Durée invalide.');
        }

        $this->revokeExisting($repository->findActiveForMedia($media), $repository);

        $link = (new PhShareLink())
            ->setMedia($media)
            ->setCreatedBy($user)
            ->setExpiresAt((new \DateTime())->modify("+{$days} days"))
        ;
        $repository->save($link, true);

        return $apiResponse->apiJsonResponseData($this->serializeLink($link));
    }

    #[Route('/album/{id}', name: 'get_album', options: ['expose' => true], methods: 'GET')]
    public function getForAlbum(PhAlbum $album, PhShareLinkRepository $repository, ApiResponse $apiResponse): Response
    {
        $link = $repository->findActiveForAlbum($album);

        return $apiResponse->apiJsonResponseData($link ? $this->serializeLink($link) : null);
    }

    #[Route('/album/{id}', name: 'create_album', options: ['expose' => true], methods: 'POST')]
    public function createForAlbum(PhAlbum $album, Request $request, PhShareLinkRepository $repository, ApiResponse $apiResponse): Response
    {
        /** @var User $user */
        $user = $this->getUser();

        if ($album->getAuthor() !== $user && !$user->getIsAdmin()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $days = $this->resolveDuration($request);
        if ($days === null) {
            return $apiResponse->apiJsonResponseBadRequest('Durée invalide.');
        }

        $this->revokeExisting($repository->findActiveForAlbum($album), $repository);

        $link = (new PhShareLink())
            ->setAlbum($album)
            ->setCreatedBy($user)
            ->setExpiresAt((new \DateTime())->modify("+{$days} days"))
        ;
        $repository->save($link, true);

        return $apiResponse->apiJsonResponseData($this->serializeLink($link));
    }

    #[Route('/{id}/revoke', name: 'revoke', options: ['expose' => true], methods: 'PUT')]
    public function revoke(PhShareLink $link, PhShareLinkRepository $repository, ApiResponse $apiResponse): Response
    {
        /** @var User $user */
        $user = $this->getUser();

        if ($link->getCreatedBy() !== $user && !$user->getIsAdmin()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $link->setRevokedAt(new \DateTime());
        $repository->save($link, true);

        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    private function resolveDuration(Request $request): ?int
    {
        $data = json_decode($request->getContent());

        return self::DURATIONS[$data->duration ?? ''] ?? null;
    }

    private function revokeExisting(?PhShareLink $existing, PhShareLinkRepository $repository): void
    {
        // Un seul lien actif à la fois par cible : partager à nouveau remplace l'ancien lien
        // plutôt que d'en laisser plusieurs traîner avec des durées différentes.
        if ($existing) {
            $existing->setRevokedAt(new \DateTime());
            $repository->save($existing, true);
        }
    }

    private function serializeLink(PhShareLink $link): array
    {
        if ($link->getMedia()) {
            $media = $link->getMedia();
            $target = [
                'type' => 'media',
                'id' => $media->getId(),
                'thumbUrl' => $this->generateUrl('intern_api_photos_media_thumbs_src', ['id' => $media->getId()]),
            ];
        } else {
            $album = $link->getAlbum();
            $target = [
                'type' => 'album',
                'id' => $album->getId(),
                'name' => $album->getName(),
                'mediaCount' => $album->getMediaCount(),
                'coverUrl' => $album->getMediaCount() > 0
                    ? $this->generateUrl('intern_api_photos_album_cover', ['id' => $album->getId()])
                    : null,
            ];
        }

        return [
            'id' => $link->getId(),
            'url' => $this->generateUrl('app_photos_share_view', ['token' => $link->getToken()], UrlGeneratorInterface::ABSOLUTE_URL),
            'expiresAt' => $link->getExpiresAt()->format('c'),
            'createdAt' => $link->getCreatedAt()->format('c'),
            'viewCount' => $link->getViewCount(),
            'lastViewedAt' => $link->getLastViewedAt()?->format('c'),
            'target' => $target,
        ];
    }
}
