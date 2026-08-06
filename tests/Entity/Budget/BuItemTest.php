<?php

namespace App\Tests\Entity\Budget;

use App\Entity\Budget\BuItem;
use App\Entity\Enum\Budget\TypeType;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Validation;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class BuItemTest extends TestCase
{
    private ValidatorInterface $validator;

    protected function setUp(): void
    {
        $this->validator = Validation::createValidatorBuilder()
            ->enableAttributeMapping()
            ->getValidator();
    }

    private function validItem(): BuItem
    {
        return (new BuItem())
            ->setYear(2026)
            ->setMonth(6)
            ->setType(TypeType::Expense)
            ->setLastType(TypeType::Expense)
            ->setPrice(42.5)
            ->setName('Courses')
            ->setIsActive(true)
            ->setDateAt(new \DateTime())
        ;
    }

    public function testValidItemHasNoViolation(): void
    {
        self::assertCount(0, $this->validator->validate($this->validItem()));
    }

    public function testBlankNameIsRejected(): void
    {
        $item = $this->validItem()->setName('');

        self::assertGreaterThan(0, count($this->validator->validate($item)));
    }

    public function testMonthOutOfRangeIsRejected(): void
    {
        $item = $this->validItem()->setMonth(13);

        self::assertGreaterThan(0, count($this->validator->validate($item)));
    }

    public function testMissingTypeIsRejected(): void
    {
        $item = $this->validItem()->setType(null);

        self::assertGreaterThan(0, count($this->validator->validate($item)));
    }

    public function testMissingDateAtIsRejected(): void
    {
        $item = $this->validItem();
        $ref = new \ReflectionProperty(BuItem::class, 'dateAt');
        $ref->setAccessible(true);
        $ref->setValue($item, null);

        self::assertGreaterThan(0, count($this->validator->validate($item)));
    }

    public function testUnknownRawTypeValueDoesNotResolveToACase(): void
    {
        // Mirrors what DataBudget does when the client sends an out-of-range type.
        self::assertNull(TypeType::tryFrom(99));
    }

    /**
     * @dataProvider typeIconProvider
     */
    public function testGetTypeIconMatchesTheType(TypeType $type, string $expectedIcon): void
    {
        $item = $this->validItem()->setType($type);

        self::assertSame($expectedIcon, $item->getTypeIcon());
    }

    public static function typeIconProvider(): array
    {
        return [
            'expense' => [TypeType::Expense, 'minus'],
            'income' => [TypeType::Income, 'add'],
            'saving' => [TypeType::Saving, 'time'],
            'deleted' => [TypeType::Deleted, 'close'],
            'used' => [TypeType::Used, 'arrow-swap-horizontal'],
        ];
    }
}
