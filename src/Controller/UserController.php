<?php

namespace App\Controller;


use App\Entity\Main\User;
use App\Repository\Main\ChangelogRepository;
use App\Repository\Main\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/espace-membre', name: 'user_')]
class UserController extends AbstractController
{
    #[Route('/', name: 'homepage')]
    public function index(ChangelogRepository $changelogRepository): Response
    {
        $changelogs = $changelogRepository->findBy(['isPublished' => true], ['createdAt' => 'ASC'], 5);

        return $this->render('user/pages/index.html.twig', [
            'changelogs' => $changelogs,
        ]);
    }

    #[Route('/profil', name: 'profil_index', options: ['expose' => true])]
    public function profil(SerializerInterface $serializer): Response
    {
        $obj = $serializer->serialize($this->getUser(), 'json', ['groups' => User::FORM]);
        return $this->render('user/pages/profil/index.html.twig', ['elem' => $this->getUser(), 'obj' => $obj]);
    }

    #[Route('/profil/modification/{username}', name: 'profil_update')]
    public function password($username, UserRepository $repository, SerializerInterface $serializer): Response
    {
        $elem = $repository->findOneBy(['username' => $username]);
        $obj = $serializer->serialize($elem, 'json', ['groups' => User::FORM]);
        return $this->render('user/pages/profil/update.html.twig', ['obj' => $obj]);
    }
}
