<?php

namespace App\Controller;

use App\Entity\Rando\RaImage;
use App\Entity\Rando\RaRando;
use App\Repository\Rando\RaImageRepository;
use App\Repository\Rando\RaRandoRepository;
use App\Service\Api\ApiResponse;
use App\Service\Data\RandoImageUploader;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

/**
 * Dépôt et consultation publics d'un album d'aventure, protégés par un mot de passe
 * défini par le référent de la rando (voir InternApi\Aventures\RandoController::deposit).
 *
 * Aucun compte : le mot de passe déverrouille l'album en session ; le nom saisi au
 * moment du dépôt sert uniquement à l'attribution des fichiers (RaImage::guestName).
 *
 * Toutes les routes sont publiques (config/packages/security.yaml : ^/album-aventure).
 */
#[Route('/album-aventure', name: 'app_aventure_album')]
class AventureAlbumController extends AbstractController
{
    private const IMAGES_PER_PAGE = 20;

    private function sessionKey(string $token): string
    {
        return 'ra_album_' . $token;
    }

    private function findEnabledRando(string $token, RaRandoRepository $repository): ?RaRando
    {
        $rando = $repository->findOneBy(['depositToken' => $token]);

        return ($rando && $rando->isDepositEnabled()) ? $rando : null;
    }

    /**
     * Un membre connecté a accès direct à l'album (le mot de passe ne concerne que les
     * non-membres) ; sinon l'accès dépend du flag de session posé par unlock().
     */
    private function hasAccess(string $token, Request $request): bool
    {
        return $this->getUser() !== null
            || $request->getSession()->get($this->sessionKey($token)) === true;
    }

    /**
     * Charge la rando si l'album correspondant est accessible (membre connecté ou mot de
     * passe saisi), sinon null. Volontairement sans exception : les routes JSON renvoient
     * un 403 propre (pas de redirection vers le login du firewall « main »), les routes
     * fichiers un 404.
     */
    private function accessibleRandoOrNull(string $token, Request $request, RaRandoRepository $repository): ?RaRando
    {
        $rando = $this->findEnabledRando($token, $repository);

        if (!$rando || !$this->hasAccess($token, $request)) {
            return null;
        }

        return $rando;
    }

    #[Route('/invalide', name: '_invalid', methods: ['GET'])]
    public function invalid(): Response
    {
        return $this->render('app/pages/aventures/album_invalid.html.twig');
    }

    #[Route('/{token}', name: '', requirements: ['token' => '[a-f0-9]{32}'], methods: ['GET'])]
    public function index(string $token, Request $request, RaRandoRepository $repository): Response
    {
        $rando = $this->findEnabledRando($token, $repository);

        if (!$rando) {
            return $this->redirectToRoute('app_aventure_album_invalid');
        }

        /** @var \App\Entity\Main\User|null $user */
        $user = $this->getUser();

        return $this->render('app/pages/aventures/album.html.twig', [
            'token' => $token,
            'randoName' => $rando->getName(),
            'unlocked' => $this->hasAccess($token, $request),
            'isMember' => $user !== null,
            'memberName' => $user?->getDisplayName(),
            'loginUrl' => $this->generateUrl('app_login', [
                'redirect' => $this->generateUrl('app_aventure_album', ['token' => $token]),
            ]),
        ]);
    }

