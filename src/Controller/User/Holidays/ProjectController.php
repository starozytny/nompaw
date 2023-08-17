<?php

namespace App\Controller\User\Holidays;

use App\Entity\Holiday\HoProject;
use App\Entity\Holiday\HoPropalDate;
use App\Repository\Holiday\HoProjectRepository;
use App\Repository\Holiday\HoPropalDateRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/espace-membre/projets', name: 'user_projects_')]
class ProjectController extends AbstractController
{
    #[Route('/', name: 'index', options: ['expose' => true])]
    public function list(HoProjectRepository $repository): Response
    {
        $projects = $repository->findAll();

        return $this->render('user/pages/holidays/index.html.twig', ['projects' => $projects]);
    }

    #[Route('/projet/{slug}', name: 'read', options: ['expose' => true])]
    public function read($slug, SerializerInterface $serializer,
                         HoProjectRepository $repository, HoPropalDateRepository $propalDateRepository): Response
    {
        $obj = $repository->findOneBy(['slug' => $slug]);
        $propalDates = $propalDateRepository->findBy(['project' => $obj]);

        $propalDates = $serializer->serialize($propalDates, 'json', ['groups' => HoPropalDate::LIST]);

        return $this->render('user/pages/holidays/projects/read.html.twig', [
            'elem' => $obj,
            'propalDates' => $propalDates,
        ]);
    }

    #[Route('/ajouter', name: 'create')]
    public function create(): Response
    {
        return $this->render('user/pages/holidays/projects/create.html.twig');
    }

    #[Route('/modifier/{slug}', name: 'update', options: ['expose' => true])]
    public function update($slug, HoProjectRepository $repository, SerializerInterface $serializer): Response
    {
        $obj = $repository->findOneBy(['slug' => $slug]);

        if($obj->getAuthor()->getId() != $this->getUser()->getId()){
            throw new AccessDeniedException("Vous n'avez pas l'autorisation d'accéder à cette page.");
        }

        $element = $serializer->serialize($obj,   'json', ['groups' => HoProject::FORM]);

        return $this->render('user/pages/holidays/projects/update.html.twig', [
            'elem' => $obj,
            'element' => $element,
        ]);
    }
}
