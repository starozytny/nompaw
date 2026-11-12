<?php

namespace App\Service\Data;

use App\Entity\Main\User;
use App\Entity\Rando\RaImage;
use App\Entity\Rando\RaRando;
use App\Service\FileUploader;
use DateTime;
use getID3;

/**
 * Pipeline commune de création d'un RaImage à partir d'un fichier uploadé (photo ou vidéo).
 *
 * Extraite de InternApi\Aventures\ImageController::upload() pour être partagée avec le
 * dépôt public par mot de passe (AventureAlbumController) : les invités n'ont pas de User,
 * l'attribution se fait alors via $guestName.
 */
class RandoImageUploader
{
    public function __construct(
        private readonly FileUploader $fileUploader,
        private readonly string $privateDirectory,
    ) {}

    /**
     * @param User|null   $author    auteur membre, ou null pour un dépôt invité
     * @param string|null $guestName nom saisi par l'invité (utilisé si $author est null)
     * @param int|null    $mtime     date de dernière modif du fichier côté client (timestamp)
     */
    public function createFromUpload($file, RaRando $rando, ?User $author, ?string $guestName, ?int $mtime): ?RaImage
    {
        $randoFile = '/' . $rando->getId();

        // Lu AVANT uploadDrive() : sa correction d'orientation (GD, pour les JPEG mal
        // orientés — la quasi-totalité des photos de téléphone) réécrit le fichier et
        // efface tout l'EXIF au passage, DateTimeOriginal compris. Lu après coup, la date
        // de prise de vue retombait donc systématiquement sur mtime (date d'upload) dès
        // qu'une rotation était nécessaire.
        $exif = @exif_read_data($file->getPathname());

        $filenameImage = $this->fileUploader->uploadDrive($file, RaRando::FOLDER_IMAGES . $randoFile);

        if ($filenameImage === false) {
            return null;
        }

        $image = (new RaImage())
            ->setFile($filenameImage)
            ->setMTime($mtime)
            ->setAuthor($author)
            ->setGuestName($author ? null : $guestName)
            ->setRando($rando)
        ;

        if ($exif && isset($exif['DateTimeOriginal'])) {
            $date = DateTime::createFromFormat('Y:m:d H:i:s', $exif['DateTimeOriginal']);
            $image->setTakenAt($date ?: new DateTime());
        } else {
            $date = new DateTime();
            $image->setTakenAt($mtime ? $date->setTimestamp($mtime) : $date);
        }

        $fileUploaded = $this->privateDirectory . $image->getFileFile();
        $mime = mime_content_type($fileUploaded);

        if (str_contains($mime, "image/")) {
            $image->setType(0);
        } elseif (str_contains($mime, "video/")) {
            $image->setType(1);

            $getID3 = new getID3();
            $info = $getID3->analyze($fileUploaded);

            if (isset($info['quicktime']['timestamps_unix']['create']['moov mvhd'])) {
                $timestamp = $info['quicktime']['timestamps_unix']['create']['moov mvhd'];

                if ($timestamp > 946684800 && $timestamp < 4102444800) {
                    $date = new DateTime();
                    $image->setTakenAt($date->setTimestamp($timestamp));
                }
            }
        } else {
            $image->setType(99);
        }

        [$filenameThumbs, $filenameLightbox] = $this->fileUploader->thumbsAndLightbox(
            $image->getFile(),
            RaRando::FOLDER_IMAGES . $randoFile,
            RaRando::FOLDER_THUMBS . $randoFile,
            RaRando::FOLDER_LIGHTBOX . $randoFile
        );

        $image
            ->setThumbs($filenameThumbs)
            ->setLightbox($filenameLightbox)
        ;

        return $image;
    }
}
