<?php

namespace App\Controller\User\Rando;

use App\Entity\Cook\CoRecipe;
use App\Repository\Cook\CoRecipeRepository;
use App\Repository\Rando\RaGroupeRepository;
use App\Repository\Rando\RaLinkRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/espace-membre/randonnees', name: 'user_randos_groupe_')]
class GroupeController extends AbstractController
{
    #[Route('/', name: 'index', options: ['expose' => true])]
    public function list(RaGroupeRepository $repository, RaLinkRepository $linkRepository): Response
    {
        $groupes = $repository->findBy(['isVisible' => true]);

        foreach($linkRepository->findBy(['user' => $this->getUser()]) as $link){
            if(!in_array($link->getGroupe(), $groupes)){
                $groupes[] = $link->getGroupe();
            }
        }

        return $this->render('user/pages/randos/index.html.twig', ['groupes' => $groupes]);
    }

    #[Route('/ajouter', name: 'create')]
    public function create(): Response
    {
        return $this->render('user/pages/randos/groupe/create.html.twig');
    }

    #[Route('/modifier/{slug}', name: 'update', options: ['expose' => true])]
    public function update($slug, CoRecipeRepository $repository, SerializerInterface $serializer): Response
    {
        $obj   = $repository->findOneBy(['slug' => $slug]);

        if($obj->getAuthor()->getId() != $this->getUser()->getId()){
            throw new AccessDeniedException("Vous n'avez pas l'autorisation d'accéder à cette page.");
        }

        $element = $serializer->serialize($obj,   'json', ['groups' => CoRecipe::FORM]);

        return $this->render('user/pages/randos/groupe//update.html.twig', [
            'elem' => $obj,
            'element' => $element,
        ]);
    }
}
