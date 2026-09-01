<?php

namespace App\Controller\InternApi\Aventures;

use App\Entity\Main\User;
use App\Entity\Rando\RaImage;
use App\Entity\Rando\RaRando;
use App\Repository\Rando\RaImageRepository;
use App\Repository\Rando\RaRandoRepository;
use App\Service\Api\ApiResponse;
use App\Service\Data\RandoImageUploader;
use App\Service\FileUploader;
use PHPImageWorkshop\Core\Exception\ImageWorkshopLayerException;
use PHPImageWorkshop\Exception\ImageWorkshopException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use ZipArchive;

#[Route('/intern/api/aventures/image', name: 'intern_api_aventures_images_')]
class ImageController extends AbstractController
{
    const IMAGES_PER_PAGE = 20;

    #[Route('/fetch/{id}/{page}', name: 'fetch_images', options: ['expose' => true], methods: 'GET')]
    public function fetchImages(Request $request, RaRando $rando, int $page, RaImageRepository $repository, ApiResponse $apiResponse, SerializerInterface $serializer): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $offset = ($page - 1) * self::IMAGES_PER_PAGE;

        $canSeePrivate = $this->canSeePrivateImages($user, $rando);

        $currentImages = $repository->findVisibleImagesPage($rando, $canSeePrivate, $offset, self::IMAGES_PER_PAGE);
        $totalImages = $repository->countVisibleImages($rando, $canSeePrivate);
        $hasMore = ($offset + self::IMAGES_PER_PAGE) < $totalImages;

        $currentImages = $serializer->serialize($currentImages, 'json', ['groups' => RaImage::LIST]);

        // La liste complète (nécessaire côté front pour la navigation dans la lightbox) n'est
        // envoyée qu'à la première page : la renvoyer en entier à chaque page de scroll infini
        // forçait Doctrine à hydrater et sérialiser toutes les photos de la rando à chaque requête,
        // pour un contenu identique déjà en mémoire côté client.
        $allImages = null;
        if ($page === 1) {
            $allImages = $serializer->serialize($repository->findVisibleImages($rando, $canSeePrivate), 'json', ['groups' => RaImage::LIST]);
        }

