<?php

namespace App\Controller\User\Aventures;

use App\Entity\Main\User;
use App\Entity\Rando\RaImage;
use App\Entity\Rando\RaPropalAdventure;
use App\Entity\Rando\RaPropalDate;
use App\Entity\Rando\RaRando;
use App\Repository\Main\UserRepository;
use App\Repository\Rando\RaGroupeRepository;
use App\Repository\Rando\RaImageRepository;
use App\Repository\Rando\RaPropalAdventureRepository;
use App\Repository\Rando\RaPropalDateRepository;
use App\Repository\Rando\RaRandoRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/espace-membre/aventures/randos', name: 'user_aventures_randos_')]
class RandoController extends AbstractController
{
    #[Route('/{slug}', name: 'read', options: ['expose' => true])]
    public function read($slug, RaRandoRepository $repository, RaPropalDateRepository $propalDateRepository,
                         RaPropalAdventureRepository $adventureRepository, UserRepository $userRepository,
                         RaImageRepository $imageRepository, SerializerInterface $serializer): Response
    {
        $obj = $repository->findOneBy(['slug' => $slug]);
        $propalDates = $propalDateRepository->findBy(['rando' => $obj]);
        $propalAdvs  = $adventureRepository->findBy(['rando' => $obj]);
        $images      = $imageRepository->findBy(['rando' => $obj], ['takenAt' => 'ASC']);
        $users       = $userRepository->findAll();

        $propalDates = $serializer->serialize($propalDates, 'json', ['groups' => RaPropalDate::LIST]);
        $propalAdvs  = $serializer->serialize($propalAdvs,  'json', ['groups' => RaPropalAdventure::LIST]);
        $images      = $serializer->serialize($images,      'json', ['groups' => RaImage::LIST]);

        return $this->render('user/pages/aventures/rando/read.html.twig', [
            'elem' => $obj,
            'propalDates' => $propalDates,
            'propalAdvs' => $propalAdvs,
            'images' => $images,
            'users' => $users,
        ]);
    }

    #[Route('/groupe/{g_slug}/ajouter', name: 'create')]
    public function create($g_slug, RaGroupeRepository $groupeRepository, UserRepository $userRepository, SerializerInterface $serializer): Response
    {
        $users = $userRepository->findAll();
        $users = $serializer->serialize($users, 'json', ['groups' => User::SELECT]);
        return $this->render('user/pages/aventures/rando/create.html.twig', [
            'groupe' => $groupeRepository->findOneBy(['slug' => $g_slug]),
            'users' => $users
        ]);
    }

    #[Route('/modifier/{slug}', name: 'update')]
    public function update($slug, RaRandoRepository $repository, UserRepository $userRepository, SerializerInterface $serializer): Response
    {
        $obj   = $repository->findOneBy(['slug' => $slug]);
        $users = $userRepository->findAll();

        if($obj->getAuthor()->getId() != $this->getUser()->getId() && !$this->isGranted('ROLE_ADMIN')){
            throw $this->createAccessDeniedException("Vous n'avez pas l'autorisation d'accéder à cette page.");
        }

        $element = $serializer->serialize($obj,   'json', ['groups' => RaRando::FORM]);
        $users   = $serializer->serialize($users, 'json', ['groups' => User::SELECT]);

        return $this->render('user/pages/aventures/rando/update.html.twig', [
            'elem' => $obj,
            'element' => $element,
            'users' => $users,
        ]);
    }
}
