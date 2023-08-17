<?php

namespace App\Controller\User\Holidays;

use App\Entity\Main\User;
use App\Entity\Rando\RaGroupe;
use App\Repository\Holiday\HoProjectRepository;
use App\Repository\Main\UserRepository;
use App\Repository\Rando\RaGroupeRepository;
use App\Repository\Rando\RaLinkRepository;
use App\Repository\Rando\RaRandoRepository;
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
    public function read($slug, RaGroupeRepository $repository, RaRandoRepository $randoRepository): Response
    {
        $obj = $repository->findOneBy(['slug' => $slug]);
        return $this->render('user/pages/holidays/projects/read.html.twig', [
            'elem' => $obj,
            'randos' => $randoRepository->findBy(['isNext' => false, 'groupe' => $obj], ['startAt' => 'DESC']),
            'next' => $randoRepository->findOneBy(['isNext' => true, 'groupe' => $obj])
        ]);
    }

    #[Route('/ajouter', name: 'create')]
    public function create(): Response
    {
        return $this->render('user/pages/holidays/projects/create.html.twig');
    }

    #[Route('/modifier/{slug}', name: 'update', options: ['expose' => true])]
    public function update($slug, RaGroupeRepository $repository, RaLinkRepository $linkRepository, UserRepository $userRepository, SerializerInterface $serializer): Response
    {
        $obj   = $repository->findOneBy(['slug' => $slug]);

        if($obj->getAuthor()->getId() != $this->getUser()->getId()){
            throw new AccessDeniedException("Vous n'avez pas l'autorisation d'accéder à cette page.");
        }

        $users = $userRepository->findAll();
        $links = $linkRepository->findBy(['groupe' => $obj]);
        $members = [];
        foreach($links as $link){
            $members[] = $link->getUser()->getId();
        }

        $element = $serializer->serialize($obj,   'json', ['groups' => RaGroupe::FORM]);
        $users = $serializer->serialize($users, 'json', ['groups' => User::SELECT]);
        $members = json_encode($members);

        return $this->render('user/pages/holidays/projects/update.html.twig', [
            'elem' => $obj,
            'element' => $element,
            'users' => $users,
            'members' => $members,
        ]);
    }
}
