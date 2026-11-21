<?php

namespace App\Controller\InternApi\Drive;

use App\Entity\Drive\DrAlbum;
use App\Entity\Drive\DrFile;
use App\Entity\Drive\DrShortcut;
use App\Entity\Main\User;
use App\Repository\Drive\DrAlbumRepository;
use App\Repository\Drive\DrFileRepository;
use App\Repository\Drive\DrShortcutRepository;
use Doctrine\ORM\EntityManagerInterface;
use App\Service\Api\ApiResponse;
use App\Service\FileUploader;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

#[Route('/intern/api/drive', name: 'intern_api_drive_')]
class DriveController extends AbstractController
{
    /** Mêmes durées que les partages de photos. */
    private const SHARE_DURATIONS = ['1d' => 1, '7d' => 7, '30d' => 30];

    public function __construct(
        private readonly DrAlbumRepository $albumRepository,
        private readonly DrShortcutRepository $shortcutRepository,
    ) {
    }

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

        $album = null;
        if ($request->request->get('albumId')) {
            $album = $this->albumRepository->findOneBy(['id' => $request->request->getInt('albumId'), 'owner' => $user]);
            if (!$album) {
                return $apiResponse->apiJsonResponseBadRequest("Ce dossier n'existe pas.");
            }
        }

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
                ->setAlbum($album)
            , true);
        }

        return $this->state($user, $repository, $apiResponse);
    }

    #[Route('/download/{id}', name: 'download', options: ['expose' => true], methods: 'GET')]
    public function download(DrFile $obj, Request $request, ApiResponse $apiResponse): BinaryFileResponse|JsonResponse
    {
        if ($obj->getOwner() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $path = $this->getParameter('private_directory') . $obj->getFolder() . '/' . $obj->getFile();
        if (!is_file($path)) {
            return $apiResponse->apiJsonResponseBadRequest("Le fichier n'existe pas.");
        }

        // ?inline=1 : ouvrir un PDF dans la visionneuse du navigateur (toutes les pages) ; jamais pour un autre type (HTML/SVG = XSS).
        $inline = $request->query->getBoolean('inline') && $obj->getMime() === 'application/pdf';
        $response = $this->file($path, $obj->getName(), $inline ? ResponseHeaderBag::DISPOSITION_INLINE : ResponseHeaderBag::DISPOSITION_ATTACHMENT);
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        return $response;
    }

    #[Route('/rename/{id}', name: 'rename', options: ['expose' => true], methods: 'PUT')]
    public function rename(DrFile $obj, Request $request, DrFileRepository $repository, ApiResponse $apiResponse): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if ($obj->getOwner() !== $user) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $name = $this->validName($request);
        if ($name === null) {
            return $this->invalidName($apiResponse);
        }

        $repository->save($obj->setName($name), true);

        return $this->state($user, $repository, $apiResponse);
    }

    #[Route('/move/{id}', name: 'move', options: ['expose' => true], methods: 'PUT')]
    public function move(DrFile $obj, Request $request, DrFileRepository $repository, ApiResponse $apiResponse): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if ($obj->getOwner() !== $user) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $albumId = json_decode($request->getContent())->albumId ?? null;
        $album = $albumId ? $this->albumRepository->findOneBy(['id' => (int) $albumId, 'owner' => $user]) : null;
        if ($albumId && !$album) {
            return $apiResponse->apiJsonResponseBadRequest("Ce dossier n'existe pas.");
        }

        // Un raccourci vers ce fichier dans son nouveau dossier ferait doublon.
        foreach ($this->shortcutRepository->findBy(['file' => $obj, 'album' => $album]) as $shortcut) {
            $this->shortcutRepository->remove($shortcut);
        }
        $repository->save($obj->setAlbum($album), true);

        return $this->state($user, $repository, $apiResponse);
    }

    #[Route('/shortcuts', name: 'shortcut_create', options: ['expose' => true], methods: 'POST')]
    public function createShortcut(Request $request, DrFileRepository $repository, ApiResponse $apiResponse): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent());

        $file = $repository->findOneBy(['id' => (int) ($data->fileId ?? 0), 'owner' => $user]);
        if (!$file) {
            return $apiResponse->apiJsonResponseBadRequest("Ce fichier n'existe pas.");
        }

        $albumId = $data->albumId ?? null;
        $album = $albumId ? $this->albumRepository->findOneBy(['id' => (int) $albumId, 'owner' => $user]) : null;
        if ($albumId && !$album) {
            return $apiResponse->apiJsonResponseBadRequest("Ce dossier n'existe pas.");
        }
        if ($file->getAlbum() === $album) {
            return $apiResponse->apiJsonResponseBadRequest('Le fichier est déjà dans ce dossier.');
        }
        if ($this->shortcutRepository->findOneBy(['file' => $file, 'album' => $album])) {
            return $apiResponse->apiJsonResponseBadRequest('Ce raccourci existe déjà.');
        }

        $this->shortcutRepository->save((new DrShortcut())->setOwner($user)->setFile($file)->setAlbum($album), true);

        return $this->state($user, $repository, $apiResponse);
    }

    /** Retire le raccourci ; le fichier n'est pas touché. */
    #[Route('/shortcuts/{id}', name: 'shortcut_delete', options: ['expose' => true], methods: 'DELETE')]
    public function deleteShortcut(DrShortcut $shortcut, DrFileRepository $repository, ApiResponse $apiResponse): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if ($shortcut->getOwner() !== $user) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $this->shortcutRepository->remove($shortcut, true);

        return $this->state($user, $repository, $apiResponse);
    }

    #[Route('/albums', name: 'album_create', options: ['expose' => true], methods: 'POST')]
    public function createAlbum(Request $request, DrFileRepository $repository, ApiResponse $apiResponse): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $name = $this->validName($request);
        if ($name === null) {
            return $this->invalidName($apiResponse);
        }

        $parentId = json_decode($request->getContent())->parentId ?? null;
        $parent = $parentId ? $this->albumRepository->findOneBy(['id' => (int) $parentId, 'owner' => $user]) : null;
        if ($parentId && !$parent) {
            return $apiResponse->apiJsonResponseBadRequest("Ce dossier n'existe pas.");
        }

        $this->albumRepository->save((new DrAlbum())->setOwner($user)->setName($name)->setParent($parent), true);

        return $this->state($user, $repository, $apiResponse);
    }

    #[Route('/albums/{id}', name: 'album_rename', options: ['expose' => true], methods: 'PUT')]
    public function renameAlbum(DrAlbum $album, Request $request, DrFileRepository $repository, ApiResponse $apiResponse): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if ($album->getOwner() !== $user) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $name = $this->validName($request);
        if ($name === null) {
            return $this->invalidName($apiResponse);
        }

        $this->albumRepository->save($album->setName($name), true);

        return $this->state($user, $repository, $apiResponse);
    }

    #[Route('/albums/{id}/move', name: 'album_move', options: ['expose' => true], methods: 'PUT')]
    public function moveAlbum(DrAlbum $album, Request $request, DrFileRepository $repository, ApiResponse $apiResponse): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if ($album->getOwner() !== $user) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $parentId = json_decode($request->getContent())->parentId ?? null;
        $parent = $parentId ? $this->albumRepository->findOneBy(['id' => (int) $parentId, 'owner' => $user]) : null;
        if ($parentId && !$parent) {
            return $apiResponse->apiJsonResponseBadRequest("Ce dossier n'existe pas.");
        }
        // Ni dans lui-même, ni dans un de ses descendants : l'arborescence formerait une boucle.
        for ($a = $parent; $a !== null; $a = $a->getParent()) {
            if ($a === $album) {
                return $apiResponse->apiJsonResponseBadRequest('Impossible de déplacer un dossier dans lui-même ou dans un de ses sous-dossiers.');
            }
        }

        $this->albumRepository->save($album->setParent($parent), true);

        return $this->state($user, $repository, $apiResponse);
    }

    #[Route('/albums/{id}', name: 'album_delete', options: ['expose' => true], methods: 'DELETE')]
    public function deleteAlbum(DrAlbum $album, DrFileRepository $repository, ApiResponse $apiResponse, EntityManagerInterface $em): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if ($album->getOwner() !== $user) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        // Son contenu (fichiers et sous-dossiers) remonte dans le parent : rien n'est supprimé. Mises à jour en DQL ;
        // aucun fichier ni sous-dossier n'est chargé avant, donc state() les relit à jour depuis la base.
        $parent = $album->getParent();
        $repository->createQueryBuilder('f')->update()->set('f.album', ':parent')->where('f.album = :album')
            ->setParameter('parent', $parent)->setParameter('album', $album)->getQuery()->execute();
        $this->albumRepository->createQueryBuilder('a')->update()->set('a.parent', ':parent')->where('a.parent = :album')
            ->setParameter('parent', $parent)->setParameter('album', $album)->getQuery()->execute();
        $this->shortcutRepository->createQueryBuilder('s')->update()->set('s.album', ':parent')->where('s.album = :album')
            ->setParameter('parent', $parent)->setParameter('album', $album)->getQuery()->execute();
        // Après remontée, retirer les raccourcis devenus inutiles : vers le dossier même du fichier, ou en double (<=> compare aussi NULL).
        $conn = $em->getConnection();
        $conn->executeStatement('DELETE s FROM dr_shortcut s JOIN dr_file f ON f.id = s.file_id WHERE s.owner_id = ? AND s.album_id <=> f.album_id', [$user->getId()]);
        $conn->executeStatement('DELETE s1 FROM dr_shortcut s1 JOIN dr_shortcut s2 ON s1.file_id = s2.file_id AND s1.album_id <=> s2.album_id AND s1.id > s2.id WHERE s1.owner_id = ?', [$user->getId()]);
        $this->albumRepository->remove($album, true);

        return $this->state($user, $repository, $apiResponse);
    }

    /** Crée le lien, ou change sa durée (à partir de maintenant) en gardant le même lien. */
    #[Route('/share/{id}', name: 'share', options: ['expose' => true], methods: 'POST')]
    public function share(DrFile $obj, Request $request, DrFileRepository $repository, ApiResponse $apiResponse): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if ($obj->getOwner() !== $user) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $days = self::SHARE_DURATIONS[json_decode($request->getContent())->duration ?? ''] ?? null;
        if ($days === null) {
            return $apiResponse->apiJsonResponseBadRequest('Durée de partage invalide.');
        }

        $repository->save($obj
            ->setShareToken($obj->getShareToken() ?? bin2hex(random_bytes(32)))
            ->setShareExpiresAt(new \DateTimeImmutable("+{$days} days"))
        , true);

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
        $repository->save($obj->setShareToken(null)->setShareExpiresAt(null), true);

        return $this->state($user, $repository, $apiResponse);
    }

    #[Route('/thumb/{id}', name: 'thumb', options: ['expose' => true], methods: 'GET')]
    public function thumb(DrFile $obj, Request $request, FileUploader $fileUploader): Response
    {
        if ($obj->getOwner() !== $this->getUser()) {
            throw $this->createAccessDeniedException();
        }

        // Miniature WebP générée à la première demande puis servie depuis le disque (le contenu
        // d'un fichier du Drive ne change jamais pour un id donné, donc cache navigateur sûr).
        // Images et PDF. ?large=1 : version lisible pour la visionneuse ; ?page=N (PDF, à partir de 0) : page à rendre.
        $large = $request->query->getBoolean('large');
        $isPdf = $obj->getMime() === 'application/pdf';
        $page = $isPdf ? max(0, min(9999, $request->query->getInt('page'))) : 0;
        $previewable = $isPdf || str_starts_with((string) $obj->getMime(), 'image/');
        $mini = $previewable
            ? $fileUploader->miniature($obj->getFolder() . '/' . $obj->getFile(), $this->thumbFolder($obj), $this->thumbName($obj, $large, $page), $large ? 1400 : 480, $page)
            : null;
        // Pas d'aperçu (type non géré, PDF abîmé, format illisible) : 404 pour que le client affiche l'icône du type
        // plutôt que l'image de remplacement générique.
        if (!$mini) {
            throw $this->createNotFoundException();
        }

        return $fileUploader->cachedImage($mini);
    }

    #[Route('/pdf-pages/{id}', name: 'pdf_pages', options: ['expose' => true], methods: 'GET')]
    public function pdfPages(DrFile $obj, ApiResponse $apiResponse, FileUploader $fileUploader): JsonResponse
    {
        if ($obj->getOwner() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden();
        }
        if ($obj->getMime() !== 'application/pdf') {
            return $apiResponse->apiJsonResponseBadRequest("Ce fichier n'est pas un PDF.");
        }

        // Compter lance Ghostscript : résultat gardé à côté des rendus de pages.
        $cache = $this->getParameter('private_directory') . $this->thumbFolder($obj) . '/' . pathinfo($obj->getFile(), PATHINFO_FILENAME) . '.pages';
        if (is_file($cache)) {
            $pages = (int) file_get_contents($cache);
        } else {
            $pages = $fileUploader->pdfPageCount($obj->getFolder() . '/' . $obj->getFile());
            if ($pages > 0) {
                if (!is_dir(dirname($cache))) {
                    mkdir(dirname($cache), 0755, true);
                }
                file_put_contents($cache, (string) $pages);
            }
        }

        return $apiResponse->apiJsonResponseCustom(['pages' => $pages]);
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
        // Tous les dérivés du fichier : miniatures, version large, pages de PDF, nombre de pages.
        $base = $this->getParameter('private_directory') . $this->thumbFolder($obj) . '/' . pathinfo($obj->getFile(), PATHINFO_FILENAME);
        foreach (glob($base . '*') ?: [] as $derived) {
            unlink($derived);
        }

        $repository->remove($obj, true);

        return $this->state($user, $repository, $apiResponse);
    }

    private function state(User $user, DrFileRepository $repository, ApiResponse $apiResponse): JsonResponse
    {
        $files = $repository->findBy(['owner' => $user], ['createdAt' => 'DESC']);
        $albums = $this->albumRepository->findBy(['owner' => $user], ['name' => 'ASC']);

        return $apiResponse->apiJsonResponseCustom([
            'shortcuts' => array_map(fn (DrShortcut $sc) => ['id' => $sc->getId(), 'fileId' => $sc->getFile()->getId(), 'albumId' => $sc->getAlbum()?->getId()],
                $this->shortcutRepository->findBy(['owner' => $user])),
            'albums' => array_map(fn (DrAlbum $a) => ['id' => $a->getId(), 'name' => $a->getName(), 'parentId' => $a->getParent()?->getId()], $albums),
            'files' => array_map(fn (DrFile $f) => [
                'id' => $f->getId(),
                'name' => $f->getName(),
                'mime' => $f->getMime(),
                'size' => $f->getSize(),
                'createdAt' => $f->getCreatedAt()->format('c'),
                'albumId' => $f->getAlbum()?->getId(),
                'shareUrl' => $f->getShareToken()
                    ? $this->generateUrl('app_drive_share', ['token' => $f->getShareToken()], UrlGeneratorInterface::ABSOLUTE_URL)
                    : null,
                'shareExpiresAt' => $f->getShareExpiresAt()?->format('c'),
                'shareActive' => $f->isShareActive(),
            ], $files),
            'used' => $repository->getUsedSize($user),
            'quota' => $user->getDriveQuota(),
        ]);
    }

    /** Nom de fichier ou de dossier, nettoyé ; null s'il est invalide. */
    private function validName(Request $request): ?string
    {
        $name = trim((string) (json_decode($request->getContent())->name ?? ''));

        // « / » et « \ » sont refusés par Content-Disposition (le téléchargement planterait).
        return $name === '' || mb_strlen($name) > 255 || preg_match('#[/\\\\\x00-\x1F\x7F]#', $name) ? null : $name;
    }

    private function invalidName(ApiResponse $apiResponse): JsonResponse
    {
        return $apiResponse->apiJsonResponseValidationFailed([
            ['name' => 'name', 'message' => 'Nom invalide : 1 à 255 caractères, sans « / » ni « \\ ».']
        ]);
    }

    private function thumbFolder(DrFile $obj): string
    {
        return $obj->getFolder() . '/thumbs';
    }

    private function thumbName(DrFile $obj, bool $large = false, int $page = 0): string
    {
        return pathinfo($obj->getFile(), PATHINFO_FILENAME) . ($large ? '-l' : '') . ($page ? '-p' . $page : '') . '.webp';
    }

    private function formatSize(int $bytes): string
    {
        if ($bytes >= 1024 * 1024) {
            return round($bytes / 1024 / 1024, 1) . ' Mo';
        }

        return round($bytes / 1024) . ' Ko';
    }
}
