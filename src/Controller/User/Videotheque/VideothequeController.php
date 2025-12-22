<?php

namespace App\Controller\User\Videotheque;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Finder\Finder;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/espace-membre/videotheque', name: 'user_videotheque_')]
class VideothequeController extends AbstractController
{
    #[Route('/', name: 'index')]
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

    #[Route('/telecharger/{filename}', name: 'download')]
    public function download($filename): Response
    {
        $file = $this->getParameter('private_directory') . 'videotheque/' . $filename;
        if(!file_exists($file)) {
            $this->addFlash('error', "Fichier introuvable.");
            return $this->redirectToRoute('user_videotheque_index');
        }

        return $this->file($file);
    }
}
