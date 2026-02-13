<?php


namespace App\Service;



use App\Entity\Enum\Image\ImageType;
use App\Entity\Main\Agenda\AgEvent;
use App\Entity\Main\Changelog;
use App\Entity\Main\Image;
use App\Entity\Rando\RaGroupe;
use App\Entity\Rando\RaImage;
use App\Entity\Rando\RaRando;
use App\Entity\Main\Mail;
use App\Repository\Main\ImageRepository;
use Exception;
use Imagick;
use ImagickException;
use PHPImageWorkshop\Core\Exception\ImageWorkshopLayerException;
use PHPImageWorkshop\Exception\ImageWorkshopException;
use PHPImageWorkshop\ImageWorkshop;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\String\Slugger\SluggerInterface;

class FileUploader
{
    private string $publicDirectory;
    private string $privateDirectory;
    private SluggerInterface $slugger;

    public function __construct($publicDirectory, $privateDirectory, SluggerInterface $slugger)
    {
        $this->publicDirectory = $publicDirectory;
        $this->privateDirectory = $privateDirectory;
        $this->slugger = $slugger;
    }

    public function upload(UploadedFile $file, $folder=null, $isPublic=true, $reducePixel=false, $keepOriginalSize=false): string
    {
        $originalFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeFilename = $this->slugger->slug($originalFilename);
        $fileName = $safeFilename.'-'.uniqid().'.'.$file->getClientOriginalExtension();

        try {
            $directory = $isPublic ? $this->getPublicDirectory() : $this->getPrivateDirectory();
            $directory = $directory . '/' . $folder;

            if($directory){
                if(!is_dir($directory)){
                    mkdir($directory, 0755, true);
                }
            }

            $file->move($directory, $fileName);

            $filePath = $directory . "/" . $fileName;

            // Correction de l'orientation EXIF
            $mime = mime_content_type($filePath);
            if(str_contains($mime, "image/") && str_contains($mime, "jpeg")) {
                $orientation = $this->checkOrientation($filePath);
                if($orientation > 0) {
                    $image = imagecreatefromjpeg($filePath);
                    $this->fixOrientation($orientation, $filePath, $image);
                }
            }

            if($reducePixel || !$keepOriginalSize){
                $fileOri = $directory . "/" . $fileName;

                $mime = mime_content_type($fileOri);
                if(str_contains($mime, "image/")){
                    $layer = ImageWorkshop::initFromPath($fileOri);

                    if($reducePixel){
                        $layer->resizeInPixel(null, $reducePixel, true);
                        $layer->save($directory, $fileName);
                    }else if($layer->getHeight() > 2160){
                        if(!$keepOriginalSize){
                            $layer->resizeInPixel(null, 2160, true);
                            $layer->save($directory, $fileName);
                        }
                    }
                }
            }
        } catch (FileException|ImageWorkshopException|ImageWorkshopLayerException $e) {
            return false;
        }

        return $fileName;
    }

    public function uploadDrive(UploadedFile $file, $folder=null): string
    {
        $originalFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeFilename = $this->slugger->slug($originalFilename);
        $fileName = $safeFilename.'-'.uniqid().'.'.$file->getClientOriginalExtension();

        try {
            $directory = $this->getPrivateDirectory() . '/' . $folder;

            if($directory){
                if(!is_dir($directory)){
                    mkdir($directory, 0755, true);
                }
            }

            $file->move($directory, $fileName);

            $filePath = $directory . "/" . $fileName;

            // Correction de l'orientation EXIF
            $mime = mime_content_type($filePath);
            if(str_contains($mime, "image/") && str_contains($mime, "jpeg")) {
                $orientation = $this->checkOrientation($filePath);
                if($orientation > 0) {
                    $image = imagecreatefromjpeg($filePath);
                    $this->fixOrientation($orientation, $filePath, $image);
                }
            }

            $fileOri = $directory . "/" . $fileName;

            $mime = mime_content_type($fileOri);
            if(str_contains($mime, "image/")){
                $layer = ImageWorkshop::initFromPath($fileOri);

                if($layer->getWidth() > 1920){
                    $layer->resizeInPixel(1920, null, true);
                    $layer->save($directory, $fileName);
                }else if($layer->getHeight() > 2880){
                    $layer->resizeInPixel(null, 2880, true);
                    $layer->save($directory, $fileName);

                }
            }
        } catch (FileException|ImageWorkshopException|ImageWorkshopLayerException $e) {
            return false;
        }

        return $fileName;
    }

    public function checkOrientation($filePath)
    {
        $exif = @exif_read_data($filePath);
        if (!empty($exif['Orientation'])) {
            if($exif['Orientation'] == 3 || $exif['Orientation'] == 6 || $exif['Orientation'] == 8){
                return $exif['Orientation'];
            }
        }

        return 0;
    }

    public function fixOrientation($orientation, $filePath, $image): void
    {
        switch ($orientation) {
            case 3:
                $image = imagerotate($image, 180, 0);
                break;
            case 6:
                $image = imagerotate($image, -90, 0);
                break;
            case 8:
                $image = imagerotate($image, 90, 0);
                break;
        }

        imagejpeg($image, $filePath);
        imagedestroy($image);
    }

