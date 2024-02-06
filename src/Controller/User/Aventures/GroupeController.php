<?php

namespace App\Controller\User\Aventures;

use App\Entity\Main\User;
use App\Entity\Rando\RaGroupe;
use App\Repository\Main\UserRepository;
use App\Repository\Rando\RaGroupeRepository;
use App\Repository\Rando\RaLinkRepository;
use App\Repository\Rando\RaRandoRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/espace-membre/aventures/groupes', name: 'user_aventures_groupes_')]
class GroupeController extends AbstractController
{
    #[Route('/', name: 'index', options: ['expose' => true])]
    public function list(RaGroupeRepository $repository, RaLinkRepository $linkRepository): Response
    {
        $groupes = $repository->findBy(['isVisible' => true]);

        foreach($repository->findBy(['author' => $this->getUser()]) as $grp){
            if(!in_array($grp, $groupes)){
                $groupes[] = $grp;
            }
        }

        foreach($linkRepository->findBy(['user' => $this->getUser()]) as $link){
            if(!in_array($link->getGroupe(), $groupes)){
                $groupes[] = $link->getGroupe();
            }
        }

        return $this->render('user/pages/aventures/index.html.twig', ['groupes' => $groupes]);
    }

    #[Route('/groupe/{slug}', name: 'read', options: ['expose' => true])]
    public function read($slug, RaGroupeRepository $repository, RaRandoRepository $randoRepository): Response
    {
        $obj = $repository->findOneBy(['slug' => $slug]);
        return $this->render('user/pages/aventures/groupe/read.html.twig', [
            'elem' => $obj,
            'randos' => $randoRepository->findBy(['isNext' => false, 'groupe' => $obj], ['startAt' => 'DESC']),
            'next' => $randoRepository->findOneBy(['isNext' => true, 'groupe' => $obj])
        ]);
    }

    #[Route('/ajouter', name: 'create')]
    public function create(UserRepository $userRepository, SerializerInterface $serializer): Response
    {
        $users = $userRepository->findAll();
        $users = $serializer->serialize($users, 'json', ['groups' => User::SELECT]);
        return $this->render('user/pages/aventures/groupe/create.html.twig', ['users' => $users]);
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

        return $this->render('user/pages/aventures/groupe/update.html.twig', [
            'elem' => $obj,
            'element' => $element,
            'users' => $users,
            'members' => $members,
        ]);
    }
}
