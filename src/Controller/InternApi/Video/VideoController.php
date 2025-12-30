<?php

namespace App\Controller\InternApi\Video;

use App\Entity\Video\ViVideo;
use App\Repository\Video\ViVideoRepository;
use App\Service\Api\ApiResponse;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Finder\Finder;
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

        $data = [];
        foreach($finder as $file){
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

        $data = array_merge($data, $repository->findAll());

        return $apiResponse->apiJsonResponse($data, ViVideo::LIST);
    }
}
