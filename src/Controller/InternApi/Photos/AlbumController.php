<?php

namespace App\Controller\InternApi\Photos;

use App\Entity\Main\User;
use App\Entity\Photo\PhAlbum;
use App\Repository\Photo\PhAlbumRepository;
use App\Repository\Photo\PhMediaRepository;
use App\Repository\Photo\PhShareLinkRepository;
use App\Service\Api\ApiResponse;
use App\Service\Data\DataAlbum;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/intern/api/photos/album', name: 'intern_api_photos_album_')]
class AlbumController extends AbstractController
{
    #[Route('/list', name: 'list', options: ['expose' => true], methods: 'GET')]
    public function list(PhAlbumRepository $repository, PhShareLinkRepository $shareLinkRepository, SerializerInterface $serializer): JsonResponse
    {
        $albums = $repository->findBy([], ['createdAt' => 'DESC']);

        $albumsData = json_decode($serializer->serialize($albums, 'json', ['groups' => PhAlbum::LIST]));

        $sharedUntil = $shareLinkRepository->findActiveIndexedByAlbumIds(array_map(fn (PhAlbum $a) => $a->getId(), $albums));
        foreach ($albumsData as $albumData) {
            $albumData->sharedUntil = isset($sharedUntil[$albumData->id]) ? $sharedUntil[$albumData->id]->format('c') : null;
        }

        return new JsonResponse($albumsData, 200);
    }

    #[Route('/{id}/cover', name: 'cover', options: ['expose' => true], methods: 'GET')]
    public function cover(PhAlbum $obj): Response
    {
        $media = $obj->getCoverMedia();

        if (!$media) {
            throw $this->createNotFoundException();
        }

        return $this->file($this->getParameter('private_directory') . $media->getLightboxFile());
    }

    #[Route('/{id}/cover', name: 'set_cover', options: ['expose' => true], methods: 'PUT')]
    public function setCover(PhAlbum $obj, Request $request, PhMediaRepository $mediaRepository,
                             PhAlbumRepository $albumRepository, ApiResponse $apiResponse): Response
    {
        /** @var User $user */
        $user = $this->getUser();

        if ($obj->getAuthor() !== $user && !$user->getIsAdmin()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $data = json_decode($request->getContent());
        $media = !empty($data->mediaId ?? null) ? $mediaRepository->find($data->mediaId) : null;

        // On ne permet de choisir comme couverture qu'une photo appartenant déjà à cet album.
        if (!$media || $media->getAlbum() !== $obj) {
            return $apiResponse->apiJsonResponseBadRequest("Cette photo n'appartient pas à cet album.");
        }

        $obj->setCover($media);
        $albumRepository->save($obj, true);

        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    private function submitForm(PhAlbum $obj, Request $request, ApiResponse $apiResponse, ValidatorService $validator,
                                DataAlbum $dataAlbum, PhAlbumRepository $repository): JsonResponse
    {
        $data = json_decode($request->get('data'));
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataAlbum->setDataAlbum($obj, $data);

        $errors = $validator->validate($obj);
        if ($errors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($errors);
        }

        $repository->save($obj, true);

        return $apiResponse->apiJsonResponse($obj, PhAlbum::LIST);
    }

    #[Route('/create', name: 'create', options: ['expose' => true], methods: 'POST')]
    public function create(Request $request, ApiResponse $apiResponse, ValidatorService $validator,
                           DataAlbum $dataAlbum, PhAlbumRepository $repository): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        return $this->submitForm((new PhAlbum())->setAuthor($user), $request, $apiResponse, $validator, $dataAlbum, $repository);
    }

    #[Route('/update/{id}', name: 'update', options: ['expose' => true], methods: 'POST')]
    public function update(PhAlbum $obj, Request $request, ApiResponse $apiResponse, ValidatorService $validator,
                           DataAlbum $dataAlbum, PhAlbumRepository $repository): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if ($obj->getAuthor() !== $user && !$user->getIsAdmin()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        return $this->submitForm($obj, $request, $apiResponse, $validator, $dataAlbum, $repository);
    }

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(PhAlbum $obj, PhAlbumRepository $repository, ApiResponse $apiResponse): Response
    {
        /** @var User $user */
        $user = $this->getUser();

        if ($obj->getAuthor() !== $user && !$user->getIsAdmin()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        // Ungroup rather than cascade-delete: media stays, only the album folder disappears.
        foreach ($obj->getMedia() as $media) {
            $media->setAlbum(null);
        }

        $repository->remove($obj, true);

        return $apiResponse->apiJsonResponseSuccessful('ok');
    }
}
