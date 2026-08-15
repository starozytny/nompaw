<?php

namespace App\Controller\InternApi\Photos;

use App\Entity\Main\User;
use App\Entity\Photo\PhMedia;
use App\Repository\Main\UserRepository;
use App\Repository\Photo\PhAlbumRepository;
use App\Repository\Photo\PhMediaRepository;
use App\Repository\Photo\PhShareLinkRepository;
use App\Service\Api\ApiResponse;
use App\Service\FileUploader;
use DateTime;
use getID3;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use ZipArchive;

#[Route('/intern/api/photos/media', name: 'intern_api_photos_media_')]
class MediaController extends AbstractController
{
    const MEDIA_PER_PAGE = 24;

    #[Route('/fetch/{page}', name: 'fetch', options: ['expose' => true], methods: 'GET')]
    public function fetch(Request $request, int $page, PhMediaRepository $repository, UserRepository $userRepository,
                          PhAlbumRepository $albumRepository, PhShareLinkRepository $shareLinkRepository,
                          ApiResponse $apiResponse, SerializerInterface $serializer): JsonResponse
    {
        $author = $request->query->get('authorId') ? $userRepository->find($request->query->get('authorId')) : null;
        $album = $request->query->get('albumId') ? $albumRepository->find($request->query->get('albumId')) : null;

        $offset = ($page - 1) * self::MEDIA_PER_PAGE;

        $currentMedia = $repository->findFilteredPage($author, $album, $offset, self::MEDIA_PER_PAGE);
        $totalMedia = $repository->countFiltered($author, $album);
        $hasMore = ($offset + self::MEDIA_PER_PAGE) < $totalMedia;

        $currentMediaData = json_decode($serializer->serialize($currentMedia, 'json', ['groups' => PhMedia::LIST]));

        $sharedUntil = $shareLinkRepository->findActiveIndexedByMediaIds(array_map(fn (PhMedia $m) => $m->getId(), $currentMedia));
        $this->applySharedUntil($currentMediaData, $sharedUntil);

        // La liste complète (nécessaire côté front pour le saut direct à un mois et pour la
        // navigation dans la lightbox) n'est envoyée qu'à la première page : la renvoyer en
        // entier à chaque page de scroll infini forçait Doctrine à hydrater et sérialiser toute
        // la photothèque à chaque requête, pour un contenu identique déjà en mémoire côté client.
        $allMediaData = null;
        if ($page === 1) {
            $allMedia = $repository->findFiltered($author, $album);
            $allMediaData = json_decode($serializer->serialize($allMedia, 'json', ['groups' => PhMedia::LIST]));
        }

        return $apiResponse->apiJsonResponseCustom([
            'media' => $allMediaData,
            'currentMedia' => $currentMediaData,
            'hasMore' => $hasMore,
            'total' => $totalMedia,
            'page' => $page,
        ]);
    }

    /**
     * @param array<int, \DateTime> $sharedUntil [mediaId => expiresAt]
     */
    private function applySharedUntil(array $items, array $sharedUntil): void
    {
        foreach ($items as $item) {
            $item->sharedUntil = isset($sharedUntil[$item->id]) ? $sharedUntil[$item->id]->format('c') : null;
        }
    }

    #[Route('/authors', name: 'authors', options: ['expose' => true], methods: 'GET')]
    public function authors(PhMediaRepository $repository, ApiResponse $apiResponse): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $authors = $repository->findAuthors();

        if (!in_array($user, $authors, true)) {
            $authors[] = $user;
        }

        $data = array_map(fn (User $u) => [
            'id' => $u->getId(),
            'displayName' => $u->getDisplayName(),
            'avatarFile' => $u->getAvatarFile(),
        ], $authors);

