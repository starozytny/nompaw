<?php

namespace App\Tests\Service\Budget;

use App\Entity\Budget\BuCategory;
use App\Entity\Budget\BuItem;
use App\Entity\Budget\BuRecurrent;
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
    private function makeItem(int $year, int $month, TypeType $type, float $price, bool $isActive = true): BuItem
    {
        return (new BuItem())
            ->setYear($year)
            ->setMonth($month)
            ->setType($type)
            ->setLastType($type)
            ->setPrice($price)
            ->setName('x')
            ->setIsActive($isActive)
            ->setDateAt(new \DateTime())
        ;
    }

    private function makeRecurrent(TypeType $type, float $price, array $months, int $initYear, int $initMonth): BuRecurrent
    {
        return (new BuRecurrent())
            ->setType($type)
            ->setPrice($price)
            ->setName('r')
            ->setMonths($months)
            ->setInitYear($initYear)
            ->setInitMonth($initMonth)
        ;
    }

    private function setId(object $entity, int $id): void
    {
        $ref = new \ReflectionProperty($entity, 'id');
        $ref->setAccessible(true);
        $ref->setValue($entity, $id);
    }

    /**
     * Runs BudgetService::getData() against fully mocked repositories, so each test only
     * has to describe the entities relevant to the scenario it verifies.
     */
    private function runGetData(
        User $user,
        int $year,
        array $items = [],
        array $recurrences = [],
        array $categories = [],
        array $savingsCategories = [],
        array $savingsItems = [],
        array $savingsUsed = [],
        array $allItemsForCarryForward = []
    ): array {
        $itemRepository = $this->createMock(BuItemRepository::class);
        $itemRepository->method('findBy')->willReturnCallback(
            static fn (array $criteria) => array_key_exists('year', $criteria) ? $items : $allItemsForCarryForward
        );
        $itemRepository->method('findByUserAndTypeUpToYear')->willReturnCallback(
            static fn (User $u, TypeType $type) => $type === TypeType::Saving ? $savingsItems : $savingsUsed
        );

        $categoryRepository = $this->createMock(BuCategoryRepository::class);
        $categoryRepository->method('findBy')->willReturnCallback(
            static fn (array $criteria) => array_key_exists('type', $criteria) ? $savingsCategories : $categories
        );

        $recurrentRepository = $this->createMock(BuRecurrentRepository::class);
        $recurrentRepository->method('findBy')->willReturn($recurrences);

        $serializer = $this->createMock(SerializerInterface::class);
        $serializer->method('serialize')->willReturn('[]');

        return (new BudgetService())->getData(
            $serializer, $user, $year, $itemRepository, $recurrentRepository, $categoryRepository
        );
    }

    public function testCarriedForwardBalanceSumsPastYearsOnly(): void
    {
        $user = (new User())->setBudgetInit(1000.0)->setBudgetYear(2024);

        // Items from before the requested year: should be included.
        $expense2024 = $this->makeItem(2024, 1, TypeType::Expense, 200.0);
        $income2024 = $this->makeItem(2024, 1, TypeType::Income, 500.0);

        // Items that must be excluded from the carry-forward calculation:
        $itemInRequestedYear = $this->makeItem(2025, 1, TypeType::Expense, 9999.0); // not strictly < year
        $deletedItem = $this->makeItem(2024, 1, TypeType::Deleted, 9999.0);
        $usedSavingItem = $this->makeItem(2024, 1, TypeType::Used, 9999.0);

        $result = $this->runGetData(
            $user, 2025,
            allItemsForCarryForward: [$expense2024, $income2024, $itemInRequestedYear, $deletedItem, $usedSavingItem]
        );

        // 1000 (initial) + 500 (income 2024) - 200 (expense 2024) = 1300.
        // The 2025 item, the deleted item and the used-saving item must not affect the total.
        self::assertSame(1300.0, $result['initTotal']);
    }

    public function testNoCarryForwardWhenYearIsNotAfterBudgetYear(): void
    {
        $user = (new User())->setBudgetInit(1000.0)->setBudgetYear(2026);

        $result = $this->runGetData($user, 2026);

        self::assertSame(1000.0, $result['initTotal']);
    }

    public function testRecurrenceOnlyContributesFromItsStartMonth(): void
    {
        $user = (new User())->setBudgetInit(1000.0)->setBudgetYear(2026);
        $rent = $this->makeRecurrent(TypeType::Expense, 100.0, range(1, 12), 2026, 3);

        $result = $this->runGetData($user, 2026, recurrences: [$rent]);

        // January and February: rent not due yet.
        self::assertSame(0.0, $result['monthlySummaries'][0]['totalExpense']);
        self::assertSame(0.0, $result['monthlySummaries'][1]['totalExpense']);
        self::assertSame(1000.0, $result['monthlyBalances'][1]);

        // March onward: rent applies, running balance decreases by 100 each month.
        self::assertSame(100.0, $result['monthlySummaries'][2]['totalExpense']);
        self::assertSame(900.0, $result['monthlyBalances'][2]); // March
        self::assertSame(0.0, $result['monthlyBalances'][11]); // December: 10 months x 100 deducted
    }

    public function testCancelledRecurrenceInstanceIsExcludedForThatMonthOnly(): void
    {
        $user = (new User())->setBudgetInit(1000.0)->setBudgetYear(2026);
        $rent = $this->makeRecurrent(TypeType::Expense, 100.0, range(1, 12), 2026, 3);
        $this->setId($rent, 42);

        // The user cancelled the April instance of the recurrence.
        $cancelledApril = $this->makeItem(2026, 4, TypeType::Deleted, 100.0);
        $cancelledApril->setRecurrenceId(42);

        $result = $this->runGetData($user, 2026, items: [$cancelledApril], recurrences: [$rent]);

        self::assertSame(100.0, $result['monthlySummaries'][2]['totalExpense']); // March: unaffected
        self::assertSame(0.0, $result['monthlySummaries'][3]['totalExpense']); // April: cancelled
        self::assertSame(100.0, $result['monthlySummaries'][4]['totalExpense']); // May: back to normal
        // Balance doesn't move between March and April since the cancelled month contributes nothing.
        self::assertSame($result['monthlyBalances'][2], $result['monthlyBalances'][3]);
    }

    public function testRealItemOverridesRecurrenceNominalPrice(): void
    {
        $user = (new User())->setBudgetInit(1000.0)->setBudgetYear(2026);
        $subscription = $this->makeRecurrent(TypeType::Expense, 50.0, [6], 2026, 1);
        $this->setId($subscription, 7);

        // The user activated June's instance but edited the amount to 70.
        $activated = $this->makeItem(2026, 6, TypeType::Expense, 70.0, isActive: true);
        $activated->setRecurrenceId(7)->setRecurrencePrice(50.0);

        $result = $this->runGetData($user, 2026, items: [$activated], recurrences: [$subscription]);

        // Baseline (50) + real item (70) - nominal recurrence price (50) = 70: the real price wins, no double counting.
        self::assertSame(70.0, $result['monthlySummaries'][5]['totalExpense']);
        self::assertSame(70.0, $result['monthlySummaries'][5]['totalExpenseReal']);
    }

    public function testSavingsContributedOneYearAreAvailableTheNext(): void
    {
        $user = (new User())->setBudgetInit(0.0)->setBudgetYear(2026);
        $category = (new BuCategory())->setType(TypeType::Saving)->setName('Voyage')->setGoal(1000.0);
        $this->setId($category, 5);

        $contribution2025 = $this->makeItem(2025, 6, TypeType::Saving, 300.0);
        $contribution2025->setCategory($category);

        $used2026 = $this->makeItem(2026, 2, TypeType::Used, 100.0);
        $used2026->setCategory($category);

        $result = $this->runGetData(
            $user, 2026,
            savingsCategories: [$category],
            savingsItems: [$contribution2025],
            savingsUsed: [$used2026]
        );

        $summary = $result['savingsSummaries'][0];
        self::assertSame(5, $summary['id']);
        // A prior year's contribution is available from January onward.
        self::assertSame(300.0, $summary['totalByMonth'][0]);
        self::assertSame(300.0, $summary['totalByMonth'][11]);
        // The February usage only counts from February onward.
        self::assertSame(0.0, $summary['usedByMonth'][0]);
        self::assertSame(100.0, $summary['usedByMonth'][1]);
        self::assertSame(100.0, $summary['usedByMonth'][11]);
    }

    public function testMonthlyBalanceCanGoNegative(): void
    {
        $user = (new User())->setBudgetInit(100.0)->setBudgetYear(2026);
        $bigExpense = $this->makeItem(2026, 1, TypeType::Expense, 500.0, isActive: true);

        $result = $this->runGetData($user, 2026, items: [$bigExpense]);

        self::assertSame(-400.0, $result['monthlyBalances'][0]);
        self::assertSame(-400.0, $result['monthlySummaries'][0]['totalDispo']);
        self::assertSame(-400.0, $result['monthlySummaries'][0]['totalDispoNow']);
    }
}
