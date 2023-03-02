<?php

namespace App\Controller;

use App\Entity\Cook\CoRecipe;
use App\Entity\Cook\CoStep;
use App\Entity\Enum\Cook\CookStatut;
use App\Entity\Main\User;
use App\Repository\Cook\CoRecipeRepository;
use App\Repository\Cook\CoStepRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/espace-membre', name: 'user_')]
class UserController extends AbstractController
{
    #[Route('/', name: 'homepage')]
    public function index(): Response
    {
        return $this->render('user/pages/index.html.twig');
    }

    #[Route('/profil', name: 'profil_index')]
    public function profil(SerializerInterface $serializer): Response
    {
        $obj = $serializer->serialize($this->getUser(), 'json', ['groups' => User::FORM]);
        return $this->render('user/pages/profil/index.html.twig', ['elem' => $this->getUser(), 'obj' => $obj]);
    }

    #[Route('/recettes', name: 'recipes_index', options: ['expose' => true])]
    public function list(CoRecipeRepository $repository): Response
    {
        $recipes = [];
        foreach($repository->findAll() as $obj){
            if($obj->getStatus() == CookStatut::Active){
                $recipes[] = $obj;
            }else{
                if($obj->getAuthor()->getId() == $this->getUser()->getId()){
                    $recipes[] = $obj;
                }
            }
        }

        return $this->render('user/pages/recipes/index.html.twig', ['recipes' => $recipes]);
    }

    #[Route('/recettes/recette/{slug}', name: 'recipes_read', options: ['expose' => true])]
    public function read($slug, CoRecipeRepository $repository, CoStepRepository $stepRepository, SerializerInterface $serializer): Response
    {
        $obj   = $repository->findOneBy(['slug' => $slug]);
        $steps = $stepRepository->findBy(['recipe' => $obj]);

        $elem  = $serializer->serialize($obj, 'json', ['groups' => CoRecipe::READ]);
        $steps = $serializer->serialize($steps, 'json', ['groups' => CoStep::READ]);

        return $this->render('user/pages/recipes/read.html.twig', [
            'elem' => $obj,
            'element' => $elem,
            'steps' => $steps
        ]);
    }

    #[Route('/recettes/ajouter', name: 'recipes_create')]
    public function create(): Response
    {
        return $this->render('user/pages/recipes/create.html.twig');
    }

    #[Route('/recettes/modifier/{slug}', name: 'recipes_update', options: ['expose' => true])]
    public function update($slug, CoRecipeRepository $repository, CoStepRepository $stepRepository, SerializerInterface $serializer): Response
    {
        $obj   = $repository->findOneBy(['slug' => $slug]);

        if($obj->getAuthor()->getId() != $this->getUser()->getId()){
            throw new AccessDeniedException("Vous n'avez pas l'autorisation d'accéder à cette page.");
        }

        $steps = $stepRepository->findBy(['recipe' => $obj]);

        $element = $serializer->serialize($obj,'json', ['groups' => CoRecipe::FORM]);
        $steps   = $serializer->serialize($steps, 'json', ['groups' => CoStep::FORM]);

        return $this->render('user/pages/recipes/update.html.twig', [
            'elem' => $obj,
            'element' => $element,
            'steps' => $steps,
        ]);
    }
}
