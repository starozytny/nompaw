<?php

namespace App\Controller\User\Rando;

use App\Entity\Cook\CoRecipe;
use App\Entity\Main\User;
use App\Entity\Rando\RaGroupe;
use App\Entity\Rando\RaPropalAdventure;
use App\Entity\Rando\RaPropalDate;
use App\Entity\Rando\RaRando;
use App\Repository\Main\UserRepository;
use App\Repository\Rando\RaGroupeRepository;
use App\Repository\Rando\RaLinkRepository;
use App\Repository\Rando\RaPropalAdventureRepository;
use App\Repository\Rando\RaPropalDateRepository;
use App\Repository\Rando\RaRandoRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/espace-membre/randonnees/rando', name: 'user_randos_rando_')]
class RandoController extends AbstractController
{
    #[Route('/{slug}', name: 'read', options: ['expose' => true])]
    public function read($slug, RaRandoRepository $repository, RaPropalDateRepository $propalDateRepository,
                         RaPropalAdventureRepository $adventureRepository, SerializerInterface $serializer): Response
    {
        $obj = $repository->findOneBy(['slug' => $slug]);
        $propalDates = $propalDateRepository->findBy(['rando' => $obj]);
        $propalAdvs  = $adventureRepository->findBy(['rando' => $obj]);

        $propalDates = $serializer->serialize($propalDates, 'json', ['groups' => RaPropalDate::LIST]);
        $propalAdvs  = $serializer->serialize($propalAdvs,  'json', ['groups' => RaPropalAdventure::LIST]);
        return $this->render('user/pages/randos/rando/read.html.twig', [
            'elem' => $obj,
            'propalDates' => $propalDates,
            'propalAdvs' => $propalAdvs,
        ]);
    }

    #[Route('/groupe/{g_slug}/ajouter', name: 'create')]
    public function create($g_slug, RaGroupeRepository $groupeRepository): Response
    {
        return $this->render('user/pages/randos/rando/create.html.twig', ['groupe' => $groupeRepository->findOneBy(['slug' => $g_slug])]);
    }

    #[Route('/modifier/{slug}', name: 'update')]
    public function update($slug, RaRandoRepository $repository, SerializerInterface $serializer): Response
    {
        $obj = $repository->findOneBy(['slug' => $slug]);

        if($obj->getAuthor()->getId() != $this->getUser()->getId()){
            throw new AccessDeniedException("Vous n'avez pas l'autorisation d'accéder à cette page.");
        }

        $element = $serializer->serialize($obj, 'json', ['groups' => RaRando::FORM]);

        return $this->render('user/pages/randos/rando/update.html.twig', [
            'elem' => $obj,
            'element' => $element
        ]);
    }
}
