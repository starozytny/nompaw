<?php

namespace App\Entity\Enum\Budget;

enum TypeType: int
{
    const Expense = 0;
    const Income = 1;
    const Saving = 2;
    const Deleted = 3;
    const Used = 4;
}
