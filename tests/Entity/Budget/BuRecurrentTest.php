<?php

namespace App\Tests\Entity\Budget;

use App\Entity\Budget\BuRecurrent;
use App\Entity\Enum\Budget\TypeType;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Validation;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class BuRecurrentTest extends TestCase
{
    private ValidatorInterface $validator;

    protected function setUp(): void
    {
        $this->validator = Validation::createValidatorBuilder()
            ->enableAttributeMapping()
            ->getValidator();
    }

    private function validRecurrent(): BuRecurrent
    {
        return (new BuRecurrent())
            ->setType(TypeType::Expense)
            ->setPrice(850.0)
            ->setName('Loyer')
            ->setMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
            ->setInitYear(2026)
            ->setInitMonth(1)
        ;
    }

    public function testValidRecurrentHasNoViolation(): void
    {
        self::assertCount(0, $this->validator->validate($this->validRecurrent()));
    }

    public function testEmptyMonthsIsRejected(): void
    {
        $recurrent = $this->validRecurrent()->setMonths([]);

        self::assertGreaterThan(0, count($this->validator->validate($recurrent)));
    }

    public function testOutOfRangeMonthIsRejected(): void
    {
        $recurrent = $this->validRecurrent()->setMonths([1, 13]);

        self::assertGreaterThan(0, count($this->validator->validate($recurrent)));
    }

    public function testInitMonthOutOfRangeIsRejected(): void
    {
        $recurrent = $this->validRecurrent()->setInitMonth(0);

        self::assertGreaterThan(0, count($this->validator->validate($recurrent)));
    }

    public function testLifecycleOnlyTypeIsRejected(): void
    {
        $recurrent = $this->validRecurrent()->setType(TypeType::Used);

        self::assertGreaterThan(0, count($this->validator->validate($recurrent)));
    }
}
