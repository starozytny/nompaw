<?php

namespace App\Controller\InternApi\Budget;

use App\Entity\Main\User;
use App\Repository\Budget\BuCategoryRepository;
use App\Repository\Budget\BuItemRepository;
use App\Repository\Budget\BuRecurrentRepository;
use App\Service\Api\ApiResponse;
use App\Service\Budget\BudgetService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/intern/api/budget/planning', name: 'intern_api_budget_planning_')]
class PlanningController extends AbstractController
{
    #[Route('/{year}', name: 'index', options: ['expose' => true], methods: 'GET')]
    public function index(int $year, BuItemRepository $repository, BuRecurrentRepository $recurrentRepository,
                          BuCategoryRepository $categoryRepository, SerializerInterface $serializer,
                          ApiResponse $apiResponse, BudgetService $budgetService): Response
    {
        /** @var User $user */
        $user = $this->getUser();
        if ($year < $user->getBudgetYear()) {
            $year = $user->getBudgetYear();
        }

        $budget = $budgetService->getData($serializer, $user, $year, $repository, $recurrentRepository, $categoryRepository);

        $today = new \DateTime();

        return $apiResponse->apiJsonResponseCustom([
            'year' => $year,
            'month' => $year != $today->format('Y') ? 1 : $today->format('m'),
            'donnees' => json_decode($budget['donnees']),
            'categories' => json_decode($budget['categories']),
            'savings' => json_decode($budget['savings']),
            'savingsItems' => json_decode($budget['savingsItems']),
            'savingsUsed' => json_decode($budget['savingsUsed']),
            'recurrences' => json_decode($budget['recurrences']),
            'initTotal' => $budget['initTotal'],
            'monthlyBalances' => $budget['monthlyBalances'],
            'monthlySummaries' => $budget['monthlySummaries'],
            'savingsSummaries' => $budget['savingsSummaries'],
        ]);
    }
}
