<?php

namespace App\Tests\Service\Budget;

use App\Entity\Budget\BuItem;
use App\Entity\Enum\Budget\TypeType;
use App\Entity\Main\User;
use App\Repository\Budget\BuCategoryRepository;
use App\Repository\Budget\BuItemRepository;
use App\Repository\Budget\BuRecurrentRepository;
use App\Service\Budget\BudgetService;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Serializer\SerializerInterface;

class BudgetServiceTest extends TestCase
{
    private function makeItem(int $year, TypeType $type, float $price): BuItem
    {
        return (new BuItem())
            ->setYear($year)
            ->setMonth(1)
            ->setType($type)
            ->setLastType($type)
            ->setPrice($price)
            ->setName('x')
            ->setIsActive(true)
            ->setDateAt(new \DateTime())
        ;
    }

    public function testCarriedForwardBalanceSumsPastYearsOnly(): void
    {
        $user = (new User())->setBudgetInit(1000.0)->setBudgetYear(2024);

        // Items from before the requested year: should be included.
        $expense2024 = $this->makeItem(2024, TypeType::Expense, 200.0);
        $income2024 = $this->makeItem(2024, TypeType::Income, 500.0);

        // Items that must be excluded from the carry-forward calculation:
        $itemInRequestedYear = $this->makeItem(2025, TypeType::Expense, 9999.0); // not strictly < year
        $deletedItem = $this->makeItem(2024, TypeType::Deleted, 9999.0);
        $usedSavingItem = $this->makeItem(2024, TypeType::Used, 9999.0);

        $allItems = [$expense2024, $income2024, $itemInRequestedYear, $deletedItem, $usedSavingItem];

        $itemRepository = $this->createMock(BuItemRepository::class);
        $itemRepository->method('findBy')->willReturnCallback(
            function (array $criteria) use ($allItems) {
                if (array_key_exists('year', $criteria)) {
                    return [];
                }
                if (($criteria['type'] ?? null) !== null) {
                    return [];
                }

                // Plain ['user' => $user] lookup used for the carry-forward computation.
                return $allItems;
            }
        );

        $categoryRepository = $this->createMock(BuCategoryRepository::class);
        $categoryRepository->method('findBy')->willReturn([]);

        $recurrentRepository = $this->createMock(BuRecurrentRepository::class);
        $recurrentRepository->method('findBy')->willReturn([]);

        $serializer = $this->createMock(SerializerInterface::class);
        $serializer->method('serialize')->willReturn('[]');

        $service = new BudgetService();

        [, , , , , , $totalInit] = $service->getData(
            $serializer, $user, 2025, $itemRepository, $recurrentRepository, $categoryRepository
        );

        // 1000 (initial) + 500 (income 2024) - 200 (expense 2024) = 1300.
        // The 2025 item, the deleted item and the used-saving item must not affect the total.
        self::assertSame(1300.0, $totalInit);
    }

    public function testNoCarryForwardWhenYearIsNotAfterBudgetYear(): void
    {
        $user = (new User())->setBudgetInit(1000.0)->setBudgetYear(2026);

        $itemRepository = $this->createMock(BuItemRepository::class);
        $itemRepository->method('findBy')->willReturn([]);

        $categoryRepository = $this->createMock(BuCategoryRepository::class);
        $categoryRepository->method('findBy')->willReturn([]);

        $recurrentRepository = $this->createMock(BuRecurrentRepository::class);
        $recurrentRepository->method('findBy')->willReturn([]);

        $serializer = $this->createMock(SerializerInterface::class);
        $serializer->method('serialize')->willReturn('[]');

        $service = new BudgetService();

        [, , , , , , $totalInit] = $service->getData(
            $serializer, $user, 2026, $itemRepository, $recurrentRepository, $categoryRepository
        );

        self::assertSame(1000.0, $totalInit);
    }
}
