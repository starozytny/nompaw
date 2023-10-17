<?php

namespace App\Controller\User\Budget;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/espace-membre/planificateur', name: 'user_budget_')]
class BudgetController extends AbstractController
{
    #[Route('/', name: 'index', options: ['expose' => true])]
    public function list(): Response
    {
        return $this->render('user/pages/budget/index.html.twig');
    }
}
