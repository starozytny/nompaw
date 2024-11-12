<?php

namespace App\Controller\Api\Budget;

use App\Entity\Main\User;
use App\Repository\Budget\BuCategoryRepository;
use App\Repository\Budget\BuItemRepository;
use App\Repository\Budget\BuRecurrentRepository;
use App\Service\ApiResponse;
use App\Service\Budget\BudgetService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/budget', name: 'api_budget_')]
class BudgetController extends AbstractController
{
    #[Route('/planning', name: 'index', methods: 'GET')]
    public function list(BuItemRepository $repository, BuRecurrentRepository $recurrentRepository,
                         BuCategoryRepository $categoryRepository, SerializerInterface $serializer,
                         ApiResponse $apiResponse, BudgetService $budgetService): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $year = (new \DateTime())->format('Y');
        if($year < $user->getBudgetYear()){
            $year = $user->getBudgetYear();
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

        return $apiResponse->apiJsonResponseCustom([
            'year' => $year,
            'month' => $year != $today->format('Y') ? 1 : $today->format('m'),
            'donnees' => json_decode($data),
            'categories' => json_decode($categories),
            'savings' => json_decode($savings),
            'savingsItems' => json_decode($savingsItems),
            'savingsUsed' => json_decode($savingsUsed),
            'recurrences' => json_decode($recurrences),
            'initTotal' => $totalInit,
        ]);
    }
}
