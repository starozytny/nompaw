<?php

namespace App\Controller\InternApi\Drive;

use App\Entity\Drive\DrFile;
use App\Entity\Main\User;
use App\Repository\Drive\DrFileRepository;
use App\Service\Api\ApiResponse;
use App\Service\FileUploader;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

#[Route('/intern/api/drive', name: 'intern_api_drive_')]
class DriveController extends AbstractController
{
    #[Route('/list', name: 'list', options: ['expose' => true], methods: 'GET')]
    public function list(DrFileRepository $repository, ApiResponse $apiResponse): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        return $this->state($user, $repository, $apiResponse);
    }

    #[Route('/upload', name: 'upload', options: ['expose' => true], methods: 'POST')]
    public function upload(Request $request, DrFileRepository $repository, ApiResponse $apiResponse): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        /** @var UploadedFile[] $files */
        $files = $request->files->all('files');
        if (count($files) === 0) {
            return $apiResponse->apiJsonResponseBadRequest('Aucun fichier reçu.');
        }

        $total = 0;
        foreach ($files as $file) {
            if (!$file->isValid()) {
                return $apiResponse->apiJsonResponseBadRequest('Le fichier "' . $file->getClientOriginalName() . '" n\'a pas pu être envoyé (trop volumineux ?).');
            }
            $total += $file->getSize();
        }

        $used = $repository->getUsedSize($user);
        if ($used + $total > $user->getDriveQuota()) {
            return $apiResponse->apiJsonResponseBadRequest('Espace insuffisant : il te reste ' . $this->formatSize(max(0, $user->getDriveQuota() - $used)) . '.');
        }

        $directory = $this->getParameter('private_directory') . DrFile::FOLDER . '/' . $user->getId();
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        foreach ($files as $file) {
            $size = $file->getSize();
            $mime = $file->getMimeType();
            $extension = $file->guessExtension() ?: $file->getClientOriginalExtension();
            $fileName = uniqid('', true) . ($extension ? '.' . $extension : '');

            try {
                $file->move($directory, $fileName);
            } catch (FileException) {
                return $apiResponse->apiJsonResponseBadRequest('Le fichier "' . $file->getClientOriginalName() . '" n\'a pas pu être enregistré.');
            }

            $repository->save((new DrFile())
                ->setOwner($user)
                ->setName(mb_substr($file->getClientOriginalName(), 0, 255))
                ->setFile($fileName)
                ->setMime($mime)
                ->setSize($size)
            , true);
        }

        return $this->state($user, $repository, $apiResponse);
    }

    #[Route('/download/{id}', name: 'download', options: ['expose' => true], methods: 'GET')]
    public function download(DrFile $obj, ApiResponse $apiResponse): BinaryFileResponse|JsonResponse
    {
        if ($obj->getOwner() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $path = $this->getParameter('private_directory') . $obj->getFolder() . '/' . $obj->getFile();
        if (!is_file($path)) {
            return $apiResponse->apiJsonResponseBadRequest("Le fichier n'existe pas.");
        }

        return $this->file($path, $obj->getName());
    }

    #[Route('/rename/{id}', name: 'rename', options: ['expose' => true], methods: 'PUT')]
    public function rename(DrFile $obj, Request $request, DrFileRepository $repository, ApiResponse $apiResponse): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if ($obj->getOwner() !== $user) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $name = trim((string) (json_decode($request->getContent())->name ?? ''));
        // « / » et « \ » sont refusés par Content-Disposition (le téléchargement planterait).
        if ($name === '' || mb_strlen($name) > 255 || preg_match('#[/\\\\\x00-\x1F\x7F]#', $name)) {
            return $apiResponse->apiJsonResponseValidationFailed([
                ['name' => 'name', 'message' => 'Nom invalide : 1 à 255 caractères, sans « / » ni « \\ ».']
            ]);
        }

        $repository->save($obj->setName($name), true);

        return $this->state($user, $repository, $apiResponse);
    }

    #[Route('/share/{id}', name: 'share', options: ['expose' => true], methods: 'POST')]
    public function share(DrFile $obj, DrFileRepository $repository, ApiResponse $apiResponse): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if ($obj->getOwner() !== $user) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        if (!$obj->getShareToken()) {
            $repository->save($obj->setShareToken(bin2hex(random_bytes(32))), true);
        }

        return $this->state($user, $repository, $apiResponse);
    }

    #[Route('/share/{id}', name: 'unshare', options: ['expose' => true], methods: 'DELETE')]
    public function unshare(DrFile $obj, DrFileRepository $repository, ApiResponse $apiResponse): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if ($obj->getOwner() !== $user) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        // Supprimer le jeton invalide définitivement l'ancien lien ; un nouveau partage en crée un autre.
        $repository->save($obj->setShareToken(null), true);

        return $this->state($user, $repository, $apiResponse);
    }

    #[Route('/thumb/{id}', name: 'thumb', options: ['expose' => true], methods: 'GET')]
    public function thumb(DrFile $obj, FileUploader $fileUploader): Response
    {
        if ($obj->getOwner() !== $this->getUser()) {
            throw $this->createAccessDeniedException();
        }

        // Miniature WebP générée à la première demande puis servie depuis le disque (le contenu
        // d'un fichier du Drive ne change jamais pour un id donné, donc cache navigateur sûr).
        $mini = str_starts_with((string) $obj->getMime(), 'image/')
            ? $fileUploader->miniature($obj->getFolder() . '/' . $obj->getFile(), $this->thumbFolder($obj), $this->thumbName($obj), 480)
            : null;

        return $fileUploader->cachedImage($mini);
    }

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(DrFile $obj, DrFileRepository $repository, ApiResponse $apiResponse): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if ($obj->getOwner() !== $user) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $path = $this->getParameter('private_directory') . $obj->getFolder() . '/' . $obj->getFile();
        if (is_file($path)) {
            unlink($path);
        }
        $thumb = $this->getParameter('private_directory') . $this->thumbFolder($obj) . '/' . $this->thumbName($obj);
        if (is_file($thumb)) {
            unlink($thumb);
        }

        $repository->remove($obj, true);

        return $this->state($user, $repository, $apiResponse);
    }

    private function state(User $user, DrFileRepository $repository, ApiResponse $apiResponse): JsonResponse
    {
        $files = $repository->findBy(['owner' => $user], ['createdAt' => 'DESC']);

        return $apiResponse->apiJsonResponseCustom([
            'files' => array_map(fn (DrFile $f) => [
                'id' => $f->getId(),
                'name' => $f->getName(),
                'mime' => $f->getMime(),
                'size' => $f->getSize(),
                'createdAt' => $f->getCreatedAt()->format('c'),
                'shareUrl' => $f->getShareToken()
                    ? $this->generateUrl('app_drive_share', ['token' => $f->getShareToken()], UrlGeneratorInterface::ABSOLUTE_URL)
                    : null,
            ], $files),
            'used' => $repository->getUsedSize($user),
            'quota' => $user->getDriveQuota(),
        ]);
    }

    private function thumbFolder(DrFile $obj): string
    {
        return $obj->getFolder() . '/thumbs';
    }

    private function thumbName(DrFile $obj): string
    {
        return pathinfo($obj->getFile(), PATHINFO_FILENAME) . '.webp';
    }

    private function formatSize(int $bytes): string
    {
        if ($bytes >= 1024 * 1024) {
            return round($bytes / 1024 / 1024, 1) . ' Mo';
        }

        return round($bytes / 1024) . ' Ko';
    }
}
