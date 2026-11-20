<?php

namespace App\Entity\Enum\Rando;

enum DifficultyType: int
{
    case Facile = 0;
    case Modere = 1;
    case Difficile = 2;
    case Expert = 3;
}
