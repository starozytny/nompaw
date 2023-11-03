<?php

namespace App\Controller\InternApi\Aventures;

use App\Entity\Rando\RaImage;
use App\Entity\Rando\RaRando;
use App\Repository\Rando\RaImageRepository;
use App\Repository\Rando\RaRandoRepository;
use App\Service\ApiResponse;
use App\Service\FileUploader;
use PHPImageWorkshop\Core\Exception\ImageWorkshopLayerException;
use PHPImageWorkshop\Exception\ImageWorkshopException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/intern/api/aventures/image', name: 'intern_api_aventures_images_')]
class ImageController extends AbstractController
{
    /**
     * @throws ImageWorkshopException
     * @throws ImageWorkshopLayerException
     */
    #[Route('/upload/photos/{id}', name: 'upload_images', options: ['expose' => true], methods: 'POST')]
    public function upload(Request $request, RaRando $obj, ApiResponse $apiResponse, RaRandoRepository $repository,
                           FileUploader $fileUploader, RaImageRepository $imageRepository): Response
    {
        if($request->files){
            foreach($request->files as $key => $file){
                $filenameImage = $fileUploader->upload($file, RaRando::FOLDER_IMAGES, true, false, true);
                $filenameThumb = $fileUploader->thumbs($filenameImage, RaRando::FOLDER_IMAGES, RaRando::FOLDER_THUMBS);

                $image = (new RaImage())
                    ->setFile($filenameImage)
                    ->setMTime($request->get($key . "-time"))
                    ->setThumbs($filenameThumb)
                    ->setAuthor($this->getUser())
                    ->setRando($obj)
                ;

                $mime = mime_content_type($this->getParameter('public_directory') . $image->getFileFile());
                if(str_contains($mime, "image/")){
                    $image->setType(0);
                }elseif(str_contains($mime, "video/")){
                    $image->setType(1);
                }else{
                    $image->setType(99);
                }

                $imageRepository->save($image);
            }

            $repository->save($obj, true);
        }

        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(RaImage $obj, ApiResponse $apiResponse, RaImageRepository $repository,
                           FileUploader $fileUploader): Response
    {
        $fileUploader->deleteFile($obj->getFile(), RaRando::FOLDER_IMAGES);
        $fileUploader->deleteFile($obj->getThumbs(), RaRando::FOLDER_THUMBS);

        $repository->remove($obj, true);

        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/download/{id}', name: 'download', options: ['expose' => true], methods: 'GET')]
    public function download(RaImage $obj): Response
    {
        return $this->file(RaRando::FOLDER_IMAGES . '/' . $obj->getFile());
    }
}
