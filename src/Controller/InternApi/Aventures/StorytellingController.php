<?php

namespace App\Controller\InternApi\Aventures;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/storytelling/image', name: 'intern_api_storytelling_images_')]
class StorytellingController extends AbstractController
{
    #[Route('/src/file/{groupe}/{aventure}/{filename}', name: 'file_src', options: ['expose' => true], methods: 'GET')]
    public function getFile($groupe, $aventure, $filename): Response
    {
        $file = $this->getParameter('private_directory') . "storytelling/" . $groupe . "/" . $aventure . "/" . $filename;
        $response = new BinaryFileResponse($file);

        if(str_contains($filename, '.mp4')){
            $response->headers->set('Content-Type', 'video/mp4');
        }
        return $response;
    }

    // Version HD pour la lightbox : sert le fichier du sous-dossier hd/ s'il existe,
    // sinon retombe sur la miniature (une photo n'a pas forcément de version HD déposée).
    #[Route('/src/file-hd/{groupe}/{aventure}/{filename}', name: 'file_hd_src', options: ['expose' => true], methods: 'GET')]
    public function getFileHD($groupe, $aventure, $filename): Response
    {
        $base = $this->getParameter('private_directory') . "storytelling/" . $groupe . "/" . $aventure . "/";
        $hdFile = $base . "hd/" . $filename;

        return new BinaryFileResponse(is_file($hdFile) ? $hdFile : $base . $filename);
    }
}
