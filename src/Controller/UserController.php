<?php

namespace App\Controller;

use App\Entity\Cook\CoRecipe;
use App\Entity\Main\User;
use App\Repository\Cook\CoRecipeRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
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
    public function list(): Response
    {
        return $this->render('user/pages/recipes/index.html.twig');
    }

    #[Route('/recettes/recette/{slug}', name: 'recipes_read', options: ['expose' => true])]
    public function read($slug, CoRecipeRepository $repository, SerializerInterface $serializer): Response
    {
        $obj = $repository->findOneBy(['slug' => $slug]);

        $elem = $serializer->serialize($obj, 'json', ['groups' => CoRecipe::READ]);

        return $this->render('user/pages/recipes/read.html.twig', [
            'elem' => $obj,
            'element' => $elem
        ]);
    }

    #[Route('/recettes/ajouter', name: 'recipes_create')]
    public function create(): Response
    {
        return $this->render('user/pages/recipes/create.html.twig');
    }
}
