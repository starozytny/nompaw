<?php

namespace App\Controller\InternApi\Video;

use App\Entity\Holiday\HoProject;
use App\Entity\Video\ViVideo;
use App\Repository\Video\ViVideoRepository;
use App\Service\Api\ApiResponse;
use App\Service\Data\DataVideo;
use App\Service\FileUploader;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Finder\Finder;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/videos', name: 'intern_api_videos_')]
class VideoController extends AbstractController
{
    #[Route('/list', name: 'list', options: ['expose' => true], methods: 'GET')]
    public function list(ViVideoRepository $repository, ApiResponse $apiResponse): Response
    {
        $finder = new Finder();
        $finder->files()->in($this->getParameter('private_directory') . 'videotheque');

        $videos = $repository->findAll();

        $indexVideos = [];
        foreach($videos as $video){
            $indexVideos[$video->getFilename()] = $video;
        }

        $data = [];
        foreach($finder as $file){
            $v = $indexVideos[$file->getFilename()] ?? null;
            if(!$v){
                $data[] = [
                    'id' => null,
                    'name' => $file->getFilename(),
                    'filename' => $file->getFilename(),
                    'fileSize' => $file->getSize(),
                    'fileExtension' => $file->getExtension(),
                    'fileDuration' => null,
                    'fileYear' => null,
                    'fileType' => null,
                    'fileQuality' => null,
                    'notation' => null,
                    'subtitle' => null,
                    'illustration' => null
                ];
            }
        }

        $data = array_merge($data, $videos);

        return $apiResponse->apiJsonResponse($data, ViVideo::LIST);
    }

    public function submitForm($type, ViVideoRepository $repository, ViVideo $obj, Request $request, ApiResponse $apiResponse,
                               ValidatorService $validator, DataVideo $dataEntity, FileUploader $fileUploader): JsonResponse
    {
        $data = json_decode($request->get('data'));
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataEntity->setDataVideo($obj, $data);

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, HoProject::FORM);
    }

    #[Route('/create', name: 'create', options: ['expose' => true], methods: 'POST')]
    public function create(Request $request, ApiResponse $apiResponse, ValidatorService $validator,
                           DataVideo $dataEntity, ViVideoRepository $repository, FileUploader $fileUploader): Response
    {
        return $this->submitForm("create", $repository, new ViVideo(), $request, $apiResponse, $validator, $dataEntity, $fileUploader);
    }

    #[Route('/update/{id}', name: 'update', options: ['expose' => true], methods: 'POST')]
    public function update(Request $request, ViVideo $obj, ApiResponse $apiResponse, ValidatorService $validator,
                           DataVideo $dataEntity, ViVideoRepository $repository, FileUploader $fileUploader): Response
    {
        return $this->submitForm("update", $repository, $obj, $request, $apiResponse, $validator, $dataEntity, $fileUploader);
    }
}
