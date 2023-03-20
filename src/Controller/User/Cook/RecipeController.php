<?php

namespace App\Controller\User\Cook;

use App\Entity\Cook\CoCommentary;
use App\Entity\Cook\CoIngredient;
use App\Entity\Cook\CoRecipe;
use App\Entity\Cook\CoStep;
use App\Entity\Enum\Cook\CookStatut;
use App\Entity\Main\User;
use App\Repository\Cook\CoCommentaryRepository;
use App\Repository\Cook\CoIngredientRepository;
use App\Repository\Cook\CoRecipeRepository;
use App\Repository\Cook\CoStepRepository;
use App\Repository\Main\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/espace-membre/recettes', name: 'user_recipes_')]
class RecipeController extends AbstractController
{
    #[Route('/', name: 'index', options: ['expose' => true])]
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

    #[Route('/recette/{slug}', name: 'read', options: ['expose' => true])]
    public function read($slug, CoRecipeRepository $repository, CoStepRepository $stepRepository,
                         CoIngredientRepository $ingredientRepository, CoCommentaryRepository $commentaryRepository,
                         SerializerInterface $serializer): Response
    {
        $obj   = $repository->findOneBy(['slug' => $slug]);
        $steps = $stepRepository->findBy(['recipe' => $obj]);
        $ingre = $ingredientRepository->findBy(['recipe' => $obj]);
        $coms  = $commentaryRepository->findBy(['recipe' => $obj]);

        $elem  = $serializer->serialize($obj,   'json', ['groups' => CoRecipe::READ]);
        $steps = $serializer->serialize($steps, 'json', ['groups' => CoStep::FORM]);
        $ingre = $serializer->serialize($ingre, 'json', ['groups' => CoIngredient::FORM]);
        $coms  = $serializer->serialize($coms,  'json', ['groups' => CoCommentary::READ]);

        return $this->render('user/pages/recipes/read.html.twig', [
            'elem' => $obj,
            'element' => $elem,
            'steps' => $steps,
            'ingre' => $ingre,
            'coms' => $coms,
            'stepsObject' => $stepRepository->findBy(['recipe' => $obj])
        ]);
    }

    #[Route('/ajouter', name: 'create')]
    public function create(): Response
    {
        return $this->render('user/pages/recipes/create.html.twig');
    }

    #[Route('/modifier/{slug}', name: 'update', options: ['expose' => true])]
    public function update($slug, CoRecipeRepository $repository, SerializerInterface $serializer): Response
    {
        $obj   = $repository->findOneBy(['slug' => $slug]);

        if($obj->getAuthor()->getId() != $this->getUser()->getId()){
            throw new AccessDeniedException("Vous n'avez pas l'autorisation d'accéder à cette page.");
        }

        $element = $serializer->serialize($obj,   'json', ['groups' => CoRecipe::FORM]);

        return $this->render('user/pages/recipes/update.html.twig', [
            'elem' => $obj,
            'element' => $element,
        ]);
    }
}
