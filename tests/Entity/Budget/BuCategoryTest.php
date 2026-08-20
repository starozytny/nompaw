<?php

namespace App\Tests\Entity\Budget;

use App\Entity\Budget\BuCategory;
use App\Entity\Enum\Budget\TypeType;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Validation;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class BuCategoryTest extends TestCase
{
    private ValidatorInterface $validator;

    protected function setUp(): void
    {
        $this->validator = Validation::createValidatorBuilder()
            ->enableAttributeMapping()
            ->getValidator();
    }

    private function validCategory(): BuCategory
    {
        return (new BuCategory())
            ->setType(TypeType::Expense)
            ->setName('Alimentation')
        ;
    }

    public function testValidCategoryHasNoViolation(): void
    {
        self::assertCount(0, $this->validator->validate($this->validCategory()));
    }

    public function testBlankNameIsRejected(): void
    {
        $category = $this->validCategory()->setName('');

        self::assertGreaterThan(0, count($this->validator->validate($category)));
    }

    public function testMissingTypeIsRejected(): void
    {
        $category = $this->validCategory()->setType(null);

        self::assertGreaterThan(0, count($this->validator->validate($category)));
    }

    /**
     * Deleted/Used only make sense as an item lifecycle marker, never as a category type.
     */
    public function testLifecycleOnlyTypesAreRejectedAsCategoryType(): void
    {
        $category = $this->validCategory()->setType(TypeType::Deleted);

        self::assertGreaterThan(0, count($this->validator->validate($category)));
    }

    public function testNullGoalIsAllowed(): void
    {
        $category = $this->validCategory()->setGoal(null);

        self::assertCount(0, $this->validator->validate($category));
    }
}