        return $apiResponse->apiJsonResponseData($data);
    }

    #[Route('/stats', name: 'stats', options: ['expose' => true], methods: 'GET')]
    public function stats(PhMediaRepository $repository, ApiResponse $apiResponse): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if (!$user->getIsAdmin()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        return $apiResponse->apiJsonResponseCustom([
            'totalSize' => $repository->getTotalSize(),
        ]);
    }

    #[Route('/upload', name: 'upload', options: ['expose' => true], methods: 'POST')]
    public function upload(Request $request, ApiResponse $apiResponse, PhMediaRepository $mediaRepository,
                           PhAlbumRepository $albumRepository, FileUploader $fileUploader): Response
    {
        if ($request->files) {
            $album = $request->get('albumId') ? $albumRepository->find($request->get('albumId')) : null;

            foreach ($request->files as $file) {
                $fileSize = $file->getSize();

                // Lu AVANT uploadDrive() : sa correction d'orientation (GD, pour les JPEG mal
                // orientés — la quasi-totalité des photos de téléphone) réécrit le fichier et
                // efface tout l'EXIF au passage, DateTimeOriginal compris. Lu après coup, la date
                // de prise de vue retombait donc systématiquement sur mtime (date d'upload) dès
                // qu'une rotation était nécessaire.
                $exif = @exif_read_data($file->getPathname());

                // keepOriginalSize=true : contrairement aux photos de rando, le but de cet espace
                // est justement de conserver les photos/vidéos du téléphone en pleine résolution.
                $filename = $fileUploader->uploadDrive($file, PhMedia::FOLDER, true);

                if ($filename === false) {
                    continue;
                }

                $media = (new PhMedia())
                    ->setFile($filename)
                    ->setFileSize($fileSize)
                    ->setMTime($request->get('mtime'))
                    ->setAuthor($this->getUser())
                    ->setAlbum($album)
                ;

                if ($exif && isset($exif['DateTimeOriginal'])) {
                    $date = \DateTime::createFromFormat('Y:m:d H:i:s', $exif['DateTimeOriginal']);
                    $media->setTakenAt($date ?: new \DateTime());
                } else {
                    $date = new DateTime();
                    $media->setTakenAt($date->setTimestamp($request->get('mtime')));
                }

                $fileUploaded = $this->getParameter('private_directory') . $media->getFileFile();
                $mime = mime_content_type($fileUploaded);

                if (str_contains($mime, "image/")) {
                    $media->setType(0);
                } elseif (str_contains($mime, "video/")) {
                    $media->setType(1);

                    $getID3 = new getID3();
                    $info = $getID3->analyze($fileUploaded);

                    if (isset($info['quicktime']['timestamps_unix']['create']['moov mvhd'])) {
                        $timestamp = $info['quicktime']['timestamps_unix']['create']['moov mvhd'];

                        if ($timestamp > 946684800 && $timestamp < 4102444800) {
                            $date = new DateTime();
                            $media->setTakenAt($date->setTimestamp($timestamp));
                        }
                    }
                } else {
                    $media->setType(99);
                }

                [$filenameThumbs, $filenameLightbox] = $fileUploader->thumbsAndLightbox($media->getFile(), PhMedia::FOLDER, PhMedia::FOLDER_THUMBS, PhMedia::FOLDER_LIGHTBOX);

                $media
                    ->setThumbs($filenameThumbs)
                    ->setLightbox($filenameLightbox)
                ;

                $mediaRepository->save($media);
            }

            $mediaRepository->flush();
        }

        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/media/{id}/album', name: 'assign_album', options: ['expose' => true], methods: 'PUT')]
    public function assignAlbum(PhMedia $obj, Request $request, PhMediaRepository $repository,
                                PhAlbumRepository $albumRepository, ApiResponse $apiResponse): Response
    {
        /** @var User $user */
        $user = $this->getUser();

        if ($obj->getAuthor() !== $user && !$user->getIsAdmin()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $data = json_decode($request->getContent());
        $album = !empty($data->albumId ?? null) ? $albumRepository->find($data->albumId) : null;

        $obj->setAlbum($album);
        $repository->save($obj, true);

        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/media/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(PhMedia $obj, ApiResponse $apiResponse, PhMediaRepository $repository,
                           FileUploader $fileUploader): Response
    {
        /** @var User $user */
        $user = $this->getUser();

        if ($obj->getAuthor() !== $user && !$user->getIsAdmin()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $fileUploader->deleteFile($obj->getFile(), PhMedia::FOLDER, false);
        $fileUploader->deleteFile($obj->getThumbs(), PhMedia::FOLDER_THUMBS, false);
        $fileUploader->deleteFile($obj->getLightbox(), PhMedia::FOLDER_LIGHTBOX, false);

        $repository->remove($obj, true);

        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/delete', name: 'deletes', options: ['expose' => true], methods: 'DELETE')]
    public function deletes(Request $request, ApiResponse $apiResponse, PhMediaRepository $repository,
                            FileUploader $fileUploader): Response
    {
        /** @var User $user */
        $user = $this->getUser();

        $data = json_decode($request->getContent());

        if ($data == null || !isset($data->selected)) {
            return $apiResponse->apiJsonResponseBadRequest("Mauvaise données.");
        }

        $objs = $repository->findBy(['id' => $data->selected]);

        foreach ($objs as $obj) {
            if ($obj->getAuthor() !== $user && !$user->getIsAdmin()) {
                return $apiResponse->apiJsonResponseForbidden();
            }
        }

        foreach ($objs as $obj) {
            $fileUploader->deleteFile($obj->getFile(), PhMedia::FOLDER, false);
            $fileUploader->deleteFile($obj->getThumbs(), PhMedia::FOLDER_THUMBS, false);
            $fileUploader->deleteFile($obj->getLightbox(), PhMedia::FOLDER_LIGHTBOX, false);

            $repository->remove($obj);
        }

        $repository->flush();

        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/download/{id}', name: 'download', options: ['expose' => true], methods: 'GET')]
    public function download(PhMedia $obj): Response
    {
        return $this->file($this->getParameter('private_directory') . PhMedia::FOLDER . '/' . $obj->getFile());
    }

    #[Route('/download-selected', name: 'download_selected', options: ['expose' => true], methods: 'POST')]
    public function downloadSelected(Request $request, PhMediaRepository $repository, ApiResponse $apiResponse): BinaryFileResponse|JsonResponse
    {
        $data = json_decode($request->getContent());

        if (!is_array($data->mediaIds ?? null) || empty($data->mediaIds)) {
            return $apiResponse->apiJsonResponseBadRequest("Aucun média sélectionné.");
        }

        $mediaItems = $repository->findBy(['id' => $data->mediaIds]);

        if (empty($mediaItems)) {
            return $apiResponse->apiJsonResponseBadRequest("Aucun média trouvé.");
        }

        $zipFilename = 'selection_' . date('YmdHis') . '_' . uniqid() . '.zip';
        $zipPath = sys_get_temp_dir() . '/' . $zipFilename;

        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            return $apiResponse->apiJsonResponseBadRequest("Impossible de créer l'archive ZIP.");
        }

        $mediaDirectory = $this->getParameter('private_directory');
        $addedCount = 0;

        /** @var PhMedia $media */
        foreach ($mediaItems as $media) {
            $filePath = $mediaDirectory . $media->getFileFile();

            if (file_exists($filePath)) {
                $zip->addFile($filePath, $media->getFile());
                $addedCount++;
            }
        }

        $zip->close();

        if ($addedCount === 0) {
            @unlink($zipPath);
            return $apiResponse->apiJsonResponseBadRequest("Aucun fichier valide à télécharger.");
        }

        $response = $this->file($zipPath, 'selection_photos_' . count($mediaItems) . '.zip');
        $response->deleteFileAfterSend(true);

        return $response;
    }

    #[Route('/src/thumbs/{id}', name: 'thumbs_src', options: ['expose' => true], methods: 'GET')]
    public function getThumbs(PhMedia $obj): Response
    {
        return $this->file($this->getParameter('private_directory') . $obj->getThumbsFile());
    }

    #[Route('/src/file/{id}', name: 'file_src', options: ['expose' => true], methods: 'GET')]
    public function getFile(PhMedia $obj): Response
    {
        return $this->file($this->getParameter('private_directory') . $obj->getFileFile());
    }

    #[Route('/src/file-hd/{id}', name: 'file_hd_src', options: ['expose' => true], methods: 'GET')]
    public function getFileHD(PhMedia $obj): Response
    {
        return $this->file($this->getParameter('private_directory') . $obj->getLightboxFile());
    }
}
