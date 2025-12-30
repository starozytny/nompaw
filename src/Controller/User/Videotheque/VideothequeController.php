<?php

namespace App\Controller\User\Videotheque;

use App\Repository\Video\ViVideoRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Finder\Finder;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/espace-membre/videotheque', name: 'user_videotheque_')]
class VideothequeController extends AbstractController
{
    #[Route('/', name: 'index', options: ['expose' => true], methods: 'GET')]
    public function index(): Response
    {
        $folder = $this->getParameter('private_directory') . 'videotheque';
        if(!is_dir($folder)){
            mkdir($folder, 0755);
        }

        $finder = new Finder();
        $finder->files()->in($this->getParameter('private_directory') . 'videotheque');

        return $this->render('user/pages/videotheque/index.html.twig', ['finder' => $finder]);
    }

    #[Route('/telecharger/{id}', name: 'download', options: ['expose' => true], methods: 'GET')]
    public function download($id, ViVideoRepository $repository): Response
    {
        $video = $repository->find($id);
        if(!$video){
            $this->addFlash('error', "Fichier introuvable.");
            return $this->redirectToRoute('user_videotheque_index');
        }

        $file = $this->getParameter('private_directory') . 'videotheque/' . $video->getFilename();
        if(!file_exists($file)) {
            $this->addFlash('error', "Fichier introuvable.");
            return $this->redirectToRoute('user_videotheque_index');
        }

        return $this->file($file);
    }
}