    /**
     * @throws ImagickException
     */
    public function thumbs($fileName, $folderImages, $folderThumbs, $isPublic = false)
    {
        $directory = $isPublic ? $this->getPublicDirectory() : $this->getPrivateDirectory();

        if($folderThumbs){
            if(!is_dir($directory . $folderThumbs)){
                mkdir($directory . $folderThumbs, 0755, true);
            }
        }

        $fileOri = $directory . $folderImages . "/" . $fileName;
        $mime = mime_content_type($fileOri);

        if(str_contains($mime, "image/")){
            $imagick = new Imagick($fileOri);

            $imagick->autoOrient();

            if ($imagick->getImageHeight() > 435) {
                $imagick->resizeImage(0, 435, Imagick::FILTER_LANCZOS, 1);
            }

            $imagick->setImageFormat('webp');
            $imagick->setImageCompressionQuality(80);

            $newFileName = pathinfo($fileName, PATHINFO_FILENAME) . '.webp';
            $imagick->writeImage($directory . $folderThumbs . '/' . $newFileName);
            $imagick->clear();

            return $newFileName;
        }

        return $fileName;
    }

    /**
     * @throws ImagickException
     */
    public function lightbox($fileName, $folderImages, $folderLightbox, $isPublic = false)
    {
        $directory = $isPublic ? $this->getPublicDirectory() : $this->getPrivateDirectory();

        if($folderLightbox){
            if(!is_dir($directory . $folderLightbox)){
                mkdir($directory . $folderLightbox, 0755, true);
            }
        }

        $fileOri = $directory . $folderImages . "/" . $fileName;
        $mime = mime_content_type($fileOri);

        if(str_contains($mime, "image/")){
            $imagick = new Imagick($fileOri);

            $imagick->autoOrient();

            if ($imagick->getImageWidth() > 1440) {
                $imagick->resizeImage(1440, 0, Imagick::FILTER_LANCZOS, 1);
            }

            $imagick->setImageFormat('webp');
            $imagick->setImageCompressionQuality(80);

            $newFileName = pathinfo($fileName, PATHINFO_FILENAME) . '.webp';
            $imagick->writeImage($directory . $folderLightbox . '/' . $newFileName);
            $imagick->clear();

            return $newFileName;
        }

        return $fileName;
    }

    /**
     * @throws ImagickException
     */
    public function cover($fileName, $folderImages, $folderThumbs, $isPublic = false): string
    {
        $directory = $isPublic ? $this->getPublicDirectory() : $this->getPrivateDirectory();

        if($folderThumbs){
            if(!is_dir($directory . $folderThumbs)){
                mkdir($directory . $folderThumbs, 0755, true);
            }
        }

        $fileOri = $directory . $folderImages . "/" . $fileName;
        $mime = mime_content_type($fileOri);

        if(str_contains($mime, "image/")){
            $imagick = new Imagick($fileOri);

            $imagick->autoOrient();

            if ($imagick->getImageWidth() > 340) {
                $imagick->resizeImage(340, 0, Imagick::FILTER_LANCZOS, 1);
            }

            $imagick->setImageFormat('webp');
            $imagick->setImageCompressionQuality(80);

            $newFileName = "cover-" . pathinfo($fileName, PATHINFO_FILENAME) . '.webp';
            $imagick->writeImage($directory . $folderThumbs . '/' . $newFileName);
            $imagick->clear();

            return $newFileName;
        }

        return $fileName;
    }

    public function deleteFile($fileName, $folderName, $isPublic = true): void
    {
        if($fileName){
            $file = $this->getDirectory($isPublic) . $folderName . '/' . $fileName;
            if(file_exists($file)){
                unlink($file);
            }
        }
    }

    public function replaceFile($file, $folderName, $oldFileName = null, $isPublic = true, $reducePixel = false): ?string
    {
        if($file){
            if($oldFileName){
                $oldFile = $this->getDirectory($isPublic) . $folderName . '/' . $oldFileName;

                $fileName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                if(file_exists($oldFile) && $fileName !== $oldFileName){
                    unlink($oldFile);
                }
            }

            return $this->upload($file, $folderName, $isPublic, $reducePixel);
        }

        return null;
    }

    private function getDirectory($isPublic): string
    {
        $path = $this->privateDirectory;
        if($isPublic){
            $path = $this->publicDirectory;
        }

        return $path;
    }

    public function getPublicDirectory(): string
    {
        return $this->publicDirectory;
    }

    public function getPrivateDirectory(): string
    {
        return $this->privateDirectory;
    }

    public function uploadTinyMCE(Request $request, ImageRepository $repository, $type, $identifiant = null): JsonResponse
    {
        $file = $request->files->get('file');
        if($file){
            $folder = match ($type){
                ImageType::Changelog => Changelog::FOLDER_EDITOR,
                ImageType::AgEvent => AgEvent::FOLDER_EDITOR,
                ImageType::Groupe => RaGroupe::FOLDER,
                ImageType::Rando => RaRando::FOLDER,
                ImageType::Route => RaImage::FOLDER,
            };

            $fileName = $this->replaceFile($file, $folder);

            $obj = (new Image())
                ->setType($type)
                ->setName($fileName)
                ->setIdentifiant($identifiant)
            ;

            $repository->save($obj, true);

            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] == 'on' ? "https://" : "http://";
            return new JsonResponse([
                'success' => true,
                'location' => $protocol . $request->getHttpHost() . '/' . $folder . '/' . $fileName
            ]);
        }

        return new JsonResponse(['success' => false,]);
    }

    /**
     * @param $file
     * @param $folder
     * @param $oldFile
     * @return string|null
     */
    public function downloadImgURL($file, $folder, $oldFile): ?string
    {
        try{
            if(!is_dir($folder)){
                mkdir($folder);
            }
            if($oldFile){
                $this->deleteFile($oldFile, $folder);
            }
            $size = getimagesize($file);
            $extension = image_type_to_extension($size[2]);
            $current = file_get_contents($file);
            $filename = uniqid() . $extension;
            $file = $folder.'/'.$filename;
            file_put_contents($file, $current);

            return $filename;
        }catch (Exception $e){
            return  null;
        }
    }
}
