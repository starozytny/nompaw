<?php

namespace App\Controller;

use App\Entity\Photo\PhMedia;
use App\Repository\Photo\PhShareLinkRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class PhotosShareController extends AbstractController
{
    #[Route('/partage-photos/{token}', name: 'app_photos_share_view', methods: ['GET'])]
    public function view(string $token, PhShareLinkRepository $repository): Response
    {
        $link = $repository->findOneActiveByToken($token);

        if (!$link) {
            return $this->redirectToRoute('app_photos_share_invalid');
        }

        $link->incrementViewCount();
        $link->setLastViewedAt(new \DateTime());
        $repository->save($link, true);

        $albumMedia = [];
        if ($link->getAlbum()) {
            $albumMedia = $link->getAlbum()->getMedia()->toArray();
            usort($albumMedia, fn (PhMedia $a, PhMedia $b) => ($b->getTakenAt() ?? $b->getCreatedAt()) <=> ($a->getTakenAt() ?? $a->getCreatedAt()));
        }

        return $this->render('app/pages/photos/share_view.html.twig', [
            'link' => $link,
            'media' => $link->getMedia(),
            'album' => $link->getAlbum(),
            'albumMedia' => $albumMedia,
        ]);
    }

    #[Route('/partage-photos-invalide', name: 'app_photos_share_invalid', methods: ['GET'])]
    public function invalid(): Response
    {
        return $this->render('app/pages/security/photos_share_invalid.html.twig');
    }

    #[Route('/partage-photos/{token}/src/{mediaId}', name: 'app_photos_share_thumb', methods: ['GET'])]
    public function thumb(string $token, int $mediaId, PhShareLinkRepository $repository): Response
    {
        $media = $this->resolveMedia($token, $mediaId, $repository);

        return $this->file($this->getParameter('private_directory') . $media->getThumbsFile());
    }

    #[Route('/partage-photos/{token}/hd/{mediaId}', name: 'app_photos_share_hd', methods: ['GET'])]
    public function hd(string $token, int $mediaId, PhShareLinkRepository $repository): Response
    {
        $media = $this->resolveMedia($token, $mediaId, $repository);

        return $this->file($this->getParameter('private_directory') . $media->getLightboxFile());
    }

    #[Route('/partage-photos/{token}/file/{mediaId}', name: 'app_photos_share_file', methods: ['GET'])]
    public function videoSource(string $token, int $mediaId, PhShareLinkRepository $repository): Response
    {
        $media = $this->resolveMedia($token, $mediaId, $repository);

        return $this->file($this->getParameter('private_directory') . $media->getFileFile());
    }

    #[Route('/partage-photos/{token}/download/{mediaId}', name: 'app_photos_share_download', methods: ['GET'])]
    public function download(string $token, int $mediaId, PhShareLinkRepository $repository): Response
    {
        $media = $this->resolveMedia($token, $mediaId, $repository);

        return $this->file($this->getParameter('private_directory') . $media->getFileFile(), $media->getFile());
    }

    /**
     * Vérifie que le lien est actif ET que le média demandé appartient bien à sa cible
     * (la photo partagée elle-même, ou un média de l'album partagé) avant de servir un fichier :
     * sans ce garde-fou, un mediaId arbitraire dans l'URL donnerait accès à n'importe quelle photo.
     */
    private function resolveMedia(string $token, int $mediaId, PhShareLinkRepository $repository): PhMedia
    {
        $link = $repository->findOneActiveByToken($token);

        if (!$link) {
            throw $this->createNotFoundException();
        }

        if ($link->getMedia() && $link->getMedia()->getId() === $mediaId) {
            return $link->getMedia();
        }

        if ($link->getAlbum()) {
            foreach ($link->getAlbum()->getMedia() as $media) {
                if ($media->getId() === $mediaId) {
                    return $media;
                }
            }
        }

        throw $this->createNotFoundException();
    }
}