    #[Route('/{token}/unlock', name: '_unlock', methods: ['POST'])]
    public function unlock(string $token, Request $request, RaRandoRepository $repository, ApiResponse $apiResponse): JsonResponse
    {
        $rando = $this->findEnabledRando($token, $repository);

        if (!$rando) {
            return $apiResponse->apiJsonResponseBadRequest('Lien invalide.');
        }

        $data = json_decode($request->getContent());
        $password = is_object($data) ? (string) ($data->password ?? '') : '';

        if (!$rando->getDepositPassword() || !password_verify($password, $rando->getDepositPassword())) {
            usleep(300000); // ralentit un poil le bruteforce sans bloquer un humain
            return $apiResponse->apiJsonResponseBadRequest('Mot de passe incorrect.');
        }

        $request->getSession()->set($this->sessionKey($token), true);

        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/{token}/images/{page}', name: '_images', requirements: ['page' => '\d+'], methods: ['GET'])]
    public function images(string $token, int $page, Request $request, RaRandoRepository $repository,
                           RaImageRepository $imageRepository, ApiResponse $apiResponse, SerializerInterface $serializer): JsonResponse
    {
        $rando = $this->accessibleRandoOrNull($token, $request, $repository);
        if (!$rando) {
            return $apiResponse->apiJsonResponseForbidden('Album verrouillé.');
        }

        $offset = ($page - 1) * self::IMAGES_PER_PAGE;

        // Album public : seules les images non restreintes (visibility = 0).
        $currentImages = $imageRepository->findVisibleImagesPage($rando, false, $offset, self::IMAGES_PER_PAGE);
        $total = $imageRepository->countVisibleImages($rando, false);

        return $apiResponse->apiJsonResponseData([
            'images' => json_decode($serializer->serialize($currentImages, 'json', ['groups' => RaImage::LIST]), true),
            'hasMore' => ($offset + self::IMAGES_PER_PAGE) < $total,
            'total' => $total,
            'page' => $page,
        ]);
    }

    #[Route('/{token}/deposit', name: '_deposit', methods: ['POST'])]
    public function deposit(string $token, Request $request, RaRandoRepository $repository,
                            RaImageRepository $imageRepository, RandoImageUploader $randoImageUploader, ApiResponse $apiResponse): Response
    {
        $rando = $this->accessibleRandoOrNull($token, $request, $repository);
        if (!$rando) {
            return $apiResponse->apiJsonResponseForbidden('Album verrouillé.');
        }

        // Membre connecté : dépôt rattaché à son compte, pas de nom à saisir.
        /** @var \App\Entity\Main\User|null $user */
        $user = $this->getUser();

        $name = mb_substr(trim((string) $request->get('name')), 0, 255);
        if (!$user && $name === '') {
            return $apiResponse->apiJsonResponseBadRequest('Merci d\'indiquer votre nom.');
        }

        $mtime = $request->get('mtime') !== null ? (int) $request->get('mtime') : null;

        $count = 0;
        foreach ($request->files as $file) {
            $image = $randoImageUploader->createFromUpload($file, $rando, $user, $user ? null : $name, $mtime);

            if ($image === null) {
                continue;
            }

            $imageRepository->save($image);
            $count++;
        }

        $imageRepository->flush();

        return $apiResponse->apiJsonResponseSuccessful($count . ' fichier(s) déposé(s).');
    }

    #[Route('/{token}/thumbs/{id}', name: '_thumbs', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function thumbs(string $token, int $id, Request $request, RaRandoRepository $repository, RaImageRepository $imageRepository): Response
    {
        $image = $this->resolveImage($token, $id, $request, $repository, $imageRepository);

        return $this->file($this->getParameter('private_directory') . $image->getThumbsFile());
    }

    #[Route('/{token}/hd/{id}', name: '_hd', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function hd(string $token, int $id, Request $request, RaRandoRepository $repository, RaImageRepository $imageRepository): Response
    {
        $image = $this->resolveImage($token, $id, $request, $repository, $imageRepository);

        return $this->file($this->getParameter('private_directory') . $image->getLightboxFile());
    }

    #[Route('/{token}/file/{id}', name: '_file', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function fileSource(string $token, int $id, Request $request, RaRandoRepository $repository, RaImageRepository $imageRepository): Response
    {
        $image = $this->resolveImage($token, $id, $request, $repository, $imageRepository);

        return $this->file($this->getParameter('private_directory') . $image->getFileFile());
    }

    #[Route('/{token}/download/{id}', name: '_download', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function download(string $token, int $id, Request $request, RaRandoRepository $repository, RaImageRepository $imageRepository): Response
    {
        $image = $this->resolveImage($token, $id, $request, $repository, $imageRepository);

        return $this->file($this->getParameter('private_directory') . $image->getFileFile(), $image->getFile());
    }

    /**
     * Vérifie que l'album est déverrouillé ET que l'image demandée appartient bien à
     * cette rando avant de servir un fichier : sans ce garde-fou, un id arbitraire dans
     * l'URL donnerait accès à n'importe quelle photo d'aventure.
     */
    private function resolveImage(string $token, int $id, Request $request, RaRandoRepository $repository, RaImageRepository $imageRepository): RaImage
    {
        $rando = $this->accessibleRandoOrNull($token, $request, $repository);

        if (!$rando) {
            throw $this->createNotFoundException();
        }

        $image = $imageRepository->find($id);

        if (!$image || $image->getRando()->getId() !== $rando->getId() || (int) $image->getVisibility() !== 0) {
            throw $this->createNotFoundException();
        }

        return $image;
    }
}
