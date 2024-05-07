<?php

namespace App\Entity\Enum\Crypto;

enum TypeType: int
{
    const Achat = 0;
    const Vente = 1;
    const Depot = 2;
    const Retrait = 3;
    const Recuperation = 4;
    const Stacking = 5;
    const Transfert = 6;
}
