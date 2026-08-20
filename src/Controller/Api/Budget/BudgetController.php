<?php

namespace App\Controller\Api\Budget;

use App\Entity\Main\User;
use App\Repository\Budget\BuCategoryRepository;
use App\Repository\Budget\BuItemRepository;
use App\Repository\Budget\BuRecurrentRepository;
use App\Service\Api\ApiResponse;
use App\Service\Budget\BudgetService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/budget', name: 'api_budget_')]
class BudgetController extends AbstractController
{
    #[Route('/planning/{year}', name: 'index', methods: 'GET')]
    public function list($year, BuItemRepository $repository, BuRecurrentRepository $recurrentRepository,
                         BuCategoryRepository $categoryRepository, SerializerInterface $serializer,
                         ApiResponse $apiResponse, BudgetService $budgetService): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if($year < $user->getBudgetYear()){
            $year = $user->getBudgetYear();
        }

        $budget = $budgetService->getData($serializer, $user, $year, $repository, $recurrentRepository, $categoryRepository);

        $today = new \DateTime();

        return $apiResponse->apiJsonResponseCustom([
            'userBudgetYear' => $user->getBudgetYear(),
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