        return $apiResponse->apiJsonResponse([
            'images' => $allImages,
            'currentImages' => $currentImages,
            'hasMore' => $hasMore,
            'total' => $totalImages,
            'page' => $page
        ], RaImage::class);
    }

    private function canSeePrivateImages(?User $user, RaRando $rando): bool
    {
        if (!$user) {
            return false;
        }

        if ($user->getIsAdmin()) {
            return true;
        }

        $participants = $rando->getParticipants();

        if ($participants === null || $participants === []) {
            return true;
        }

        return in_array($user->getId(), $participants);
    }

    #[Route('/upload/photos/{id}', name: 'upload_images', options: ['expose' => true], methods: 'POST')]
    public function upload(Request $request, RaRando $obj, ApiResponse $apiResponse, RaRandoRepository $repository,
                           RandoImageUploader $randoImageUploader, RaImageRepository $imageRepository): Response
    {
        if($request->files){
            $mtime = $request->get('mtime') !== null ? (int) $request->get('mtime') : null;
            foreach($request->files as $file){
                $image = $randoImageUploader->createFromUpload($file, $obj, $this->getUser(), null, $mtime);

                if ($image === null) {
                    continue;
                }

                $imageRepository->save($image);
            }

            $repository->save($obj, true);
        }

        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/image/delete/{id}', name: 'image_delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(RaImage $obj, ApiResponse $apiResponse, RaImageRepository $repository,
                           FileUploader $fileUploader): Response
    {
        $fileUploader->deleteFile($obj->getFile(), RaRando::FOLDER_IMAGES.'/'.$obj->getRando()->getId(), false);
        $fileUploader->deleteFile($obj->getThumbs(), RaRando::FOLDER_THUMBS.'/'.$obj->getRando()->getId(), false);
        $fileUploader->deleteFile($obj->getLightbox(), RaRando::FOLDER_LIGHTBOX.'/'.$obj->getRando()->getId(), false);

        $repository->remove($obj, true);

        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/delete', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function deletes(Request $request, ApiResponse $apiResponse, RaImageRepository $repository,
                           FileUploader $fileUploader): Response
    {
        $data = json_decode($request->getContent());

        if($data == null || !isset($data->selected)){
            return $apiResponse->apiJsonResponseBadRequest("Mauvaise données.");
        }

        $objs = $repository->findBy(['id' => $data->selected]);

        foreach($objs as $obj){
            $fileUploader->deleteFile($obj->getFile(), RaRando::FOLDER_IMAGES.'/'.$obj->getRando()->getId(), false);
            $fileUploader->deleteFile($obj->getThumbs(), RaRando::FOLDER_THUMBS.'/'.$obj->getRando()->getId(), false);
            $fileUploader->deleteFile($obj->getLightbox(), RaRando::FOLDER_LIGHTBOX.'/'.$obj->getRando()->getId(), false);

            $repository->remove($obj);
        }

        $repository->flush();
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/download/{id}', name: 'download', options: ['expose' => true], methods: 'GET')]
    public function download(RaImage $obj): Response
    {
        return $this->file($this->getParameter('private_directory') . RaRando::FOLDER_IMAGES . '/' . $obj->getRando()->getId() . '/' . $obj->getFile());
    }

    #[Route('/download-selected', name: 'download_selected', options: ['expose' => true], methods: 'POST')]
    public function downloadSelected(Request $request, RaImageRepository $repository, ApiResponse $apiResponse): BinaryFileResponse|JsonResponse
    {
        $data = json_decode($request->getContent());

        if (!is_array($data->imageIds) || empty($data->imageIds)) {
            return $apiResponse->apiJsonResponseBadRequest("Aucune image sélectionnée.");
        }

        $imageIds = $data->imageIds;

        $images = $repository->findBy(['id' => $imageIds]);

        if (empty($images)) {
            return $apiResponse->apiJsonResponseBadRequest("Aucune image trouvée.");
        }

        $zipFilename = 'selection_' . date('YmdHis') . '_' . uniqid() . '.zip';
        $zipPath = sys_get_temp_dir() . '/' . $zipFilename;

        // Créer le ZIP
        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            return $apiResponse->apiJsonResponseBadRequest("Impossible de créer l'archive ZIP.");
        }

        $imagesDirectory = $this->getParameter('private_directory');
        $addedCount = 0;

        /** @var RaImage $image */
        foreach ($images as $image) {
            $filePath = $imagesDirectory . $image->getFileFile();

            if (file_exists($filePath)) {
                $zip->addFile($filePath, $image->getFile());
                $addedCount++;
            }
        }

        $zip->close();

        if ($addedCount === 0) {
            @unlink($zipPath);
            return $apiResponse->apiJsonResponseBadRequest("Aucun fichier valide à télécharger.");
        }

        $response = $this->file($zipPath, 'selection_photos_' . count($images) . '.zip');
        $response->deleteFileAfterSend(true);

        return $response;
    }

    #[Route('/src/thumbs/{id}', name: 'thumbs_src', options: ['expose' => true], methods: 'GET')]
    public function getThumbs(RaImage $obj): Response
    {
        return $this->file($this->getParameter('private_directory') . $obj->getThumbsFile());
    }

    #[Route('/src/file/{id}', name: 'file_src', options: ['expose' => true], methods: 'GET')]
    public function getFile(RaImage $obj): Response
    {
        return $this->file($this->getParameter('private_directory') . $obj->getFileFile());
    }

    #[Route('/src/file-hd/{id}', name: 'file_hd_src', options: ['expose' => true], methods: 'GET')]
    public function getFileHD(RaImage $obj): Response
    {
        return $this->file($this->getParameter('private_directory') . $obj->getLightboxFile());
    }

    #[Route('/visibility/{id}', name: 'visibility', options: ['expose' => true], methods: 'PUT')]
    public function visibility(RaImage $obj, RaImageRepository $repository, ApiResponse $apiResponse): Response
    {
        $obj->setVisibility(!$obj->getVisibility());

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, RaImage::LIST);
    }

    /**
     * Corrige la date de prise de vue d'une photo. Utile quand l'EXIF a été supprimé :
     * la date était retombée sur la date d'upload, cassant le tri chronologique de l'album.
     */
    #[Route('/taken-at/{id}', name: 'taken_at', options: ['expose' => true], methods: 'PUT')]
    public function takenAt(RaImage $obj, Request $request, RaImageRepository $repository, ApiResponse $apiResponse): Response
    {
        $data = json_decode($request->getContent());
        $value = is_object($data) ? (string) ($data->takenAt ?? '') : '';

        $date = \DateTime::createFromFormat('Y-m-d\TH:i', $value)
            ?: \DateTime::createFromFormat('Y-m-d\TH:i:s', $value)
            ?: \DateTime::createFromFormat('!Y-m-d', $value);

        if (!$date) {
            return $apiResponse->apiJsonResponseBadRequest('Date invalide.');
        }

        $obj->setTakenAt($date);

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, RaImage::LIST);
    }
}
