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
use Symfony\Component\Routing\Attribute\Route;

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
            $images = [];

            $randoFile = '/' . $obj->getId();
            foreach($request->files as $key => $file){
                $filenameImage = $fileUploader->upload($file, RaRando::FOLDER_IMAGES.$randoFile, false, false, true);

                $image = (new RaImage())
                    ->setFile($filenameImage)
                    ->setMTime($request->get($key . "-time"))
                    ->setThumbs($filenameImage)
                    ->setLightbox($filenameImage)
                    ->setAuthor($this->getUser())
                    ->setRando($obj)
                ;

                $mime = mime_content_type($this->getParameter('private_directory') . $image->getFileFile());
                if(str_contains($mime, "image/")){
                    $image->setType(0);
                }elseif(str_contains($mime, "video/")){
                    $image->setType(1);
                }else{
                    $image->setType(99);
                }

                $imageRepository->save($image);
                $images[] = $image;
            }

            $repository->save($obj, true);

            foreach($images as $image){
                $fileUploader->thumbs($image->getFile(), RaRando::FOLDER_IMAGES.$randoFile, RaRando::FOLDER_THUMBS.$randoFile);
                $fileUploader->lightbox($image->getFile(), RaRando::FOLDER_IMAGES.$randoFile, RaRando::FOLDER_LIGHTBOX.$randoFile);
            }
        }

        $max = $request->get('max');
        $iEnd = $request->get('iEnd');
        $iProceed = $request->get('iProceed');

        if($iProceed < $max){
            return $apiResponse->apiJsonResponseCustom([
                'max' => $max,
                'iStart' => $iEnd,
                'iEnd' => $iEnd + 20,
                'iProceed' => $iProceed,
                'continue' => true
            ]);
        }

        return $apiResponse->apiJsonResponseCustom([
            'continue' => false
        ]);
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
}
