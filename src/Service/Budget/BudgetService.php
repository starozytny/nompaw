<?php

namespace App\Service\Budget;

use App\Entity\Budget\BuCategory;
use App\Entity\Budget\BuItem;
use App\Entity\Budget\BuRecurrent;
use App\Entity\Enum\Budget\TypeType;
use App\Entity\Main\User;
use App\Repository\Budget\BuCategoryRepository;
use App\Repository\Budget\BuItemRepository;
use App\Repository\Budget\BuRecurrentRepository;
use Symfony\Component\Serializer\SerializerInterface;

class BudgetService
{
    public function getData(SerializerInterface  $serializer, User $user, int $year,
                            BuItemRepository     $repository, BuRecurrentRepository $recurrentRepository,
                            BuCategoryRepository $categoryRepository): array
    {
        $data = $repository->findBy(['user' => $user, 'year' => $year], ['dateAt' => 'DESC']);
        $categories = $categoryRepository->findBy(['user' => $user]);
        $savings = $categoryRepository->findBy(['user' => $user, 'type' => TypeType::Saving]);
        $savingsItems = $repository->findBy(['user' => $user, 'type' => TypeType::Saving]);
        $savingsUsed = $repository->findBy(['user' => $user, 'type' => TypeType::Used]);
        $recurrences = $recurrentRepository->findBy(['user' => $user]);

        $totalInit = $user->getBudgetInit();
        if ($year > $user->getBudgetYear()) {
            $items = $repository->findBy(['user' => $user]);

            $totalExpense = 0;
            $totalIncome = 0;
            foreach ($items as $item) {
                if ($item->getType() !== TypeType::Used && $item->getType() !== TypeType::Deleted) {
                    if ($item->getYear() < $year) {
                        if ($item->getType() != TypeType::Income) {
                            $totalExpense += $item->getPrice();
                        } else {
                            $totalIncome += $item->getPrice();
                        }
                    }
                }
            }

            $totalInit = $totalInit + $totalIncome - $totalExpense;
        }

        $data = $serializer->serialize($data, 'json', ['groups' => BuItem::LIST]);
        $categories = $serializer->serialize($categories, 'json', ['groups' => BuCategory::SELECT]);
        $savings = $serializer->serialize($savings, 'json', ['groups' => BuCategory::LIST]);
        $savingsItems = $serializer->serialize($savingsItems, 'json', ['groups' => BuItem::LIST]);
        $savingsUsed = $serializer->serialize($savingsUsed, 'json', ['groups' => BuItem::LIST]);
        $recurrences = $serializer->serialize($recurrences, 'json', ['groups' => BuRecurrent::LIST]);

        return [$data, $categories, $savings, $savingsItems, $savingsUsed, $recurrences, $totalInit];
    }
}
