<?php

namespace App\Controller\User\Videotheque;

use App\Entity\Holiday\HoLifestyle;
use App\Entity\Holiday\HoProject;
use App\Entity\Holiday\HoPropalActivity;
use App\Entity\Holiday\HoPropalDate;
use App\Entity\Holiday\HoPropalHouse;
use App\Entity\Holiday\HoTodo;
use App\Repository\Holiday\HoLifestyleRepository;
use App\Repository\Holiday\HoProjectRepository;
use App\Repository\Holiday\HoPropalActivityRepository;
use App\Repository\Holiday\HoPropalDateRepository;
use App\Repository\Holiday\HoPropalHouseRepository;
use App\Repository\Holiday\HoTodoRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Finder\Finder;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/espace-membre/videotheque', name: 'user_videotheque_')]
class VideothequeController extends AbstractController
{
    #[Route('/', name: 'index')]
    public function index(): Response
    {
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
