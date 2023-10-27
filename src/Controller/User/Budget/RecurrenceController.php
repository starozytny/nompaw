<?php

namespace App\Controller\User\Budget;

use App\Entity\Budget\BuRecurrent;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/espace-membre/planificateur/recurrences', name: 'user_budget_recurrences_')]
class RecurrenceController extends AbstractController
{
    #[Route('/', name: 'index', options: ['expose' => true])]
    public function index(Request $request): Response
    {
        return $this->render('user/pages/budget/recurrences/index.html.twig', ['highlight' => $request->query->get('h')]);
    }

    #[Route('/ajouter', name: 'create')]
    public function create(): Response
    {
        return $this->render('user/pages/budget/recurrences/create.html.twig');
    }

    #[Route('/{id}', name: 'update', options: ['expose' => true])]
    public function update(BuRecurrent $elem, SerializerInterface $serializer): Response
    {
        $obj = $serializer->serialize($elem, 'json', ['groups' => BuRecurrent::FORM]);
        return $this->render('user/pages/budget/recurrences/update.html.twig', ['elem' => $elem, 'obj' => $obj]);
    }
}
