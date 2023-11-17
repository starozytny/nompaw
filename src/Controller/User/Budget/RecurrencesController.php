<?php

namespace App\Controller\User\Budget;

use App\Entity\Budget\BuCategory;
use App\Entity\Budget\BuRecurrent;
use App\Repository\Budget\BuCategoryRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/espace-membre/planificateur/recurrences', name: 'user_budget_recurrences_')]
class RecurrencesController extends AbstractController
{
    #[Route('/', name: 'index', options: ['expose' => true])]
    public function index(Request $request): Response
    {
        return $this->render('user/pages/budget/recurrences/index.html.twig', ['highlight' => $request->query->get('h')]);
    }

    #[Route('/ajouter', name: 'create')]
    public function create(BuCategoryRepository $categoryRepository, SerializerInterface $serializer): Response
    {
        $categories  = $categoryRepository->findBy(['user' => $this->getUser()]);
        $categories = $serializer->serialize($categories, 'json', ['groups' => BuCategory::SELECT]);

        return $this->render('user/pages/budget/recurrences/create.html.twig', [
            'categories' => $categories
        ]);
    }

    #[Route('/{id}', name: 'update', options: ['expose' => true])]
    public function update(BuRecurrent $elem, BuCategoryRepository $categoryRepository, SerializerInterface $serializer): Response
    {
        $categories  = $categoryRepository->findBy(['user' => $this->getUser()]);

        $obj        = $serializer->serialize($elem,       'json', ['groups' => BuRecurrent::FORM]);
        $categories = $serializer->serialize($categories, 'json', ['groups' => BuCategory::SELECT]);

        return $this->render('user/pages/budget/recurrences/update.html.twig', [
            'elem' => $elem,
            'obj' => $obj,
            'categories' => $categories
        ]);
    }
}
