<?php


namespace App\Service;



use App\Entity\Cook\CoCommentary;
use App\Entity\Cook\CoRecipe;
use App\Entity\Enum\Image\ImageType;
use App\Entity\Main\Agenda\AgEvent;
use App\Entity\Main\Changelog;
use App\Entity\Main\Image;
use App\Entity\Rando\RaGroupe;
use App\Entity\Rando\RaImage;
use App\Entity\Rando\RaRando;
use App\Repository\Main\ImageRepository;
use Exception;
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
                    mkdir($directory, 0777, true);
                }
            }

            $file->move($directory, $fileName);

            $fileOri = $directory . "/" . $fileName;

            $mime = mime_content_type($fileOri);
            if(str_contains($mime, "image/")){
                $layer = ImageWorkshop::initFromPath($fileOri);

                if($reducePixel){
                    $layer->resizeInPixel(null, $reducePixel, true);
                }else if($layer->getHeight() > 2160){
                    if(!$keepOriginalSize){
                        $layer->resizeInPixel(null, 2160, true);
                    }
                }

                $layer->save($directory, $fileName);
            }
        } catch (FileException|ImageWorkshopException|ImageWorkshopLayerException $e) {
            return false;
        }

        return $fileName;
    }

    /**
     * @throws ImageWorkshopLayerException
     * @throws ImageWorkshopException
     */
    public function thumbs($fileName, $folderImages, $folderThumbs, $isPublic = false): string
    {
        $directory = $isPublic ? $this->getPublicDirectory() : $this->getPrivateDirectory();

        if($folderThumbs){
            if(!is_dir($directory . $folderThumbs)){
                mkdir($directory . $folderThumbs, 0777, true);
            }
        }

        $fileOri = $directory . $folderImages . "/" . $fileName;
        $mime = mime_content_type($fileOri);

        if(str_contains($mime, "image/")){
            $layer = ImageWorkshop::initFromPath($fileOri);
            $layer->resizeInPixel(null, 500, true);

            $fileName = "thumbs-" . $fileName;

            $layer->save($directory . $folderThumbs, $fileName);
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
                ImageType::Changelog => Changelog::FOLDER,
                ImageType::AgEvent => AgEvent::FOLDER,
                ImageType::Recipe => CoRecipe::FOLDER,
                ImageType::Commentary => CoCommentary::FOLDER,
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
