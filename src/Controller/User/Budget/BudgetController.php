<?php

namespace App\Controller\User\Budget;

use App\Entity\Main\User;
use App\Repository\Budget\BuCategoryRepository;
use App\Repository\Budget\BuItemRepository;
use App\Repository\Budget\BuRecurrentRepository;
use App\Service\Budget\BudgetService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/espace-membre/planificateur', name: 'user_budget_')]
class BudgetController extends AbstractController
{
    #[Route('/planning/{year}', name: 'index', options: ['expose' => true])]
    public function list($year, BuItemRepository $repository, BuRecurrentRepository $recurrentRepository,
                         BuCategoryRepository $categoryRepository, SerializerInterface $serializer,
                         BudgetService $budgetService): Response
    {
        /** @var User $user */
        $user = $this->getUser();
        if($year < $user->getBudgetYear()){
            return $this->redirectToRoute('user_budget_index', ['year' => $user->getBudgetYear()]);
        }

        [
            $data,
            $categories,
            $savings,
            $savingsItems,
            $savingsUsed,
            $recurrences,
            $totalInit
        ] = $budgetService->getData($serializer, $user, $year, $repository, $recurrentRepository, $categoryRepository);

        $today = new \DateTime();

        return $this->render('user/pages/budget/index.html.twig', [
            'year' => $year,
            'month' => $year != $today->format('Y') ? 1 : $today->format('m'),
            'donnees' => $data,
            'categories' => $categories,
            'savings' => $savings,
            'savingsItems' => $savingsItems,
            'savingsUsed' => $savingsUsed,
            'recurrences' => $recurrences,
            'initTotal' => $totalInit,
        ]);
    }
}
