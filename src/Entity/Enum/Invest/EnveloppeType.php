<?php

namespace App\Entity\Enum\Invest;

enum EnveloppeType: int
{
    case Pea = 0;
    case Cto = 1;
    case Av = 2;
    case Livret = 3;
    case Autre = 4;
}
