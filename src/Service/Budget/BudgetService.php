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
        $items = $repository->findBy(['user' => $user, 'year' => $year], ['dateAt' => 'DESC']);
        $categories = $categoryRepository->findBy(['user' => $user]);
        $savings = $categoryRepository->findBy(['user' => $user, 'type' => TypeType::Saving]);
        $savingsItems = $repository->findByUserAndTypeUpToYear($user, TypeType::Saving, $year);
        $savingsUsed = $repository->findByUserAndTypeUpToYear($user, TypeType::Used, $year);
        $recurrences = $recurrentRepository->findBy(['user' => $user]);

        $totalInit = $this->computeCarriedForwardBalance($user, $year, $repository);

        [$monthlyBalances, $monthlySummaries] = $this->computeMonthlySummaries($items, $recurrences, $year, $totalInit);
        $savingsSummaries = $this->computeSavingsSummaries($savings, $savingsItems, $savingsUsed, $year);

        return [
            'donnees' => $serializer->serialize($items, 'json', ['groups' => BuItem::LIST]),
            'categories' => $serializer->serialize($categories, 'json', ['groups' => BuCategory::SELECT]),
            'savings' => $serializer->serialize($savings, 'json', ['groups' => BuCategory::LIST]),
            'savingsItems' => $serializer->serialize($savingsItems, 'json', ['groups' => BuItem::LIST]),
            'savingsUsed' => $serializer->serialize($savingsUsed, 'json', ['groups' => BuItem::LIST]),
            'recurrences' => $serializer->serialize($recurrences, 'json', ['groups' => BuRecurrent::LIST]),
            'initTotal' => $totalInit,
            'monthlyBalances' => $monthlyBalances,
            'monthlySummaries' => $monthlySummaries,
            'savingsSummaries' => $savingsSummaries,
        ];
    }

    /**
     * All monetary accumulation below happens in integer cents rather than float euros, to avoid
     * the rounding drift that repeatedly summing floats over many months/items can introduce.
     * Conversion only happens at the two boundaries: reading a price out of an entity, and writing
     * a final total into the arrays returned to callers (which stay float euros, unchanged contract).
     */
    private static function eurosToCents(?float $euros): int
    {
        return $euros !== null ? (int) round($euros * 100) : 0;
    }

    private static function centsToEuros(int $cents): float
    {
        return $cents / 100;
    }

    /**
     * Balance carried forward from years prior to $year, added to the user's initial budget.
     * Excludes lifecycle-only movements (cancelled recurrence instances, saving usages).
     */
    private function computeCarriedForwardBalance(User $user, int $year, BuItemRepository $repository): float
    {
        $totalInitCents = self::eurosToCents($user->getBudgetInit());

        if ($year > $user->getBudgetYear()) {
            $items = $repository->findBy(['user' => $user]);

            $totalExpenseCents = 0;
            $totalIncomeCents = 0;
            foreach ($items as $item) {
                if ($item->getType() !== TypeType::Used && $item->getType() !== TypeType::Deleted) {
                    if ($item->getYear() < $year) {
                        if ($item->getType() != TypeType::Income) {
                            $totalExpenseCents += self::eurosToCents($item->getPrice());
                        } else {
                            $totalIncomeCents += self::eurosToCents($item->getPrice());
                        }
                    }
                }
            }

            $totalInitCents = $totalInitCents + $totalIncomeCents - $totalExpenseCents;
        }

        return self::centsToEuros($totalInitCents);
    }

    /**
     * Computes, for each of the 12 months of $year:
     *  - the running available balance (expenses and savings lumped together, as they both reduce it)
     *  - the per-type totals shown on the cards (expense/income/saving), plus their "isActive"-filtered
     *    ("real"/"today") variants
     *
     * A recurrence contributes its nominal price to every eligible month unless a real BuItem linked to it
     * (via recurrenceId) exists for that month: a Deleted-marked item means the recurrence was cancelled that
     * month (no contribution at all), any other real item replaces the recurrence's nominal price with its own.
     *
     * @param BuItem[]      $items
     * @param BuRecurrent[] $recurrences
     * @return array{0: float[], 1: array[]} [monthlyBalances, monthlySummaries]
     */
    private function computeMonthlySummaries(array $items, array $recurrences, int $year, float $totalInit): array
    {
        $totalInitCents = self::eurosToCents($totalInit);

        $monthlyExpense = array_fill(0, 12, 0); // balance purposes: Expense + Saving lumped together
        $monthlyIncome = array_fill(0, 12, 0);

        $totalExpense = array_fill(0, 12, 0); // card purposes: Expense/Income/Saving kept separate
        $totalIncome = array_fill(0, 12, 0);
        $totalSaving = array_fill(0, 12, 0);
        $totalExpenseReal = array_fill(0, 12, 0);
        $totalIncomeReal = array_fill(0, 12, 0);
        $totalSavingReal = array_fill(0, 12, 0);

        foreach ($recurrences as $recurrent) {
            $months = $recurrent->getMonths();

            for ($i = 0; $i < 12; $i++) {
                $monthNumber = $i + 1;

                $eligible = $year > $recurrent->getInitYear()
                    || ($recurrent->getInitYear() === $year && $monthNumber >= $recurrent->getInitMonth());
                if (!$eligible || !in_array($monthNumber, $months, true)) {
                    continue;
                }

                $cancelled = false;
                foreach ($items as $item) {
                    if ($item->getRecurrenceId() === $recurrent->getId()
                        && $item->getMonth() === $monthNumber
                        && $item->getType() === TypeType::Deleted) {
                        $cancelled = true;
                        break;
                    }
                }
                if ($cancelled) {
                    continue;
                }

                $price = self::eurosToCents($recurrent->getPrice());
                switch ($recurrent->getType()) {
                    case TypeType::Expense:
                        $monthlyExpense[$i] += $price;
                        $totalExpense[$i] += $price;
                        break;
                    case TypeType::Saving:
                        $monthlyExpense[$i] += $price;
                        $totalSaving[$i] += $price;
                        break;
                    case TypeType::Income:
                        $monthlyIncome[$i] += $price;
                        $totalIncome[$i] += $price;
                        break;
                }
            }
        }

        foreach ($items as $item) {
            $i = $item->getMonth() - 1;
            $price = self::eurosToCents($item->getPrice());
            $isActive = $item->isIsActive();

            switch ($item->getType()) {
                case TypeType::Expense:
                    $monthlyExpense[$i] += $price;
                    $totalExpense[$i] += $price;
                    if ($isActive) {
                        $totalExpenseReal[$i] += $price;
                    }
                    break;
                case TypeType::Saving:
                    $monthlyExpense[$i] += $price;
                    $totalSaving[$i] += $price;
                    if ($isActive) {
                        $totalSavingReal[$i] += $price;
                    }
                    break;
                case TypeType::Income:
                    $monthlyIncome[$i] += $price;
                    $totalIncome[$i] += $price;
                    if ($isActive) {
                        $totalIncomeReal[$i] += $price;
                    }
                    break;
                default:
                    // Deleted (cancelled recurrence instance) and Used (saving withdrawal) items
                    // don't contribute to expense/income/saving totals.
                    break;
            }

            if ($item->getRecurrenceId() !== null) {
                $recurrencePrice = self::eurosToCents($item->getRecurrencePrice());
                switch ($item->getType()) {
                    case TypeType::Expense:
                        $monthlyExpense[$i] -= $recurrencePrice;
                        $totalExpense[$i] -= $recurrencePrice;
                        break;
                    case TypeType::Saving:
                        $monthlyExpense[$i] -= $recurrencePrice;
                        $totalSaving[$i] -= $recurrencePrice;
                        break;
                    case TypeType::Income:
                        $monthlyIncome[$i] -= $recurrencePrice;
                        $totalIncome[$i] -= $recurrencePrice;
                        break;
                }
            }
        }

        $monthlyBalances = [];
        for ($i = 0; $i < 12; $i++) {
            $tmpDispo = ($i === 0 ? $totalInitCents : 0) + $monthlyIncome[$i] - $monthlyExpense[$i];
            $monthlyBalances[$i] = $i === 0 ? $tmpDispo : $monthlyBalances[$i - 1] + $tmpDispo;
        }

        $monthlySummaries = [];
        for ($i = 0; $i < 12; $i++) {
            $initial = $i !== 0 ? $monthlyBalances[$i - 1] : $totalInitCents;
            $totalDispo = $initial + $totalIncome[$i] - ($totalExpense[$i] + $totalSaving[$i]);

            $tmpTotalMinus = $totalExpenseReal[$i] + $totalSavingReal[$i];
            $totalDispoNow = $tmpTotalMinus < 0
                ? $initial + $totalIncomeReal[$i] + $tmpTotalMinus
                : $initial + $totalIncomeReal[$i] - $tmpTotalMinus;

            $monthlySummaries[] = [
                'month' => $i + 1,
                'totalExpense' => self::centsToEuros($totalExpense[$i]),
                'totalIncome' => self::centsToEuros($totalIncome[$i]),
                'totalSaving' => self::centsToEuros($totalSaving[$i]),
                'totalExpenseReal' => self::centsToEuros($totalExpenseReal[$i]),
                'totalIncomeReal' => self::centsToEuros($totalIncomeReal[$i]),
                'totalSavingReal' => self::centsToEuros($totalSavingReal[$i]),
                'initial' => self::centsToEuros($initial),
                'totalDispo' => self::centsToEuros($totalDispo),
                'totalDispoNow' => self::centsToEuros($totalDispoNow),
            ];
        }

        return [array_map([self::class, 'centsToEuros'], $monthlyBalances), $monthlySummaries];
    }

    /**
     * Per savings-category, cumulative available/used balance for each month of $year.
     * $savingsItems/$savingsUsed are expected to already be bounded to years <= $year.
     *
     * @param BuCategory[] $savingsCategories
     * @param BuItem[]     $savingsItems
     * @param BuItem[]     $savingsUsed
     */
    private function computeSavingsSummaries(array $savingsCategories, array $savingsItems, array $savingsUsed, int $year): array
    {
        $summaries = [];
        foreach ($savingsCategories as $category) {
            $summaries[] = [
                'id' => $category->getId(),
                'name' => $category->getName(),
                'goal' => $category->getGoal(),
                'totalByMonth' => array_map([self::class, 'centsToEuros'], $this->cumulativeByMonth($savingsItems, $category, $year)),
                'usedByMonth' => array_map([self::class, 'centsToEuros'], $this->cumulativeByMonth($savingsUsed, $category, $year)),
            ];
        }

        return $summaries;
    }

    /**
     * @param BuItem[] $items
     * @return int[] 12 cumulative totals in cents, one per month of $year
     */
    private function cumulativeByMonth(array $items, BuCategory $category, int $year): array
    {
        $byMonth = array_fill(0, 12, 0);

        foreach ($items as $item) {
            if ($item->getCategory() === null || $item->getCategory()->getId() !== $category->getId()) {
                continue;
            }

            $price = self::eurosToCents($item->getPrice());
            for ($i = 0; $i < 12; $i++) {
                $monthNumber = $i + 1;
                if ($item->getYear() < $year || ($item->getYear() === $year && $item->getMonth() <= $monthNumber)) {
                    $byMonth[$i] += $price;
                }
            }
        }

        return $byMonth;
    }
}
