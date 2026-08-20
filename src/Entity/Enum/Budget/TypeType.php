<?php

namespace App\Entity\Enum\Budget;

enum TypeType: int
{
    case Expense = 0;
    case Income = 1;
    case Saving = 2;
    case Deleted = 3;
    case Used = 4;
}
